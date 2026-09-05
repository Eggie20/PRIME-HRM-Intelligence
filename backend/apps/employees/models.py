"""
NBSC PRIME-HRM Intelligence Hub — Employee Model
Represents permanent, temporary, COS, and JO faculty and staff at NBSC.
"""
from datetime import datetime
import mongoengine as me


class Employee(me.Document):
    """
    Employee record within NBSC PRIME-HRM.
    """
    CATEGORIES = ('TEACHING', 'NON_TEACHING')
    STATUSES = ('PERMANENT', 'TEMPORARY', 'COS', 'JOB_ORDER', 'PART_TIME')
    DEPARTMENTS = ('DGEC', 'IBM', 'ICS', 'ITE', 'ADMIN', 'FIN', 'REG')

    employee_id = me.StringField(required=True, unique=True, max_length=50)
    first_name = me.StringField(required=True, max_length=100)
    last_name = me.StringField(required=True, max_length=100)
    middle_name = me.StringField(max_length=100, default='')
    email = me.EmailField(required=True, unique=True)
    phone = me.StringField(max_length=30, default='')

    department = me.StringField(required=True, choices=DEPARTMENTS)
    position = me.StringField(required=True, max_length=150)
    category = me.StringField(choices=CATEGORIES, default='TEACHING')
    employment_status = me.StringField(choices=STATUSES, default='COS')

    daily_rate = me.FloatField(default=0.0)
    monthly_salary = me.FloatField(default=0.0)
    salary_grade = me.IntField(default=12)

    date_hired = me.DateTimeField(null=True)
    date_of_birth = me.DateTimeField(null=True)
    is_active = me.BooleanField(default=True)

    created_at = me.DateTimeField(default=datetime.utcnow)
    updated_at = me.DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'employees',
        'indexes': [
            'employee_id',
            'department',
            'category',
            'employment_status',
            'is_active',
            ('last_name', 'first_name')
        ]
    }

    @property
    def full_name(self) -> str:
        if self.middle_name:
            return f"{self.last_name}, {self.first_name} {self.middle_name[0]}."
        return f"{self.last_name}, {self.first_name}"

    def to_dict(self) -> dict:
        return {
            'id': str(self.id),
            'employee_id': self.employee_id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'middle_name': self.middle_name,
            'full_name': self.full_name,
            'email': self.email,
            'phone': self.phone,
            'department': self.department,
            'position': self.position,
            'category': self.category,
            'employment_status': self.employment_status,
            'daily_rate': self.daily_rate,
            'monthly_salary': self.monthly_salary,
            'salary_grade': self.salary_grade,
            'date_hired': self.date_hired.strftime('%Y-%m-%d') if self.date_hired else None,
            'date_of_birth': self.date_of_birth.strftime('%Y-%m-%d') if self.date_of_birth else None,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __str__(self):
        return f"[{self.employee_id}] {self.full_name} — {self.position} ({self.department})"
