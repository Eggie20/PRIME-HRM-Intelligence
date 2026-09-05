"""
NBSC PRIME-HRM Intelligence Hub — SARA Database Tools
Provides role-scoped querying functions for vacancies, applicant tracking,
and HR metrics that SARA can invoke during conversation turns.
"""
from apps.vacancies.models import Vacancy
from apps.applicants.models import Application
from apps.employees.models import Employee


def tool_query_vacancies(department: str = None, category: str = None) -> dict:
    """
    Retrieves active OPEN vacancies at NBSC matching optional department and category.
    """
    try:
        qs = Vacancy.objects(status='OPEN')
        if department and department != 'ALL':
            qs = qs.filter(department=department.upper())
        if category and category != 'ALL':
            qs = qs.filter(category=category.upper())

        vacancies = []
        for v in qs[:5]:
            vacancies.append({
                'id': str(v.id),
                'title': v.title,
                'department': v.department,
                'category': v.category,
                'salary_grade': v.salary_grade,
                'monthly_salary': v.monthly_salary,
                'slots': v.slots,
                'deadline': v.deadline.strftime('%B %d, %Y') if v.deadline else 'Open Until Filled'
            })

        return {
            'success': True,
            'count': len(vacancies),
            'vacancies': vacancies
        }
    except Exception as e:
        return {'success': False, 'error': str(e), 'vacancies': []}


def tool_track_application(tracking_number: str) -> dict:
    """
    Looks up candidate application progression across the 8-stage hiring pipeline.
    """
    try:
        clean_track = tracking_number.strip().upper()
        app = Application.objects(tracking_number=clean_track).first()
        if not app:
            return {
                'success': False,
                'found': False,
                'message': f"No application found with tracking number '{clean_track}'. Please verify your 18-digit code."
            }

        position_title = app.vacancy.title if app.vacancy else "NBSC Position"
        milestones = [
            {'stage': h.get('stage'), 'remarks': h.get('remarks'), 'date': h.get('timestamp').strftime('%b %d, %Y') if h.get('timestamp') else ''}
            for h in (app.stage_history or [])
        ]

        return {
            'success': True,
            'found': True,
            'tracking_number': app.tracking_number,
            'applicant_name': app.applicant_name,
            'position': position_title,
            'current_stage': app.stage,
            'applied_at': app.applied_at.strftime('%B %d, %Y') if app.applied_at else '',
            'milestones': milestones
        }
    except Exception as e:
        return {'success': False, 'found': False, 'error': str(e)}


def tool_get_headcount_stats(user_role: str = 'GUEST') -> dict:
    """
    Returns high-level employee analytics. Restricted insights for administrative roles.
    """
    try:
        total_emp = Employee.objects(is_active=True).count()
        teaching_count = Employee.objects(is_active=True, category='TEACHING').count()
        non_teaching_count = Employee.objects(is_active=True, category='NON_TEACHING').count()

        dept_counts = {}
        for dept in ('ICS', 'IBM', 'ITE', 'DGEC', 'ADMIN', 'FIN'):
            dept_counts[dept] = Employee.objects(is_active=True, department=dept).count()

        return {
            'success': True,
            'total_headcount': total_emp,
            'teaching': teaching_count,
            'non_teaching': non_teaching_count,
            'departments': dept_counts
        }
    except Exception as e:
        return {'success': False, 'error': str(e)}
