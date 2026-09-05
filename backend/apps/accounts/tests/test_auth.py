"""
Unit tests for accounts models, password security, TOTP, and JWT tokens.
"""
from django.test import TestCase
from apps.accounts.models import User
from apps.accounts.tokens import create_access_token, create_refresh_token, decode_token
from core.response import api_success, api_error
import pyotp


class AccountsModelAndTokenTests(TestCase):
    def setUp(self):
        self.user = User(
            email="test.admin@nbsc.edu.ph",
            full_name="Dr. Test Admin",
            role="HR_ADMIN",
            department="ADMIN"
        )
        self.user.set_password("SecurePassword123!")

    def test_password_hashing(self):
        """Validates password hashing and verification."""
        self.assertTrue(self.user.check_password("SecurePassword123!"))
        self.assertFalse(self.user.check_password("WrongPassword"))
        # Ensure password is not stored in plaintext
        self.assertNotIn("SecurePassword123!", self.user.password_hash)

    def test_totp_generation_and_verification(self):
        """Validates RFC 6238 TOTP secret creation and code verification."""
        secret = self.user.generate_totp_secret()
        self.assertIsNotNone(secret)
        self.assertEqual(len(secret), 32)

        # Generate valid code with pyotp
        totp = pyotp.TOTP(secret)
        current_code = totp.now()

        self.assertTrue(self.user.verify_totp(current_code))
        self.assertFalse(self.user.verify_totp("999999"))

    def test_jwt_access_and_refresh_tokens(self):
        """Validates token creation, claims encoding, and decoding."""
        self.user.id = "64f1a2b3c4d5e6f7a8b9c0d1"
        access_token = create_access_token(self.user)
        self.assertIsInstance(access_token, str)

        payload = decode_token(access_token)
        self.assertEqual(payload['email'], "test.admin@nbsc.edu.ph")
        self.assertEqual(payload['role'], "HR_ADMIN")
        self.assertEqual(payload['token_type'], "access")

        refresh_token = create_refresh_token(self.user)
        ref_payload = decode_token(refresh_token)
        self.assertEqual(ref_payload['token_type'], "refresh")

    def test_api_response_formatters(self):
        """Validates standard JSON response contract."""
        resp = api_success(data={'kpi': 42}, message="Loaded")
        self.assertEqual(resp.status_code, 200)

        err_resp = api_error(message="Not found", status=404)
        self.assertEqual(err_resp.status_code, 404)
