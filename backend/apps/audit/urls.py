"""
NBSC PRIME-HRM Intelligence Hub — Audit URLs
"""
from django.urls import path
from .views import audit_chain_view, audit_block_detail_view, audit_verify_view

app_name = 'audit'

urlpatterns = [
    path('chain/', audit_chain_view, name='audit-chain'),
    path('chain/<int:index>/', audit_block_detail_view, name='audit-block-detail'),
    path('verify/', audit_verify_view, name='audit-verify'),
]
