"""
Unit tests for Employee models and pagination.
"""
from django.test import TestCase
from apps.employees.models import Employee
from apps.employees.services import generate_unique_employee_id
from core.pagination import paginate_queryset


class EmployeeModelTests(TestCase):
    def test_employee_full_name_and_dict(self):
        emp = Employee(
            employee_id="NBSC-2026-0001",
            first_name="Jovelyn",
            last_name="Delosa",
            middle_name="G.",
            email="jdelosa@nbsc.edu.ph",
            department="ADMIN",
            position="College President",
            category="TEACHING",
            employment_status="PERMANENT",
            daily_rate=1325.68,
            monthly_salary=110000.0
        )
        self.assertIn("Delosa, Jovelyn", emp.full_name)
        d = emp.to_dict()
        self.assertEqual(d['employee_id'], "NBSC-2026-0001")
        self.assertEqual(d['department'], "ADMIN")
        self.assertEqual(d['position'], "College President")

    def test_pagination_helper(self):
        sample_list = list(range(25))
        items, meta = paginate_queryset(sample_list, page=1, page_size=10)
        self.assertEqual(len(items), 10)
        self.assertEqual(meta['total_items'], 25)
        self.assertEqual(meta['total_pages'], 3)
        self.assertTrue(meta['has_next'])
        self.assertFalse(meta['has_prev'])

        items_p2, meta_p2 = paginate_queryset(sample_list, page=3, page_size=10)
        self.assertEqual(len(items_p2), 5)
        self.assertFalse(meta_p2['has_next'])
        self.assertTrue(meta_p2['has_prev'])
