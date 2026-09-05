"""
NBSC PRIME-HRM Intelligence Hub — SARA Models
Defines conversation session and message history documents for SARA AI assistant.
"""
from datetime import datetime
import mongoengine as me


class SaraSession(me.Document):
    """
    Represents an ongoing or archived chat conversation session with SARA.
    """
    session_id = me.StringField(required=True, unique=True, max_length=64)
    user_email = me.StringField(max_length=150, null=True)
    user_role = me.StringField(max_length=50, default='GUEST')

    created_at = me.DateTimeField(default=datetime.utcnow)
    updated_at = me.DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'sara_sessions',
        'indexes': [
            'session_id',
            'user_email',
            '-updated_at'
        ]
    }

    def to_dict(self) -> dict:
        return {
            'session_id': self.session_id,
            'user_email': self.user_email,
            'user_role': self.user_role,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class SaraMessage(me.Document):
    """
    Individual chat utterance in a SARA conversation turn.
    """
    ROLES = ('user', 'assistant', 'system')

    session = me.ReferenceField(SaraSession, required=True, reverse_delete_rule=me.CASCADE)
    role = me.StringField(choices=ROLES, required=True)
    content = me.StringField(required=True)

    # Retrieval and tool metadata
    citations = me.ListField(me.DictField(), default=list)
    tool_calls = me.ListField(me.DictField(), default=list)
    suggested_prompts = me.ListField(me.StringField(), default=list)

    # User satisfaction feedback
    feedback = me.StringField(choices=('HELPFUL', 'NOT_HELPFUL', 'NONE'), default='NONE')

    created_at = me.DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'sara_messages',
        'indexes': [
            'session',
            '-created_at'
        ]
    }

    def to_dict(self) -> dict:
        return {
            'id': str(self.id),
            'session_id': self.session.session_id if self.session else None,
            'role': self.role,
            'content': self.content,
            'citations': self.citations,
            'tool_calls': self.tool_calls,
            'suggested_prompts': self.suggested_prompts,
            'feedback': self.feedback,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
