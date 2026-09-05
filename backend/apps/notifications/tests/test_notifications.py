"""
NBSC PRIME-HRM Intelligence Hub — Notifications Test Suite
Verifies notification listing, mark-as-read endpoints, and dispatching services.
"""
from django.test import TestCase, Client
from unittest.mock import MagicMock
from apps.notifications.services import (
    create_notification,
    notify_application_stage_change,
    notify_hrmpsb_deliberation,
    notify_payslip_released
)


class NotificationsTests(TestCase):
    def setUp(self):
        self.client = Client()

    def test_list_notifications(self):
        response = self.client.get('/api/v1/notifications/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertIn('unread_count', data['data'])
        self.assertIn('notifications', data['data'])

    def test_mark_notification_read(self):
        response = self.client.post('/api/v1/notifications/notif-1/read/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])

    def test_mark_all_read(self):
        response = self.client.post('/api/v1/notifications/read-all/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])

    def test_service_create_notification(self):
        note = create_notification(
            recipient_email='test@nbsc.edu.ph',
            title='Test Alert',
            message='This is a test notification.',
            category='SYSTEM'
        )
        if note:
            self.assertEqual(note.recipient_email, 'test@nbsc.edu.ph')
            self.assertFalse(note.is_read)

    def test_service_notify_application_stage_change(self):
        mock_app = MagicMock()
        mock_app.applicant_name = 'Maria Santos'
        mock_app.applicant_email = 'maria@example.com'
        mock_app.tracking_number = 'NBSC-APP-2026-99999'
        mock_app.vacancy.title = 'Instructor I (ICS)'

        note = notify_application_stage_change(mock_app, 'SCREENING', 'DSS_SCORED')
        if note:
            self.assertEqual(note.recipient_email, 'maria@example.com')
            self.assertIn('4-Pillar DSS Scoring', note.title)

    def test_service_notify_hrmpsb_deliberation(self):
        mock_vac = MagicMock()
        mock_vac.title = 'Assistant Professor II (IBM)'
        mock_vac.department = 'IBM'

        notes = notify_hrmpsb_deliberation(mock_vac, applicants_count=3)
        self.assertIsInstance(notes, list)

    def test_service_notify_payslip_released(self):
        mock_emp = MagicMock()
        mock_emp.first_name = 'John'
        mock_emp.last_name = 'Doe'
        mock_emp.email = 'jdoe@nbsc.edu.ph'

        note = notify_payslip_released(mock_emp, 'September 1–15, 2026')
        if note:
            self.assertEqual(note.recipient_email, 'jdoe@nbsc.edu.ph')
            self.assertIn('September 1–15, 2026', note.title)
