"""
NBSC PRIME-HRM Intelligence Hub — Programs API Views
"""
import json
from django.views.decorators.csrf import csrf_exempt
from core.response import api_success, api_error
from core.mongo import init_mongo
from apps.accounts.decorators import login_required_api
from .models import Program


def _parse_json(request):
    try:
        return json.loads(request.body.decode('utf-8'))
    except Exception:
        return {}


@csrf_exempt
def program_list_create_view(request):
    """
    GET: List all active programs (public or authenticated).
    POST: Create new program (HR_ADMIN only).
    """
    init_mongo()

    if request.method == 'GET':
        dept = request.GET.get('department', '').strip()
        query = Program.objects(is_active=True)
        if dept:
            query = query.filter(department=dept)
        programs = [p.to_dict() for p in query.order_by('department', 'name')]
        return api_success(data={'programs': programs}, message="Programs retrieved.")

    elif request.method == 'POST':
        if not getattr(request, 'user', None) or request.user.role != 'HR_ADMIN':
            return api_error("Authentication as HR Administrator required.", status=403)

        data = _parse_json(request)
        code = data.get('code', '').strip().upper()
        name = data.get('name', '').strip()
        dept = data.get('department', '').strip()

        if not code or not name or not dept:
            return api_error("Code, name, and department are required.", status=400)

        if Program.objects(code=code).first():
            return api_error("A program with this code already exists.", status=409)

        prog = Program(
            code=code,
            name=name,
            department=dept,
            description=data.get('description', '').strip()
        )
        prog.save()
        return api_success(data={'program': prog.to_dict()}, message="Program created.", status=201)

    return api_error("Method not allowed", status=405)


@csrf_exempt
@login_required_api
def program_detail_view(request, program_id):
    """
    GET, PUT, DELETE program by ID or code.
    """
    init_mongo()
    prog = None
    try:
        prog = Program.objects(id=program_id).first()
    except Exception:
        pass
    if not prog:
        prog = Program.objects(code=program_id.upper()).first()

    if not prog:
        return api_error("Program not found.", status=404)

    if request.method == 'GET':
        return api_success(data={'program': prog.to_dict()})

    elif request.method == 'PUT':
        if request.user.role != 'HR_ADMIN':
            return api_error("Only HR Administrators can modify programs.", status=403)

        data = _parse_json(request)
        if 'name' in data:
            prog.name = data['name'].strip()
        if 'department' in data:
            prog.department = data['department'].strip()
        if 'description' in data:
            prog.description = data['description'].strip()
        prog.save()
        return api_success(data={'program': prog.to_dict()}, message="Program updated.")

    elif request.method == 'DELETE':
        if request.user.role != 'HR_ADMIN':
            return api_error("Only HR Administrators can delete programs.", status=403)

        prog.is_active = False
        prog.save()
        return api_success(data={'code': prog.code}, message="Program deactivated.")

    return api_error("Method not allowed", status=405)
