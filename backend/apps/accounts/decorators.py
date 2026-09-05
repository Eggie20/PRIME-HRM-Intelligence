"""
NBSC PRIME-HRM Intelligence Hub — Role-Based Access Control Decorators
"""
from functools import wraps
from core.response import api_error


def login_required_api(view_func):
    """
    Ensures an authenticated User is present on request.
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not getattr(request, 'user', None):
            return api_error("Authentication required. Please log in.", status=401)
        return view_func(request, *args, **kwargs)
    return wrapper


def role_required(*allowed_roles):
    """
    Ensures authenticated user possesses at least one of the specified roles.
    Example: @role_required('HR_ADMIN', 'HRMPSB_MEMBER')
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            user = getattr(request, 'user', None)
            if not user:
                return api_error("Authentication required. Please log in.", status=401)
            if user.role not in allowed_roles:
                return api_error(
                    f"Forbidden: role '{user.role}' is not authorized to access this resource.",
                    status=403
                )
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator
