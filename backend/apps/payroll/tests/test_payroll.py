"""
NBSC PRIME-HRM Intelligence Hub — Payroll Test Suite
Verifies TRAIN Law withholding tax computation, statutory deductions,
ReportLab payslip PDF generation, and pypdf 128-bit AES encryption.
"""
from django.test import TestCase
from pypdf import PdfReader
from apps.payroll.models import PayrollBatch, PayslipRecord
from apps.payroll.services import (
    compute_train_tax_bimonthly,
    compute_statutory_deductions,
    PayslipPDFGenerator,
    PayslipEncryptor
)


class PayrollCalculationTests(TestCase):
    """Verifies Philippine TRAIN Law & statutory contribution calculations."""

    def test_train_law_bimonthly_tax_brackets(self):
        # 1. Bracket 1: <= 10,417 -> 0%
        self.assertEqual(compute_train_tax_bimonthly(8000.0), 0.0)
        self.assertEqual(compute_train_tax_bimonthly(10417.0), 0.0)

        # 2. Bracket 2: 10,417 to 16,666 -> 15% of excess
        tax_15k = compute_train_tax_bimonthly(15000.0)
        expected_15k = round((15000.0 - 10417.0) * 0.15, 2)
        self.assertAlmostEqual(tax_15k, expected_15k, places=2)

        # 3. Bracket 3: 16,667 to 33,332 -> 937.50 + 20% of excess
        tax_25k = compute_train_tax_bimonthly(25000.0)
        expected_25k = round(937.50 + (25000.0 - 16667.0) * 0.20, 2)
        self.assertAlmostEqual(tax_25k, expected_25k, places=2)

    def test_statutory_deductions_regular(self):
        # Semi-monthly basic pay of 20,000 for PERMANENT employee
        res = compute_statutory_deductions(20000.0, employment_status='PERMANENT')
        self.assertEqual(res['gsis'], 1800.0)  # 9% of 20k
        self.assertEqual(res['philhealth'], 500.0)  # 2.5% of 20k
        self.assertEqual(res['pagibig'], 100.0)  # standard
        self.assertGreater(res['withholding_tax'], 0.0)

    def test_statutory_deductions_cos(self):
        # COS faculty does not have GSIS / PhilHealth deducted through government payroll
        res = compute_statutory_deductions(14582.50, employment_status='COS')
        self.assertEqual(res['gsis'], 0.0)
        self.assertEqual(res['philhealth'], 0.0)
        self.assertEqual(res['pagibig'], 0.0)

    def test_payslip_pdf_generation_and_encryption(self):
        """Validates that a ReportLab PDF is created and successfully encrypted with employee password."""
        batch = PayrollBatch(
            batch_id='PAY-TEST-001',
            period_label='September 1–15, 2026',
            department='ICS'
        )

        rec = PayslipRecord(
            batch=batch,
            employee_id='NBSC-2024-0005',
            full_name='Mark Anthony Reyes',
            department='ICS',
            position='Instructor I',
            salary_grade=12,
            email='reyes.mark@nbsc.edu.ph',
            date_of_birth='06181995',
            basic_pay=14582.50,
            pera=1000.00
        )
        rec.compute_totals()

        # Generate in-memory PDF buffer
        pdf_buf = PayslipPDFGenerator.generate_pdf_buffer(rec, batch.period_label)
        self.assertIsNotNone(pdf_buf)
        self.assertGreater(pdf_buf.getbuffer().nbytes, 1000)

        # Encrypt and save
        saved_path = PayslipEncryptor.encrypt_and_save(pdf_buf, rec, batch.batch_id)
        self.assertTrue(saved_path.endswith('.pdf'))

        # Check with pypdf
        expected_password = rec.get_encryption_password()
        self.assertEqual(expected_password, '000506181995')

        reader = PdfReader(saved_path)
        self.assertTrue(reader.is_encrypted)

        # Unlock with formula password
        decrypt_result = reader.decrypt(expected_password)
        self.assertTrue(decrypt_result > 0)
        self.assertGreater(len(reader.pages), 0)
