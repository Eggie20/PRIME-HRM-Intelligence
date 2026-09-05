"""
NBSC PRIME-HRM Intelligence Hub — Pagination Helpers
"""
import math


def paginate_queryset(queryset, page=1, page_size=10):
    """
    Paginates a MongoEngine QuerySet or Python list.
    Returns: (items, pagination_meta)
    """
    try:
        page = max(1, int(page))
    except (ValueError, TypeError):
        page = 1

    try:
        page_size = max(1, min(100, int(page_size)))
    except (ValueError, TypeError):
        page_size = 10

    if not isinstance(queryset, (list, tuple)) and callable(getattr(queryset, 'count', None)):
        total_count = queryset.count()
    else:
        total_count = len(queryset)

    total_pages = max(1, math.ceil(total_count / page_size)) if total_count > 0 else 1
    offset = (page - 1) * page_size

    if hasattr(queryset, 'skip') and hasattr(queryset, 'limit'):
        items = list(queryset.skip(offset).limit(page_size))
    else:
        items = list(queryset[offset:offset + page_size])

    meta = {
        'page': page,
        'page_size': page_size,
        'total_items': total_count,
        'total_pages': total_pages,
        'has_next': page < total_pages,
        'has_prev': page > 1
    }

    return items, meta
