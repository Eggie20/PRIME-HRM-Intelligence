"""
NBSC PRIME-HRM Intelligence Hub — User Document Model
Defines User schema, roles, password hashing, and TOTP 2FA.
"""
from datetime import datetime
import mongoengine as me
import pyotp
from django.contrib.auth.hashers import make_password, check_password


class User(me.Document):
    """
    User account document supporting RBAC and 2FA.
    """
    ROLES = ('HR_ADMIN', 'HRMPSB_MEMBER', 'DEPT_HEAD', 'APPLICANT', 'EMPLOYEE')

    email = me.EmailField(required=True, unique=True)
    password_hash = me.StringField(required=True)
    full_name = me.StringField(required=True, max_length=150)
    role = me.StringField(choices=ROLES, default='APPLICANT')
    department = me.StringField(max_length=50, null=True)  # DGEC, IBM, ICS, ITE, ADMIN, etc.
    phone = me.StringField(max_length=30, null=True)

    # Two-Factor Authentication (TOTP via RFC 6238)
    two_factor_enabled = me.BooleanField(default=False)
    two_factor_secret = me.StringField(max_length=64, null=True)

    is_active = me.BooleanField(default=True)
    last_login = me.DateTimeField(null=True)
    created_at = me.DateTimeField(default=datetime.utcnow)
    updated_at = me.DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'users',
        'indexes': [
            'email',
            'role',
            'department'
        ]
    }

    def set_password(self, raw_password: str):
        """Hashes password with Django's cryptographic hasher."""
        self.password_hash = make_password(raw_password)

    def check_password(self, raw_password: str) -> bool:
        """Verifies candidate password against stored hash."""
        return check_password(raw_password, self.password_hash)

    def generate_totp_secret(self) -> str:
        """Generates and stores new base32 secret for TOTP."""
        secret = pyotp.random_base32()
        self.two_factor_secret = secret
        return secret

    def get_totp_uri(self, issuer_name="NBSC PRIME-HRM") -> str:
        """Generates otpauth:// URI for authenticator QR codes."""
        if not self.two_factor_secret:
            self.generate_totp_secret()
        return pyotp.totp.TOTP(self.two_factor_secret).provisioning_uri(
            name=self.email,
            issuer_name=issuer_name
        )

    def verify_totp(self, code: str) -> bool:
        """Verifies standard 6-digit TOTP code with time drift window."""
        if not self.two_factor_secret:
            return False
        totp = pyotp.TOTP(self.two_factor_secret)
        return totp.verify(str(code).strip(), valid_window=1)

    def to_dict(self) -> dict:
        """Serializes user for public API responses."""
        return {
            'id': str(self.id),
            'email': self.email,
            'full_name': self.full_name,
            'role': self.role,
            'department': self.department,
            'phone': self.phone,
            'two_factor_enabled': self.two_factor_enabled,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __str__(self):
        return f"{self.full_name} <{self.email}> ({self.role})"
