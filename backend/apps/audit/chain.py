"""
NBSC PRIME-HRM Intelligence Hub — SHA-256 Hash Chain Service
Implements tamper-evident cryptographic block generation and integrity auditing.
"""
import hashlib
import json
from datetime import datetime
from .models import AuditBlock


def calculate_payload_hash(payload: dict) -> str:
    """Computes deterministic SHA-256 digest of canonical JSON payload."""
    canonical_json = json.dumps(payload or {}, sort_keys=True, separators=(',', ':'))
    return hashlib.sha256(canonical_json.encode('utf-8')).hexdigest()


def calculate_block_hash(
    index: int,
    timestamp_iso: str,
    actor_email: str,
    action: str,
    target_id: str,
    payload_hash: str,
    prev_hash: str
) -> str:
    """Computes block header SHA-256 digest."""
    header = f"{index}:{timestamp_iso}:{actor_email}:{action}:{target_id}:{payload_hash}:{prev_hash}"
    return hashlib.sha256(header.encode('utf-8')).hexdigest()


def ensure_genesis_block() -> AuditBlock:
    """Creates initial Genesis block if chain is empty."""
    genesis = AuditBlock.objects(index=0).first()
    if genesis:
        return genesis

    index = 0
    timestamp = datetime(2026, 1, 1, 0, 0, 0)
    actor_id = 'SYSTEM'
    actor_email = 'system@nbsc.edu.ph'
    actor_role = 'SYSTEM'
    action = 'GENESIS'
    target_id = '0'
    payload = {'message': 'NBSC PRIME-HRM Intelligence Hub Genesis Block'}
    prev_hash = '0' * 64

    payload_hash = calculate_payload_hash(payload)
    block_hash = calculate_block_hash(
        index,
        timestamp.isoformat(),
        actor_email,
        action,
        target_id,
        payload_hash,
        prev_hash
    )

    genesis = AuditBlock(
        index=index,
        timestamp=timestamp,
        actor_id=actor_id,
        actor_email=actor_email,
        actor_role=actor_role,
        action=action,
        target_id=target_id,
        payload=payload,
        prev_hash=prev_hash,
        hash=block_hash
    )
    genesis.save()
    return genesis


def create_block(actor, action: str, target_id: str = '', payload: dict = None) -> AuditBlock:
    """
    Appends a new verified cryptographic block to the audit ledger.
    @param actor: User object or None
    @param action: Action string (e.g. HIRING_FINAL_DECISION, STAGE_TRANSITION)
    @param target_id: ID of subject entity
    @param payload: Relevant state change metadata
    @returns AuditBlock
    """
    ensure_genesis_block()

    last_block = AuditBlock.objects.order_by('-index').first()
    new_index = (last_block.index + 1) if last_block else 0
    prev_hash = last_block.hash if last_block else ('0' * 64)

    timestamp = datetime.utcnow()
    actor_id = str(actor.id) if actor and getattr(actor, 'id', None) else 'SYSTEM'
    actor_email = getattr(actor, 'email', 'system@nbsc.edu.ph') if actor else 'system@nbsc.edu.ph'
    actor_role = getattr(actor, 'role', 'SYSTEM') if actor else 'SYSTEM'
    safe_payload = payload or {}

    payload_hash = calculate_payload_hash(safe_payload)
    block_hash = calculate_block_hash(
        new_index,
        timestamp.isoformat(),
        actor_email,
        action,
        target_id,
        payload_hash,
        prev_hash
    )

    new_block = AuditBlock(
        index=new_index,
        timestamp=timestamp,
        actor_id=actor_id,
        actor_email=actor_email,
        actor_role=actor_role,
        action=action,
        target_id=target_id,
        payload=safe_payload,
        prev_hash=prev_hash,
        hash=block_hash
    )
    new_block.save()
    return new_block


def verify_chain() -> dict:
    """
    Validates complete hash chain from Genesis to tip.
    Detects any manipulated payloads, broken pointers, or altered hashes.
    """
    ensure_genesis_block()
    blocks = list(AuditBlock.objects.order_by('index'))

    if not blocks:
        return {
            'valid': False,
            'total_blocks': 0,
            'tampered_block_index': None,
            'message': 'Audit ledger is empty.'
        }

    for i, block in enumerate(blocks):
        # Verify genesis
        if block.index == 0:
            if block.prev_hash != ('0' * 64):
                return {
                    'valid': False,
                    'total_blocks': len(blocks),
                    'tampered_block_index': 0,
                    'message': 'Genesis block prev_hash is corrupted.'
                }
        else:
            prev_block = blocks[i - 1]
            if block.prev_hash != prev_block.hash:
                return {
                    'valid': False,
                    'total_blocks': len(blocks),
                    'tampered_block_index': block.index,
                    'message': f"Broken hash linkage between Block #{prev_block.index} and #{block.index}."
                }

        # Recompute hash
        payload_hash = calculate_payload_hash(block.payload)
        expected_hash = calculate_block_hash(
            block.index,
            block.timestamp.isoformat() if block.timestamp else '',
            block.actor_email,
            block.action,
            block.target_id,
            payload_hash,
            block.prev_hash
        )

        if block.hash != expected_hash:
            return {
                'valid': False,
                'total_blocks': len(blocks),
                'tampered_block_index': block.index,
                'message': f"Block #{block.index} hash mismatch. Payload or headers tampered."
            }

    return {
        'valid': True,
        'total_blocks': len(blocks),
        'tampered_block_index': None,
        'message': f"PASS: All {len(blocks)} audit blocks verified cryptographically intact."
    }
