"""
NBSC PRIME-HRM Intelligence Hub — Vacancies URLs
"""
from django.urls import path
from .views import (
    vacancy_list_create_view,
    public_vacancy_list_view,
    vacancy_detail_view,
    vacancy_status_toggle_view
)

app_name = 'vacancies'

urlpatterns = [
    path('', vacancy_list_create_view, name='vacancy-list-create'),
    path('public/', public_vacancy_list_view, name='vacancy-public-list'),
    path('<str:vacancy_id>/', vacancy_detail_view, name='vacancy-detail'),
    path('<str:vacancy_id>/status/', vacancy_status_toggle_view, name='vacancy-status-toggle'),
]
