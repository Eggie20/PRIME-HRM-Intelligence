"""
NBSC PRIME-HRM Intelligence Hub — Audit Trail API Views
"""
from django.views.decorators.csrf import csrf_exempt
from core.response import api_success, api_error
from core.mongo import init_mongo
from core.pagination import paginate_queryset
from apps.accounts.decorators import login_required_api, role_required
from .models import AuditBlock
from .chain import verify_chain, ensure_genesis_block


@csrf_exempt
@login_required_api
def audit_chain_view(request):
    """
    GET: List all audit blocks in chronological sequence with pagination.
    """
    init_mongo()
    ensure_genesis_block()

    if request.method != 'GET':
        return api_error("Method not allowed.", status=405)

    page = request.GET.get('page', 1)
    page_size = request.GET.get('page_size', 20)
    action = request.GET.get('action', '').strip().upper()

    query = AuditBlock.objects.order_by('-index')
    if action:
        query = query.filter(action=action)

    items, meta = paginate_queryset(query, page=page, page_size=page_size)

    return api_success(
        data={
            'blocks': [b.to_dict() for b in items],
            'pagination': meta
        },
        message="Audit chain retrieved successfully."
    )


@csrf_exempt
@login_required_api
def audit_block_detail_view(request, index):
    """
    GET: Retrieve details of a single block by its sequential index.
    """
    init_mongo()
    if request.method != 'GET':
        return api_error("Method not allowed.", status=405)

    try:
        idx = int(index)
    except (ValueError, TypeError):
        return api_error("Invalid block index.", status=400)

    block = AuditBlock.objects(index=idx).first()
    if not block:
        return api_error(f"Block #{idx} does not exist.", status=404)

    return api_success(data={'block': block.to_dict()})


@csrf_exempt
@login_required_api
def audit_verify_view(request):
    """
    POST or GET: Runs full chain verification from Genesis to current tip.
    """
    init_mongo()
    report = verify_chain()
    status_code = 200 if report['valid'] else 409
    return api_success(data={'report': report}, message=report['message'], status=status_code)
