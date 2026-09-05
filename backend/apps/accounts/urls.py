"""
NBSC PRIME-HRM Intelligence Hub — Accounts URL Routes
"""
from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_view, name='auth-login'),
    path('applicant/login/', views.applicant_login_view, name='auth-applicant-login'),
    path('applicant/register/', views.applicant_register_view, name='auth-applicant-register'),
    path('2fa/setup/', views.setup_2fa_view, name='auth-2fa-setup'),
    path('2fa/verify/', views.verify_2fa_view, name='auth-2fa-verify'),
    path('me/', views.me_view, name='auth-me'),
    path('refresh/', views.refresh_token_view, name='auth-refresh'),
]
