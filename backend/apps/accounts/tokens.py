"""
NBSC PRIME-HRM Intelligence Hub — JWT Token Generation & Verification
"""
from datetime import datetime, timedelta
import jwt
from django.conf import settings


def get_jwt_secret():
    return getattr(settings, 'JWT_SECRET_KEY', getattr(settings, 'SECRET_KEY', 'nbsc-primehrm-jwt-secret-key-production-32-chars'))


def create_access_token(user, extra_claims=None) -> str:
    """
    Generates a signed JWT access token valid for the configured lifetime.
    """
    secret = get_jwt_secret()
    lifetime_minutes = getattr(settings, 'JWT_ACCESS_TOKEN_LIFETIME_MINUTES', 60)
    exp = datetime.utcnow() + timedelta(minutes=lifetime_minutes)

    payload = {
        'user_id': str(user.id),
        'email': user.email,
        'role': user.role,
        'full_name': user.full_name,
        'exp': exp,
        'iat': datetime.utcnow(),
        'token_type': 'access'
    }
    if extra_claims:
        payload.update(extra_claims)

    return jwt.encode(payload, secret, algorithm='HS256')


def create_refresh_token(user) -> str:
    """Generates a long-lived JWT refresh token."""
    secret = get_jwt_secret()
    lifetime_days = getattr(settings, 'JWT_REFRESH_TOKEN_LIFETIME_DAYS', 7)
    exp = datetime.utcnow() + timedelta(days=lifetime_days)

    payload = {
        'user_id': str(user.id),
        'exp': exp,
        'iat': datetime.utcnow(),
        'token_type': 'refresh'
    }
    return jwt.encode(payload, secret, algorithm='HS256')


def decode_token(token: str) -> dict:
    """
    Decodes and validates a signed JWT token.
    Raises jwt.ExpiredSignatureError or jwt.InvalidTokenError on failure.
    """
    secret = get_jwt_secret()
    return jwt.decode(token, secret, algorithms=['HS256'])
