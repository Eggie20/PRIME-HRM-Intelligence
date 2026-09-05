"""
NBSC PRIME-HRM Intelligence Hub — Payroll URL Configuration
Prefix: /api/v1/payroll/
"""
from django.urls import path
from . import views

urlpatterns = [
    path('upload/', views.upload_payroll_excel, name='payroll-upload'),
    path('batches/', views.list_payroll_batches, name='payroll-batches-list'),
    path('batches/<str:batch_id>/', views.get_payroll_batch_detail, name='payroll-batch-detail'),
    path('batches/<str:batch_id>/process/', views.process_payroll_batch, name='payroll-batch-process'),
    path('my-payslips/', views.get_my_payslips, name='payroll-my-payslips'),
    path('payslips/<str:payslip_id>/download/', views.download_payslip_pdf, name='payroll-payslip-download'),
]
