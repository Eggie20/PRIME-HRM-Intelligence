"""
NBSC PRIME-HRM Intelligence Hub — Vacancies API Views
"""
import json
from datetime import datetime
from django.views.decorators.csrf import csrf_exempt
from core.response import api_success, api_error
from core.mongo import init_mongo
from core.pagination import paginate_queryset
from apps.accounts.decorators import login_required_api, role_required
from .models import Vacancy


def _parse_json(request):
    try:
        return json.loads(request.body.decode('utf-8'))
    except Exception:
        return {}


@csrf_exempt
def vacancy_list_create_view(request):
    """
    GET: List vacancies with search, filtering, and pagination.
    POST: Create new vacancy (HR_ADMIN only).
    """
    init_mongo()

    if request.method == 'GET':
        q = request.GET.get('q', '').strip()
        department = request.GET.get('department', '').strip().upper()
        category = request.GET.get('category', '').strip().upper()
        status = request.GET.get('status', '').strip().upper()
        page = request.GET.get('page', 1)
        page_size = request.GET.get('page_size', 10)

        query = Vacancy.objects(status__ne='ARCHIVED')

        if department:
            query = query.filter(department=department)
        if category:
            query = query.filter(category=category)
        if status:
            query = query.filter(status=status)
        if q:
            query = query.filter(title__icontains=q)

        query = query.order_by('-created_at')
        items, meta = paginate_queryset(query, page=page, page_size=page_size)
        vacancies = [v.to_dict() for v in items]

        return api_success(
            data={'vacancies': vacancies, 'pagination': meta},
            message="Vacancies retrieved successfully."
        )

    elif request.method == 'POST':
        user = getattr(request, 'user', None)
        if not user or user.role != 'HR_ADMIN':
            return api_error("Only HR Administrators can create vacancies.", status=403)

        data = _parse_json(request)
        title = data.get('title', '').strip()
        department = data.get('department', '').strip().upper()
        category = data.get('category', 'TEACHING').strip().upper()
        education = data.get('education', '').strip()

        if not title or not department or not education:
            return api_error("Position title, department, and education QS are required.", status=400)

        deadline = None
        if data.get('deadline'):
            try:
                deadline = datetime.strptime(data['deadline'], '%Y-%m-%d')
            except ValueError:
                return api_error("Invalid deadline format. Use YYYY-MM-DD.", status=400)

        vacancy = Vacancy(
            title=title,
            department=department,
            category=category,
            employment_status=data.get('employment_status', 'COS'),
            education=education,
            experience=data.get('experience', 'None Required').strip(),
            training=data.get('training', 'None Required').strip(),
            eligibility=data.get('eligibility', 'None Required / RA 1080').strip(),
            daily_rate=float(data.get('daily_rate', 1325.68)),
            monthly_salary=float(data.get('monthly_salary', 29165.00)),
            salary_grade=int(data.get('salary_grade', 12)),
            slots=int(data.get('slots', 1)),
            description=data.get('description', '').strip(),
            status=data.get('status', 'OPEN'),
            deadline=deadline
        )
        vacancy.save()

        return api_success(
            data={'vacancy': vacancy.to_dict()},
            message="Vacancy created successfully.",
            status=201
        )

    return api_error("Method not allowed.", status=405)


@csrf_exempt
def public_vacancy_list_view(request):
    """
    Public unauthenticated endpoint returning all active OPEN vacancies with future/null deadlines.
    """
    init_mongo()
    if request.method != 'GET':
        return api_error("Method not allowed.", status=405)

    category = request.GET.get('category', '').strip().upper()
    department = request.GET.get('department', '').strip().upper()
    q = request.GET.get('q', '').strip()

    query = Vacancy.objects(status='OPEN')
    if category:
        query = query.filter(category=category)
    if department:
        query = query.filter(department=department)
    if q:
        query = query.filter(title__icontains=q)

    now = datetime.utcnow()
    vacancies = []
    for v in query.order_by('-created_at'):
        if v.deadline and v.deadline < now:
            continue
        vacancies.append(v.to_dict())

    return api_success(
        data={'vacancies': vacancies, 'total': len(vacancies)},
        message="Public job board vacancies retrieved."
    )


