"""
NBSC PRIME-HRM Intelligence Hub — Applicants API Views
"""
import os
import json
from datetime import datetime
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from core.response import api_success, api_error
from core.mongo import init_mongo
from core.pagination import paginate_queryset
from apps.accounts.decorators import login_required_api, role_required
from apps.accounts.models import User
from apps.vacancies.models import Vacancy
from .models import Application


def _parse_json(request):
    try:
        return json.loads(request.body.decode('utf-8'))
    except Exception:
        return {}


@csrf_exempt
def application_submit_view(request):
    """
    POST: Submit application. Accepts JSON or multipart/form-data with file attachments.
    """
    init_mongo()
    if request.method != 'POST':
        return api_error("Method not allowed.", status=405)

    is_multipart = request.content_type and 'multipart/form-data' in request.content_type

    if is_multipart:
        data = request.POST.dict()
        files = request.FILES
    else:
        data = _parse_json(request)
        files = {}

    vacancy_id = data.get('vacancy_id', '').strip()
    if not vacancy_id:
        return api_error("vacancy_id is required.", status=400)

    try:
        vacancy = Vacancy.objects(id=vacancy_id).first()
    except Exception:
        return api_error("Invalid vacancy ID.", status=400)

    if not vacancy:
        return api_error("Vacancy not found.", status=404)

    if not vacancy.is_open():
        return api_error("This vacancy is no longer accepting applications.", status=400)

    # Determine user identity
    user = getattr(request, 'user', None)
    if user:
        applicant_email = user.email
        applicant_name = f"{user.first_name} {user.last_name}".strip() or data.get('full_name', 'Applicant')
    else:
        applicant_email = data.get('email', '').strip().lower()
        applicant_name = data.get('full_name', '').strip()

    if not applicant_email or not applicant_name:
        return api_error("Full name and email address are required.", status=400)

    # Prevent duplicate active application for same vacancy
    existing = Application.objects(
        applicant_email=applicant_email,
        vacancy=vacancy,
        stage__nin=['REJECTED', 'APPOINTED']
    ).first()
    if existing:
        return api_error(
            f"You already have an active application ({existing.tracking_number}) for this position.",
            status=409
        )

    # Profile dictionary
    profile = {
        'full_name': applicant_name,
        'email': applicant_email,
        'phone': data.get('phone', '').strip(),
        'address': data.get('address', '').strip(),
        'highest_education': data.get('highest_education', '').strip(),
        'school': data.get('school', '').strip(),
        'years_experience': data.get('years_experience', '').strip(),
        'eligibility': data.get('eligibility', '').strip(),
        'cover_letter': data.get('cover_letter', '').strip()
    }

    tracking_no = Application.generate_tracking_number()

    # Process file uploads
    documents = []
    upload_dir = os.path.join(settings.BASE_DIR, 'media', 'documents', tracking_no)
    os.makedirs(upload_dir, exist_ok=True)

    for field_name, uploaded_file in files.items():
        file_path = os.path.join(upload_dir, uploaded_file.name)
        with open(file_path, 'wb+') as destination:
            for chunk in uploaded_file.chunks():
                destination.write(chunk)

        documents.append({
            'doc_type': field_name.upper(),
            'file_name': uploaded_file.name,
            'file_size': uploaded_file.size,
            'uploaded_at': datetime.utcnow().isoformat(),
            'verified': False
        })

    # If documents were passed as metadata array in JSON
    if 'documents' in data and isinstance(data['documents'], list):
        for doc in data['documents']:
            documents.append({
                'doc_type': doc.get('doc_type', 'SUPPORTING_DOC'),
                'file_name': doc.get('file_name', 'document.pdf'),
                'file_size': doc.get('file_size', 0),
                'uploaded_at': datetime.utcnow().isoformat(),
                'verified': False
            })

    application = Application(
        tracking_number=tracking_no,
        applicant=user,
        applicant_email=applicant_email,
        applicant_name=applicant_name,
        vacancy=vacancy,
        stage='APPLIED',
        applicant_profile=profile,
        documents=documents
    )
    application.add_stage_history(
        stage='APPLIED',
        actor=user,
        remarks='Application successfully submitted via applicant portal.'
    )
    application.save()

    # Increment vacancy applicant counter
    try:
        vacancy.applicant_count = (vacancy.applicant_count or 0) + 1
        vacancy.save()
    except Exception:
        pass

    return api_success(
        data={
            'tracking_number': tracking_no,
            'application': application.to_dict()
        },
        message="Application submitted successfully. Keep your tracking number for status updates.",
        status=201
    )


@csrf_exempt
@login_required_api
def my_applications_view(request):
    """
    GET: List all applications belonging to authenticated applicant.
    """
    init_mongo()
    user = request.user
    applications = Application.objects(
        applicant_email=user.email.lower()
    ).order_by('-created_at')

    return api_success(
        data={'applications': [app.to_dict() for app in applications]},
        message="My applications retrieved."
    )


