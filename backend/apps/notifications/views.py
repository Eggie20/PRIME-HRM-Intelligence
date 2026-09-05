"""
NBSC PRIME-HRM Intelligence Hub — Notification Views
Endpoints to fetch, mark read, and dispatch notifications.
"""
from django.views.decorators.csrf import csrf_exempt
from core.response import api_success, api_error
from .models import Notification


def list_notifications(request):
    """
    GET /api/v1/notifications/
    Lists notifications for the authenticated user, or returns demo alerts if offline.
    """
    user_email = 'admin@nbsc.edu.ph'
    if hasattr(request, 'user') and request.user:
        user_email = getattr(request.user, 'email', user_email)

    notes = []
    try:
        notes = list(Notification.objects(recipient_email=user_email).order_by('-created_at')[:20])
    except Exception:
        pass

    # Provide demo notifications if collection is empty
    if not notes:
        demo_notes = [
            {
                'id': 'notif-1',
                'recipient_email': user_email,
                'title': 'New Application Received',
                'message': 'April Anne Elizabeth A. Bajao applied for Instructor I (ICS).',
                'category': 'APPLICATION_STAGE',
                'target_link': '/frontend/pages/hiring/applicant-review/applicant-review.html',
                'is_read': False,
                'created_at': '2026-09-04T10:00:00'
            },
            {
                'id': 'notif-2',
                'recipient_email': user_email,
                'title': 'Semi-Monthly Payslip Ready',
                'message': 'Your encrypted payslip for September 1–15, 2026 is ready for download.',
                'category': 'PAYROLL_READY',
                'target_link': '/frontend/pages/payroll/payslip-download/payslip-download.html',
                'is_read': False,
                'created_at': '2026-09-04T08:30:00'
            }
        ]
        return api_success(
            data={
                'unread_count': 2,
                'notifications': demo_notes
            },
            message="Notifications retrieved."
        )

    unread_count = sum(1 for n in notes if not n.is_read)
    return api_success(
        data={
            'unread_count': unread_count,
            'notifications': [n.to_dict() for n in notes]
        },
        message="Notifications retrieved."
    )


@csrf_exempt
def mark_notification_read(request, notif_id):
    """
    PATCH /api/v1/notifications/<id>/read/
    Marks a single notification as read.
    """
    if request.method not in ('PATCH', 'POST'):
        return api_error("Method not allowed", status_code=405)

    try:
        note = Notification.objects(id=notif_id).first()
        if note:
            note.is_read = True
            note.save()
            return api_success(data=note.to_dict(), message="Notification marked as read.")
    except Exception:
        pass

    return api_success(data={'id': notif_id, 'is_read': True}, message="Notification marked as read.")


@csrf_exempt
def mark_all_notifications_read(request):
    """
    POST /api/v1/notifications/read-all/
    Marks all notifications for the user as read.
    """
    if request.method != 'POST':
        return api_error("Method not allowed", status_code=405)

    user_email = 'admin@nbsc.edu.ph'
    if hasattr(request, 'user') and request.user:
        user_email = getattr(request.user, 'email', user_email)

    try:
        Notification.objects(recipient_email=user_email, is_read=False).update(set__is_read=True)
    except Exception:
        pass

    return api_success(message="All notifications marked as read.")
