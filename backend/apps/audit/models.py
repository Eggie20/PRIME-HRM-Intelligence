"""
NBSC PRIME-HRM Intelligence Hub — Cryptographic Audit Trail Document Model
Represents immutable, SHA-256 hash-chained compliance events.
"""
from datetime import datetime
import mongoengine as me


class AuditBlock(me.Document):
    """
    Immutable ledger block linked cryptographically to the preceding block.
    """
    index = me.IntField(required=True, unique=True)
    timestamp = me.DateTimeField(default=datetime.utcnow)
    actor_id = me.StringField(required=True)
    actor_email = me.StringField(required=True)
    actor_role = me.StringField(required=True)
    action = me.StringField(required=True)
    target_id = me.StringField(default='')
    payload = me.DictField(default=dict)
    prev_hash = me.StringField(required=True, max_length=64)
    hash = me.StringField(required=True, max_length=64)

    meta = {
        'collection': 'audit_chain',
        'indexes': [
            'index',
            'actor_email',
            'action',
            'target_id',
            'timestamp'
        ],
        'ordering': ['index']
    }

    def to_dict(self) -> dict:
        return {
            'index': self.index,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'actor_id': self.actor_id,
            'actor_email': self.actor_email,
            'actor_role': self.actor_role,
            'action': self.action,
            'target_id': self.target_id,
            'payload': self.payload,
            'prev_hash': self.prev_hash,
            'hash': self.hash
        }

    def __str__(self):
        return f"Block #{self.index} [{self.action}] - {self.hash[:16]}..."
