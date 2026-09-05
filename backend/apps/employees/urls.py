"""
NBSC PRIME-HRM Intelligence Hub — Employee URL Routes
"""
from django.urls import path
from . import views

urlpatterns = [
    path('', views.employee_list_create_view, name='employee-list-create'),
    path('import/', views.employee_import_view, name='employee-import'),
    path('<str:employee_id>/', views.employee_detail_view, name='employee-detail'),
]
