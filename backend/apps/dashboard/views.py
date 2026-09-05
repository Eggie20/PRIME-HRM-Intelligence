"""
NBSC PRIME-HRM Intelligence Hub — Dashboard API Views
"""
from django.views.decorators.csrf import csrf_exempt
from core.response import api_success, api_error
from core.mongo import init_mongo
from apps.accounts.decorators import login_required_api
from .services import (
    get_kpi_metrics,
    get_department_breakdown,
    get_employment_type_breakdown,
    get_category_breakdown
)


@csrf_exempt
@login_required_api
def kpi_view(request):
    """
    GET /api/v1/dashboard/kpis/
    Returns high-level KPI cards data for command center.
    """
    if request.method != 'GET':
        return api_error("Method not allowed", status=405)

    init_mongo()
    kpis = get_kpi_metrics()
    return api_success(data=kpis, message="KPI metrics retrieved.")


@csrf_exempt
@login_required_api
def charts_view(request):
    """
    GET /api/v1/dashboard/charts/
    Returns aggregated chart series for Chart.js dashboards.
    """
    if request.method != 'GET':
        return api_error("Method not allowed", status=405)

    init_mongo()
    return api_success(
        data={
            'departments': get_department_breakdown(),
            'employment_types': get_employment_type_breakdown(),
            'categories': get_category_breakdown()
        },
        message="Chart analytics retrieved."
    )
