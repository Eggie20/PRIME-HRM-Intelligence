"""
NBSC PRIME-HRM Intelligence Hub — Academic & Administrative Programs Model
"""
from datetime import datetime
import mongoengine as me


class Program(me.Document):
    """
    Academic degree program or administrative operational unit at NBSC.
    """
    DEPARTMENTS = ('DGEC', 'IBM', 'ICS', 'ITE', 'ADMIN', 'FIN', 'REG')

    code = me.StringField(required=True, unique=True, max_length=20)
    name = me.StringField(required=True, max_length=150)
    department = me.StringField(required=True, choices=DEPARTMENTS)
    description = me.StringField(default='')
    is_active = me.BooleanField(default=True)
    created_at = me.DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'programs',
        'indexes': ['code', 'department', 'is_active']
    }

    def to_dict(self) -> dict:
        return {
            'id': str(self.id),
            'code': self.code,
            'name': self.name,
            'department': self.department,
            'description': self.description,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __str__(self):
        return f"[{self.code}] {self.name} ({self.department})"
