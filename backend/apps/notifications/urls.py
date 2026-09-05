"""
NBSC PRIME-HRM Intelligence Hub — Notifications URL Configuration
Prefix: /api/v1/notifications/
"""
from django.urls import path
from . import views

urlpatterns = [
    path('', views.list_notifications, name='notifications-list'),
    path('<str:notif_id>/read/', views.mark_notification_read, name='notification-mark-read'),
    path('read-all/', views.mark_all_notifications_read, name='notifications-read-all'),
]
