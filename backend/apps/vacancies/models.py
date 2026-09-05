"""
NBSC PRIME-HRM Intelligence Hub — Vacancy Document Model
Represents teaching and non-teaching position vacancies under CSC PRIME-HRM standards.
"""
from datetime import datetime
import mongoengine as me


class Vacancy(me.Document):
    """
    Job vacancy posting with Civil Service Commission qualification standards (QS).
    """
    CATEGORIES = ('TEACHING', 'NON_TEACHING')
    STATUSES = ('OPEN', 'DELIBERATION', 'CLOSED', 'ARCHIVED')
    EMPLOYMENT_STATUSES = ('COS', 'PERMANENT', 'TEMPORARY', 'JOB_ORDER')
    DEPARTMENTS = ('DGEC', 'IBM', 'ICS', 'ITE', 'ADMIN', 'FIN', 'REG')

    title = me.StringField(required=True, max_length=150)  # e.g. Instructor I
    department = me.StringField(required=True, choices=DEPARTMENTS)
    category = me.StringField(choices=CATEGORIES, default='TEACHING')
    employment_status = me.StringField(choices=EMPLOYMENT_STATUSES, default='COS')

    # Civil Service Commission Qualification Standards (QS)
    education = me.StringField(required=True)  # e.g. Master of Arts in Social Science
    experience = me.StringField(default='None Required')
    training = me.StringField(default='None Required')
    eligibility = me.StringField(default='None Required / RA 1080')

    daily_rate = me.FloatField(default=1325.68)
    monthly_salary = me.FloatField(default=29165.00)
    salary_grade = me.IntField(default=12)
    slots = me.IntField(default=1)
    applicant_count = me.IntField(default=0)

    description = me.StringField(default='')
    status = me.StringField(choices=STATUSES, default='OPEN')
    deadline = me.DateTimeField(null=True)

    created_at = me.DateTimeField(default=datetime.utcnow)
    updated_at = me.DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'vacancies',
        'indexes': [
            'department',
            'category',
            'status',
            'created_at'
        ]
    }

    def is_open(self) -> bool:
        """Returns True if vacancy is open and deadline has not passed."""
        if self.status != 'OPEN':
            return False
        if self.deadline and self.deadline < datetime.utcnow():
            return False
        return True

    def to_dict(self) -> dict:
        return {
            'id': str(self.id),
            'title': self.title,
            'department': self.department,
            'category': self.category,
            'employment_status': self.employment_status,
            'education': self.education,
            'experience': self.experience,
            'training': self.training,
            'eligibility': self.eligibility,
            'daily_rate': self.daily_rate,
            'monthly_salary': self.monthly_salary,
            'salary_grade': self.salary_grade,
            'slots': self.slots,
            'applicant_count': self.applicant_count,
            'description': self.description,
            'status': self.status,
            'is_open': self.is_open(),
            'deadline': self.deadline.strftime('%Y-%m-%d') if self.deadline else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __str__(self):
        return f"{self.title} - {self.department} ({self.status})"
