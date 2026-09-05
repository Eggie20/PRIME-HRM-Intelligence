"""
NBSC PRIME-HRM Intelligence Hub — Response Formatters
Provides unified, consistent JSON response schemas across all REST API endpoints.
"""
from django.http import JsonResponse


def api_success(data=None, message="Operation successful", status=200, **kwargs):
    """
    Standard successful JSON response structure.
    {
        "success": true,
        "message": "...",
        "data": { ... }
    }
    """
    payload = {
        "success": True,
        "message": message,
        "data": data if data is not None else {}
    }
    if kwargs:
        payload.update(kwargs)
    return JsonResponse(payload, status=status, safe=False)


def api_error(message="An error occurred", errors=None, status=400, **kwargs):
    """
    Standard error JSON response structure.
    {
        "success": false,
        "message": "...",
        "errors": [ ... ]
    }
    """
    payload = {
        "success": False,
        "message": message,
        "errors": errors if errors is not None else []
    }
    if kwargs:
        payload.update(kwargs)
    return JsonResponse(payload, status=status, safe=False)
