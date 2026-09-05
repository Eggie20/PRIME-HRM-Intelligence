"""
NBSC PRIME-HRM Intelligence Hub — JWT Authentication Middleware
Attaches authenticated User model to request.user on valid Authorization headers.
"""
import logging
from django.utils.deprecation import MiddlewareMixin
from .tokens import decode_token
from .models import User

logger = logging.getLogger(__name__)


class JWTAuthenticationMiddleware(MiddlewareMixin):
    """
    Extracts Bearer token from HTTP Authorization header,
    decodes claims, and attaches User instance to request.
    """

    def process_request(self, request):
        request.user = None
        request.user_id = None
        request.user_role = None

        auth_header = request.headers.get('Authorization', '')
        if not auth_header or not auth_header.startswith('Bearer '):
            return

        token = auth_header.split(' ', 1)[1].strip()
        if not token:
            return

        try:
            payload = decode_token(token)
            user_id = payload.get('user_id')
            if user_id:
                user = User.objects(id=user_id, is_active=True).first()
                if user:
                    request.user = user
                    request.user_id = str(user.id)
                    request.user_role = user.role
        except Exception as exc:
            # Token invalid or expired; leave request.user as None
            logger.debug(f"JWT middleware token validation error: {exc}")