@csrf_exempt
def application_track_view(request, tracking_number):
    """
    GET: Publicly accessible status check by tracking number.
    """
    init_mongo()
    if request.method != 'GET':
        return api_error("Method not allowed.", status=405)

    app = Application.objects(tracking_number__iexact=tracking_number.strip()).first()
    if not app:
        return api_error(f"No application found with tracking number '{tracking_number}'.", status=404)

    return api_success(
        data={
            'tracking_number': app.tracking_number,
            'vacancy_title': app.vacancy.title if app.vacancy else 'Position',
            'department': app.vacancy.department if app.vacancy else 'NBSC',
            'stage': app.stage,
            'created_at': app.created_at.strftime('%B %d, %Y') if app.created_at else None,
            'updated_at': app.updated_at.strftime('%B %d, %Y %I:%M %p') if app.updated_at else None,
            'stage_history': app.stage_history
        },
        message="Application status retrieved."
    )


@csrf_exempt
def application_detail_view(request, application_id):
    """
    GET: Retrieve full application details (Evaluator or applicant themselves).
    """
    init_mongo()
    user = getattr(request, 'user', None)

    try:
        app = Application.objects(id=application_id).first()
    except Exception:
        return api_error("Invalid application ID.", status=400)

    if not app:
        return api_error("Application not found.", status=404)

    # Permission check: evaluator or applicant owner
    if user:
        is_owner = (user.email.lower() == app.applicant_email.lower())
        is_staff = (user.role in ['HR_ADMIN', 'HRMPSB_MEMBER', 'DEPT_HEAD'])
        if not is_owner and not is_staff:
            return api_error("Forbidden: Access denied.", status=403)
    else:
        return api_error("Authentication required.", status=401)

    return api_success(data={'application': app.to_dict()})


@csrf_exempt
def application_stage_update_view(request, application_id):
    """
    PATCH: Transition application stage (Restricted to HR_ADMIN & HRMPSB_MEMBER).
    """
    init_mongo()
    if request.method != 'PATCH':
        return api_error("Method not allowed.", status=405)

    user = getattr(request, 'user', None)
    if not user or user.role not in ['HR_ADMIN', 'HRMPSB_MEMBER']:
        return api_error("Forbidden: Only HR Administrator and HRMPSB members can transition stages.", status=403)

    try:
        app = Application.objects(id=application_id).first()
    except Exception:
        return api_error("Invalid application ID.", status=400)

    if not app:
        return api_error("Application not found.", status=404)

    data = _parse_json(request)
    new_stage = data.get('stage', '').strip().upper()
    remarks = data.get('remarks', '').strip()

    if new_stage not in Application.STAGES:
        return api_error(f"Invalid stage. Must be one of: {', '.join(Application.STAGES)}", status=400)

    if new_stage == 'REJECTED':
        app.disqualification_reason = remarks or 'Application closed.'

    app.add_stage_history(stage=new_stage, actor=user, remarks=remarks)
    app.save()

    return api_success(
        data={'application': app.to_dict()},
        message=f"Application transitioned to '{new_stage}'."
    )


@csrf_exempt
def application_list_view(request):
    """
    GET: List all applications for recruitment staff with filters.
    """
    init_mongo()
    user = getattr(request, 'user', None)
    if not user or user.role not in ['HR_ADMIN', 'HRMPSB_MEMBER', 'DEPT_HEAD']:
        return api_error("Forbidden: Recruitment staff access required.", status=403)

    vacancy_id = request.GET.get('vacancy_id', '').strip()
    stage = request.GET.get('stage', '').strip().upper()
    q = request.GET.get('q', '').strip()
    page = request.GET.get('page', 1)
    page_size = request.GET.get('page_size', 15)

    query = Application.objects()

    if vacancy_id:
        try:
            vacancy = Vacancy.objects(id=vacancy_id).first()
            if vacancy:
                query = query.filter(vacancy=vacancy)
        except Exception:
            pass

    if stage:
        query = query.filter(stage=stage)

    if q:
        query = query.filter(applicant_name__icontains=q)

    # If DEPT_HEAD, scope to their department's vacancies
    if user.role == 'DEPT_HEAD':
        # Find vacancies in dept
        dept_code = getattr(user, 'department', '')
        if dept_code:
            dept_vacancies = Vacancy.objects(department=dept_code)
            query = query.filter(vacancy__in=dept_vacancies)

    query = query.order_by('-created_at')
    items, meta = paginate_queryset(query, page=page, page_size=page_size)

    return api_success(
        data={
            'applications': [app.to_dict() for app in items],
            'pagination': meta
        },
        message="Applications retrieved successfully."
    )
