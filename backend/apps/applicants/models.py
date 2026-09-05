"""
NBSC PRIME-HRM Intelligence Hub — Application Document Model
Represents recruitment applications across the 8-stage Merit Selection lifecycle.
"""
from datetime import datetime
import random
import mongoengine as me
from apps.accounts.models import User
from apps.vacancies.models import Vacancy


class Application(me.Document):
    """
    Candidate application tracking through the 8-stage civil service hiring process.
    """
    STAGES = (
        'APPLIED',
        'SCREENING',
        'DSS_SCORED',
        'DEPT_EVAL',
        'DELIBERATION',
        'FINAL_DECISION',
        'APPOINTED',
        'REJECTED'
    )

    tracking_number = me.StringField(required=True, unique=True, max_length=50)
    applicant = me.ReferenceField(User, null=True)
    applicant_email = me.StringField(required=True)
    applicant_name = me.StringField(required=True)
    vacancy = me.ReferenceField(Vacancy, required=True)

    stage = me.StringField(choices=STAGES, default='APPLIED')
    applicant_profile = me.DictField(default=dict)
    documents = me.ListField(me.DictField(), default=list)
    stage_history = me.ListField(me.DictField(), default=list)
    disqualification_reason = me.StringField(default='')

    created_at = me.DateTimeField(default=datetime.utcnow)
    updated_at = me.DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'applications',
        'indexes': [
            'tracking_number',
            'applicant_email',
            'vacancy',
            'stage',
            'created_at'
        ]
    }

    @classmethod
    def generate_tracking_number(cls) -> str:
        """Generates unique tracking number format: NBSC-APP-YYYY-XXXXX"""
        year = datetime.utcnow().year
        while True:
            rand_digits = f"{random.randint(10000, 99999)}"
            num = f"NBSC-APP-{year}-{rand_digits}"
            try:
                if not cls.objects(tracking_number=num).first():
                    return num
            except Exception:
                return num

    def add_stage_history(self, stage: str, actor=None, remarks: str = '') -> None:
        """Appends a new milestone entry to stage_history."""
        actor_id = str(actor.id) if actor and getattr(actor, 'id', None) else 'SYSTEM'
        actor_name = f"{actor.first_name} {actor.last_name}" if actor and getattr(actor, 'first_name', None) else 'System'
        actor_role = getattr(actor, 'role', 'SYSTEM') if actor else 'SYSTEM'

        self.stage_history.append({
            'stage': stage,
            'actor_id': actor_id,
            'actor_name': actor_name,
            'actor_role': actor_role,
            'remarks': remarks,
            'timestamp': datetime.utcnow().isoformat()
        })
        self.stage = stage
        self.updated_at = datetime.utcnow()

    def to_dict(self, summary_only: bool = False) -> dict:
        vacancy_title = self.vacancy.title if self.vacancy else 'Unknown Position'
        vacancy_dept = self.vacancy.department if self.vacancy else 'N/A'
        vacancy_cat = self.vacancy.category if self.vacancy else 'N/A'

        data = {
            'id': str(self.id),
            'tracking_number': self.tracking_number,
            'applicant_name': self.applicant_name,
            'applicant_email': self.applicant_email,
            'vacancy_id': str(self.vacancy.id) if self.vacancy else None,
            'vacancy_title': vacancy_title,
            'vacancy_department': vacancy_dept,
            'vacancy_category': vacancy_cat,
            'stage': self.stage,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M') if self.created_at else None,
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M') if self.updated_at else None
        }

        if not summary_only:
            data['applicant_profile'] = self.applicant_profile
            data['documents'] = self.documents
            data['stage_history'] = self.stage_history
            data['disqualification_reason'] = self.disqualification_reason

        return data

    def __str__(self):
        return f"{self.tracking_number} - {self.applicant_name} ({self.stage})"