@csrf_exempt
def vacancy_detail_view(request, vacancy_id):
    """
    GET: Retrieve single vacancy.
    PUT: Update vacancy (HR_ADMIN only).
    DELETE: Archive vacancy (HR_ADMIN only).
    """
    init_mongo()

    try:
        vacancy = Vacancy.objects(id=vacancy_id).first()
    except Exception:
        return api_error("Invalid vacancy ID.", status=400)

    if not vacancy:
        return api_error("Vacancy not found.", status=404)

    if request.method == 'GET':
        return api_success(data={'vacancy': vacancy.to_dict()})

    user = getattr(request, 'user', None)
    if not user or user.role != 'HR_ADMIN':
        return api_error("Forbidden: HR Administrator access required.", status=403)

    if request.method == 'PUT':
        data = _parse_json(request)

        if 'title' in data:
            vacancy.title = data['title'].strip()
        if 'department' in data:
            vacancy.department = data['department'].strip().upper()
        if 'category' in data:
            vacancy.category = data['category'].strip().upper()
        if 'employment_status' in data:
            vacancy.employment_status = data['employment_status']
        if 'education' in data:
            vacancy.education = data['education'].strip()
        if 'experience' in data:
            vacancy.experience = data['experience'].strip()
        if 'training' in data:
            vacancy.training = data['training'].strip()
        if 'eligibility' in data:
            vacancy.eligibility = data['eligibility'].strip()
        if 'daily_rate' in data:
            vacancy.daily_rate = float(data['daily_rate'])
        if 'monthly_salary' in data:
            vacancy.monthly_salary = float(data['monthly_salary'])
        if 'salary_grade' in data:
            vacancy.salary_grade = int(data['salary_grade'])
        if 'slots' in data:
            vacancy.slots = int(data['slots'])
        if 'description' in data:
            vacancy.description = data['description'].strip()
        if 'status' in data:
            vacancy.status = data['status'].strip().upper()
        if 'deadline' in data:
            if data['deadline']:
                try:
                    vacancy.deadline = datetime.strptime(data['deadline'], '%Y-%m-%d')
                except ValueError:
                    return api_error("Invalid deadline date format. Use YYYY-MM-DD.", status=400)
            else:
                vacancy.deadline = None

        vacancy.updated_at = datetime.utcnow()
        vacancy.save()
        return api_success(data={'vacancy': vacancy.to_dict()}, message="Vacancy updated successfully.")

    elif request.method == 'DELETE':
        vacancy.status = 'ARCHIVED'
        vacancy.updated_at = datetime.utcnow()
        vacancy.save()
        return api_success(data={'id': str(vacancy.id)}, message="Vacancy archived successfully.")

    return api_error("Method not allowed.", status=405)


@csrf_exempt
def vacancy_status_toggle_view(request, vacancy_id):
    """
    PATCH: Rapid status update (e.g. OPEN -> CLOSED, OPEN -> DELIBERATION).
    """
    init_mongo()
    if request.method != 'PATCH':
        return api_error("Method not allowed.", status=405)

    user = getattr(request, 'user', None)
    if not user or user.role != 'HR_ADMIN':
        return api_error("Forbidden: HR Administrator access required.", status=403)

    try:
        vacancy = Vacancy.objects(id=vacancy_id).first()
    except Exception:
        return api_error("Invalid vacancy ID.", status=400)

    if not vacancy:
        return api_error("Vacancy not found.", status=404)

    data = _parse_json(request)
    new_status = data.get('status', '').strip().upper()
    if new_status not in Vacancy.STATUSES:
        return api_error(f"Invalid status. Must be one of: {', '.join(Vacancy.STATUSES)}", status=400)

    vacancy.status = new_status
    vacancy.updated_at = datetime.utcnow()
    vacancy.save()

    return api_success(
        data={'vacancy': vacancy.to_dict()},
        message=f"Vacancy status changed to {new_status}."
    )
