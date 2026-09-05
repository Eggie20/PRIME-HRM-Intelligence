"""
NBSC PRIME-HRM Intelligence Hub — Root URL Configuration
Prefixes all REST endpoints under /api/v1/
"""
from django.contrib import admin
from django.urls import path, include
from core.response import api_success

def health_check(request):
    return api_success(
        data={
            'status': 'healthy',
            'service': 'NBSC PRIME-HRM Intelligence Hub API',
            'version': '1.0.0'
        },
        message="Service is operational."
    )

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/health/', health_check, name='api-health'),
    path('api/v1/auth/', include('apps.accounts.urls')),
    path('api/v1/dashboard/', include('apps.dashboard.urls')),
    path('api/v1/employees/', include('apps.employees.urls')),
    path('api/v1/programs/', include('apps.programs.urls')),
    path('api/v1/vacancies/', include('apps.vacancies.urls')),
    path('api/v1/applications/', include('apps.applicants.urls')),
    path('api/v1/hiring/', include('apps.hiring.urls')),
    path('api/v1/audit/', include('apps.audit.urls')),
    path('api/v1/payroll/', include('apps.payroll.urls')),
    path('api/v1/sara/', include('apps.sara.urls')),
    path('api/v1/notifications/', include('apps.notifications.urls')),
]
