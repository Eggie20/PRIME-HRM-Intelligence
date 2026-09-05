"""
NBSC PRIME-HRM Intelligence Hub — Hiring URLs
"""
from django.urls import path
from .views import (
    dss_score_view,
    dept_head_evaluation_view,
    hrmpsb_voting_view,
    deliberation_summary_view,
    final_decision_view
)

app_name = 'hiring'

urlpatterns = [
    path('<str:application_id>/dss/', dss_score_view, name='hiring-dss-score'),
    path('<str:application_id>/evaluate/', dept_head_evaluation_view, name='hiring-dept-eval'),
    path('<str:application_id>/vote/', hrmpsb_voting_view, name='hiring-vote'),
    path('<str:application_id>/deliberation-summary/', deliberation_summary_view, name='hiring-deliberation-summary'),
    path('<str:application_id>/final-decision/', final_decision_view, name='hiring-final-decision'),
]
