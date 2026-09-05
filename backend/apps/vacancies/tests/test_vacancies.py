"""
Unit tests for Vacancy model and API functionality.
"""
from datetime import datetime, timedelta
from django.test import TestCase
from apps.vacancies.models import Vacancy


class VacancyModelTests(TestCase):
    def test_vacancy_to_dict_and_is_open(self):
        v = Vacancy(
            title="Instructor I",
            department="ICS",
            category="TEACHING",
            education="Master of Science in Information Technology",
            salary_grade=12,
            monthly_salary=29165.00,
            slots=2,
            status="OPEN",
            deadline=datetime.utcnow() + timedelta(days=14)
        )
        d = v.to_dict()
        self.assertEqual(d['title'], "Instructor I")
        self.assertEqual(d['department'], "ICS")
        self.assertEqual(d['category'], "TEACHING")
        self.assertEqual(d['salary_grade'], 12)
        self.assertTrue(d['is_open'])
        self.assertEqual(d['slots'], 2)

    def test_vacancy_expired(self):
        v = Vacancy(
            title="Administrative Aide VI",
            department="ADMIN",
            category="NON_TEACHING",
            education="Completion of 2 years in college",
            status="OPEN",
            deadline=datetime.utcnow() - timedelta(days=1)
        )
        self.assertFalse(v.is_open())
