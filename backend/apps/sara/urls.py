"""
NBSC PRIME-HRM Intelligence Hub — SARA URL Configuration
Prefix: /api/v1/sara/
"""
from django.urls import path
from . import views

urlpatterns = [
    path('chat/', views.sara_chat_view, name='sara-chat'),
    path('history/<str:session_id>/', views.sara_history_view, name='sara-history'),
    path('feedback/', views.sara_feedback_view, name='sara-feedback'),
]
