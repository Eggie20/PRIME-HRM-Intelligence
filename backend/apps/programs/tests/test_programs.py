"""
Unit tests for Program model and serialization.
"""
from django.test import TestCase
from apps.programs.models import Program


class ProgramModelTests(TestCase):
    def test_program_to_dict(self):
        p = Program(
            code="BSIT",
            name="Bachelor of Science in Information Technology",
            department="ICS",
            description="Computing curriculum"
        )
        d = p.to_dict()
        self.assertEqual(d['code'], "BSIT")
        self.assertEqual(d['department'], "ICS")
        self.assertTrue(d['is_active'])
