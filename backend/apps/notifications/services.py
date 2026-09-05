"""
NBSC PRIME-HRM Intelligence Hub — Notification Services
Manages dispatching of in-app alert documents and email notices for stage transitions,
HRMPSB deliberation notices, and payslip releases.
"""
import logging
from django.conf import settings
from django.core.mail import send_mail
from core.mongo import init_mongo
from .models import Notification

logger = logging.getLogger(__name__)


def create_notification(
    recipient_email: str,
    title: str,
    message: str,
    category: str = 'SYSTEM',
    target_link: str = '#'
) -> Notification:
    """
    Creates and persists an in-app Notification document.
    """
    try:
        init_mongo()
        note = Notification(
            recipient_email=recipient_email,
            title=title,
            message=message,
            category=category,
            target_link=target_link,
            is_read=False
        )
        note.save()
        return note
    except Exception as e:
        logger.warning("Could not persist in-app notification: %s", e)
        return None


def send_notification_email(recipient_email: str, subject: str, message: str) -> bool:
    """
    Sends an email alert to the specified recipient. Gracefully falls back if SMTP is not configured.
    """
    try:
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'hrmo@nbsc.edu.ph')
        send_mail(
            subject=subject,
            message=message,
            from_email=from_email,
            recipient_list=[recipient_email],
            fail_silently=True
        )
        return True
    except Exception as e:
        logger.debug("Email notification skipped or failed: %s", e)
        return False


def notify_application_stage_change(application, old_stage: str, new_stage: str) -> Notification:
    """
    Notifies an applicant and HR admins when their recruitment application stage changes.
    """
    stage_labels = {
        'APPLIED': 'Application Submitted',
        'SCREENING': 'Documentary Qualification Screening',
        'DSS_SCORED': '4-Pillar DSS Scoring Completed',
        'DEPT_EVALUATION': 'Department Head Rubric Evaluation',
        'DELIBERATION': 'HRMPSB Board Deliberation',
        'APPOINTMENT_ISSUED': 'Appointment Resolution Issued',
        'DOCUMENT_VERIFICATION': 'Pre-Employment Compliance Verification',
        'ONBOARDED': 'Formal Induction & Plantilla Onboarding'
    }

    new_label = stage_labels.get(new_stage, new_stage)
    position_title = application.vacancy.title if application.vacancy else "NBSC Position"
    title = f"Application Status Update: {new_label}"
    msg = (
        f"Dear {application.applicant_name}, your application for {position_title} "
        f"(Docket: {application.tracking_number}) has advanced to {new_label}."
    )
    link = f"/frontend/pages/applicants/application-track/application-track.html?tracking={application.tracking_number}"

    # Dispatch to applicant
    note = create_notification(
        recipient_email=application.applicant_email,
        title=title,
        message=msg,
        category='APPLICATION_STAGE',
        target_link=link
    )

    # Optional email notice
    send_notification_email(
        recipient_email=application.applicant_email,
        subject=f"[NBSC HRMS] {title}",
        message=f"{msg}\n\nTrack progress online: {link}"
    )

    return note


def notify_hrmpsb_deliberation(vacancy, applicants_count: int = 0) -> list:
    """
    Dispatches board deliberation alerts to HRMPSB Committee Members.
    """
    title = f"HRMPSB Deliberation Notice: {vacancy.title}"
    msg = (
        f"Deliberation session is now active for {vacancy.title} ({vacancy.department}) "
        f"with {applicants_count} qualified candidate(s) awaiting committee ballots."
    )
    link = "/frontend/pages/hiring/deliberation/deliberation.html"

    # Default board email
    board_emails = ['hrmpsb@nbsc.edu.ph', 'admin@nbsc.edu.ph']
    notes = []
    for email in board_emails:
        n = create_notification(
            recipient_email=email,
            title=title,
            message=msg,
            category='EVALUATION_REQUEST',
            target_link=link
        )
        if n:
            notes.append(n)
        send_notification_email(email, f"[NBSC HRMPSB] {title}", f"{msg}\n\nAccess Panel: {link}")

    return notes


def notify_payslip_released(employee, period_label: str, payslip_id: str = None) -> Notification:
    """
    Alerts an employee when their semi-monthly compensation payslip is generated.
    """
    title = f"Encrypted Payslip Ready: {period_label}"
    msg = (
        f"Your encrypted compensation statement for {period_label} is now available for download. "
        f"Unlock using your Employee ID and date of birth formula."
    )
    link = "/frontend/pages/payroll/payslip-download/payslip-download.html"

    emp_email = getattr(employee, 'email', None) or f"{employee.first_name.lower()}.{employee.last_name.lower()}@nbsc.edu.ph"
    note = create_notification(
        recipient_email=emp_email,
        title=title,
        message=msg,
        category='PAYROLL_READY',
        target_link=link
    )

    send_notification_email(emp_email, f"[NBSC Payroll] {title}", f"{msg}\n\nDownload Portal: {link}")
    return note
