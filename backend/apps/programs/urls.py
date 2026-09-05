"""
NBSC PRIME-HRM Intelligence Hub — Programs URL Routes
"""
from django.urls import path
from . import views

urlpatterns = [
    path('', views.program_list_create_view, name='program-list-create'),
    path('<str:program_id>/', views.program_detail_view, name='program-detail'),
]
