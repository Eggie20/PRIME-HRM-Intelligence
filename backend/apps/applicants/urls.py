"""
NBSC PRIME-HRM Intelligence Hub — Applicants URLs
"""
from django.urls import path
from .views import (
    application_submit_view,
    my_applications_view,
    application_track_view,
    application_detail_view,
    application_stage_update_view,
    application_list_view
)

app_name = 'applicants'

urlpatterns = [
    path('', application_list_view, name='application-list'),
    path('submit/', application_submit_view, name='application-submit'),
    path('my-applications/', my_applications_view, name='my-applications'),
    path('track/<str:tracking_number>/', application_track_view, name='application-track'),
    path('<str:application_id>/', application_detail_view, name='application-detail'),
    path('<str:application_id>/stage/', application_stage_update_view, name='application-stage-update'),
]
