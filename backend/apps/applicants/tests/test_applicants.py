"""
Unit tests for Application model and tracking.
"""
from django.test import TestCase
from apps.applicants.models import Application
from apps.vacancies.models import Vacancy


class ApplicationModelTests(TestCase):
    def test_generate_tracking_number(self):
        num = Application.generate_tracking_number()
        self.assertTrue(num.startswith('NBSC-APP-'))
        self.assertEqual(len(num.split('-')), 4)

    def test_application_stage_history(self):
        v = Vacancy(
            title="Assistant Professor I",
            department="IBM",
            education="Master in Business Administration"
        )
        app = Application(
            tracking_number="NBSC-APP-2026-99999",
            applicant_email="candidate@nbsc.edu.ph",
            applicant_name="Maria Santos",
            vacancy=v,
            stage="APPLIED"
        )
        app.add_stage_history(stage="SCREENING", actor=None, remarks="Documents verified.")
        self.assertEqual(app.stage, "SCREENING")
        self.assertEqual(len(app.stage_history), 1)
        self.assertEqual(app.stage_history[0]['remarks'], "Documents verified.")
