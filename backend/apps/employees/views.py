"""
NBSC PRIME-HRM Intelligence Hub — Employee API Views
CRUD endpoints, search, filtering, and bulk Excel import.
"""
import json
from django.views.decorators.csrf import csrf_exempt
from core.response import api_success, api_error
from core.mongo import init_mongo
from core.pagination import paginate_queryset
from apps.accounts.decorators import login_required_api, role_required
from .models import Employee
from .services import import_employees_from_excel, generate_unique_employee_id


def _parse_json(request):
    try:
        return json.loads(request.body.decode('utf-8'))
    except Exception:
        return {}


@csrf_exempt
@login_required_api
def employee_list_create_view(request):
    """
    GET: List employees with search, department/category/status filters, and pagination.
    POST: Create new employee.
    """
    init_mongo()

    if request.method == 'GET':
        query = Employee.objects(is_active=True)

        # Filters
        search = request.GET.get('search', '').strip()
        department = request.GET.get('department', '').strip()
        category = request.GET.get('category', '').strip()
        status = request.GET.get('status', '').strip()

        if search:
            query = query.filter(
                __raw__={
                    '$or': [
                        {'first_name': {'$regex': search, '$options': 'i'}},
                        {'last_name': {'$regex': search, '$options': 'i'}},
                        {'email': {'$regex': search, '$options': 'i'}},
                        {'employee_id': {'$regex': search, '$options': 'i'}},
                        {'position': {'$regex': search, '$options': 'i'}}
                    ]
                }
            )

        if department:
            query = query.filter(department=department)
        if category:
            query = query.filter(category=category)
        if status:
            query = query.filter(employment_status=status)

        query = query.order_by('last_name', 'first_name')

        page = request.GET.get('page', 1)
        page_size = request.GET.get('page_size', 10)
        items, meta = paginate_queryset(query, page=page, page_size=page_size)

        return api_success(
            data={
                'employees': [emp.to_dict() for emp in items],
                'pagination': meta
            },
            message="Employees retrieved successfully."
        )

    elif request.method == 'POST':
        # Only HR_ADMIN can create employees directly
        if request.user.role != 'HR_ADMIN':
            return api_error("Only HR Administrators can add employees.", status=403)

        data = _parse_json(request)
        first_name = data.get('first_name', '').strip()
        last_name = data.get('last_name', '').strip()
        email = data.get('email', '').strip().lower()
        department = data.get('department', '').strip()
        position = data.get('position', '').strip()

        if not all([first_name, last_name, email, department, position]):
            return api_error("First name, last name, email, department, and position are required.", status=400)

        if Employee.objects(email=email).first():
            return api_error("An employee with this email already exists.", status=409)

        employee_id = data.get('employee_id', '').strip() or generate_unique_employee_id(department)

        try:
            employee = Employee(
                employee_id=employee_id,
                first_name=first_name,
                last_name=last_name,
                middle_name=data.get('middle_name', '').strip(),
                email=email,
                phone=data.get('phone', '').strip(),
                department=department,
                position=position,
                category=data.get('category', 'TEACHING'),
                employment_status=data.get('employment_status', 'COS'),
                daily_rate=float(data.get('daily_rate', 0.0) or 0.0),
                monthly_salary=float(data.get('monthly_salary', 0.0) or 0.0),
                salary_grade=int(data.get('salary_grade', 12) or 12)
            )
            employee.save()
            return api_success(
                data={'employee': employee.to_dict()},
                message="Employee created successfully.",
                status=201
            )
        except Exception as ex:
            return api_error(f"Failed to create employee: {str(ex)}", status=400)

    return api_error("Method not allowed", status=405)


@csrf_exempt
@login_required_api
def employee_detail_view(request, employee_id):
    """
    GET: Retrieve single employee by ID or employee_id.
    PUT: Update employee details.
    DELETE: Soft delete employee (set is_active=False).
    """
    init_mongo()

    # Look up by Mongo ID or string employee_id
    employee = None
    try:
        employee = Employee.objects(id=employee_id).first()
    except Exception:
        pass
    if not employee:
        employee = Employee.objects(employee_id=employee_id).first()

    if not employee:
        return api_error("Employee not found.", status=404)

    if request.method == 'GET':
        return api_success(
            data={'employee': employee.to_dict()},
            message="Employee profile retrieved."
        )

    elif request.method == 'PUT':
        if request.user.role != 'HR_ADMIN':
            return api_error("Only HR Administrators can update employees.", status=403)

        data = _parse_json(request)
        for field in ['first_name', 'last_name', 'middle_name', 'phone', 'department', 'position', 'category', 'employment_status']:
            if field in data and data[field] is not None:
                setattr(employee, field, data[field])

        if 'daily_rate' in data and data['daily_rate'] is not None:
            employee.daily_rate = float(data['daily_rate'])
        if 'monthly_salary' in data and data['monthly_salary'] is not None:
            employee.monthly_salary = float(data['monthly_salary'])
        if 'salary_grade' in data and data['salary_grade'] is not None:
            employee.salary_grade = int(data['salary_grade'])

        employee.save()
        return api_success(
            data={'employee': employee.to_dict()},
            message="Employee updated successfully."
        )

    elif request.method == 'DELETE':
        if request.user.role != 'HR_ADMIN':
            return api_error("Only HR Administrators can delete employees.", status=403)

        employee.is_active = False
        employee.save()
        return api_success(
            data={'employee_id': employee.employee_id},
            message="Employee deactivated successfully."
        )

    return api_error("Method not allowed", status=405)


@csrf_exempt
@login_required_api
def employee_import_view(request):
    """
    Bulk import employees from an uploaded Excel file.
    POST /api/v1/employees/import/
    """
    if request.method != 'POST':
        return api_error("Method not allowed", status=405)

    if request.user.role != 'HR_ADMIN':
        return api_error("Only HR Administrators can import employees.", status=403)

    if 'file' not in request.FILES:
        return api_error("Please upload an Excel (.xlsx) file.", status=400)

    uploaded_file = request.FILES['file']
    if not uploaded_file.name.endswith(('.xlsx', '.xls')):
        return api_error("Only .xlsx or .xls Excel files are accepted.", status=400)

    try:
        result = import_employees_from_excel(uploaded_file)
        return api_success(
            data=result,
            message=f"Import complete: {result['imported']} imported, {result['skipped']} skipped."
        )
    except Exception as ex:
        return api_error(f"Import failed: {str(ex)}", status=400)
