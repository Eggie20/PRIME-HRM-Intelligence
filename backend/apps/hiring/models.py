"""
NBSC PRIME-HRM Intelligence Hub — Hiring Intelligence Models
Includes DSS Scores, Department Head Rubrics, HRMPSB Ballots, and Appointment Decisions.
"""
from datetime import datetime
import mongoengine as me
from apps.accounts.models import User
from apps.applicants.models import Application


class DSSScore(me.Document):
    """
    4-Pillar Decision Support System score record for a candidate application.
    """
    application = me.ReferenceField(Application, required=True)
    merit_score = me.FloatField(required=True)
    competence_score = me.FloatField(required=True)
    ethics_score = me.FloatField(required=True)
    service_score = me.FloatField(required=True)
    total_score = me.FloatField(required=True)
    qs_compliant = me.BooleanField(default=True)
    details = me.DictField(default=dict)
    calculated_at = me.DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'dss_scores',
        'indexes': ['application', 'total_score', 'calculated_at']
    }

    def to_dict(self) -> dict:
        return {
            'id': str(self.id),
            'application_id': str(self.application.id) if self.application else None,
            'merit_score': self.merit_score,
            'competence_score': self.competence_score,
            'ethics_score': self.ethics_score,
            'service_score': self.service_score,
            'total_score': self.total_score,
            'qs_compliant': self.qs_compliant,
            'details': self.details,
            'calculated_at': self.calculated_at.isoformat() if self.calculated_at else None
        }


class DeptHeadEvaluation(me.Document):
    """
    Department Head technical evaluation and classroom/skill demo scoring.
    """
    RECOMMENDATIONS = ('STRONGLY_RECOMMEND', 'RECOMMEND', 'NOT_RECOMMENDED')

    application = me.ReferenceField(Application, required=True)
    evaluator = me.ReferenceField(User, required=True)
    evaluator_name = me.StringField(required=True)
    ratings = me.DictField(default=dict)
    total_score = me.FloatField(default=0.0)
    recommendation = me.StringField(choices=RECOMMENDATIONS, default='RECOMMEND')
    remarks = me.StringField(default='')
    submitted_at = me.DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'dept_head_evaluations',
        'indexes': ['application', 'evaluator', 'submitted_at']
    }

    def to_dict(self) -> dict:
        return {
            'id': str(self.id),
            'application_id': str(self.application.id) if self.application else None,
            'evaluator_id': str(self.evaluator.id) if self.evaluator else None,
            'evaluator_name': self.evaluator_name,
            'ratings': self.ratings,
            'total_score': self.total_score,
            'recommendation': self.recommendation,
            'remarks': self.remarks,
            'submitted_at': self.submitted_at.strftime('%Y-%m-%d %H:%M') if self.submitted_at else None
        }


class HRMPSBVote(me.Document):
    """
    Merit Promotion and Selection Board deliberative voting record.
    """
    VOTES = ('APPROVE', 'DISAPPROVE', 'ABSTAIN')

    application = me.ReferenceField(Application, required=True)
    voter = me.ReferenceField(User, required=True)
    voter_name = me.StringField(required=True)
    vote = me.StringField(choices=VOTES, default='APPROVE')
    rank_priority = me.IntField(default=1)
    deliberation_notes = me.StringField(default='')
    voted_at = me.DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'hrmpsb_votes',
        'indexes': ['application', 'voter', 'vote', 'voted_at']
    }

    def to_dict(self) -> dict:
        return {
            'id': str(self.id),
            'application_id': str(self.application.id) if self.application else None,
            'voter_id': str(self.voter.id) if self.voter else None,
            'voter_name': self.voter_name,
            'vote': self.vote,
            'rank_priority': self.rank_priority,
            'deliberation_notes': self.deliberation_notes,
            'voted_at': self.voted_at.strftime('%Y-%m-%d %H:%M') if self.voted_at else None
        }


class HiringDecision(me.Document):
    """
    Final appointment sign-off by HR Administrator / College President, committed to Audit Chain.
    """
    DECISIONS = ('APPOINTED', 'REJECTED')

    application = me.ReferenceField(Application, required=True)
    decision = me.StringField(choices=DECISIONS, required=True)
    resolution_number = me.StringField(required=True)
    appointed_by = me.ReferenceField(User, required=True)
    audit_block_index = me.IntField(required=True)
    audit_block_hash = me.StringField(required=True)
    decided_at = me.DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'hiring_decisions',
        'indexes': ['application', 'resolution_number', 'decision', 'decided_at']
    }

    def to_dict(self) -> dict:
        return {
            'id': str(self.id),
            'application_id': str(self.application.id) if self.application else None,
            'decision': self.decision,
            'resolution_number': self.resolution_number,
            'appointed_by_id': str(self.appointed_by.id) if self.appointed_by else None,
            'audit_block_index': self.audit_block_index,
            'audit_block_hash': self.audit_block_hash,
            'decided_at': self.decided_at.strftime('%Y-%m-%d %H:%M') if self.decided_at else None
        }
