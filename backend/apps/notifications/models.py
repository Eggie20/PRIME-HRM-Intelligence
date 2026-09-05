"""
NBSC PRIME-HRM Intelligence Hub — Notifications Model
Defines notification document schema for in-app and email alert dispatch.
"""
from datetime import datetime
import mongoengine as me


class Notification(me.Document):
    """
    In-app alert notification document for stage updates, board votes, and payslips.
    """
    CATEGORIES = ('APPLICATION_STAGE', 'PAYROLL_READY', 'EVALUATION_REQUEST', 'SYSTEM')

    recipient_email = me.StringField(required=True, max_length=150)
    title = me.StringField(required=True, max_length=200)
    message = me.StringField(required=True)
    category = me.StringField(choices=CATEGORIES, default='SYSTEM')
    target_link = me.StringField(default='#', max_length=300)

    is_read = me.BooleanField(default=False)
    created_at = me.DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'notifications',
        'indexes': [
            'recipient_email',
            'is_read',
            '-created_at'
        ]
    }

    def to_dict(self) -> dict:
        return {
            'id': str(self.id),
            'recipient_email': self.recipient_email,
            'title': self.title,
            'message': self.message,
            'category': self.category,
            'target_link': self.target_link,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
