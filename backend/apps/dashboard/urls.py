"""
NBSC PRIME-HRM Intelligence Hub — Dashboard URL Routes
"""
from django.urls import path
from . import views

urlpatterns = [
    path('kpis/', views.kpi_view, name='dashboard-kpis'),
    path('charts/', views.charts_view, name='dashboard-charts'),
]
