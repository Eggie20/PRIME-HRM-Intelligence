"""
NBSC PRIME-HRM Intelligence Hub — Hiring Intelligence API Views
"""
import json
from datetime import datetime
from django.views.decorators.csrf import csrf_exempt
from core.response import api_success, api_error
from core.mongo import init_mongo
from apps.accounts.decorators import login_required_api, role_required
from apps.applicants.models import Application
from apps.audit.chain import create_block
from .models import DSSScore, DeptHeadEvaluation, HRMPSBVote, HiringDecision
from .dss import compute_dss_scores, DEFAULT_WEIGHTS


def _parse_json(request):
    try:
        return json.loads(request.body.decode('utf-8'))
    except Exception:
        return {}


@csrf_exempt
@login_required_api
def dss_score_view(request, application_id):
    """
    GET: Retrieve existing DSS score.
    POST: Calculate or recalculate 4-pillar DSS score.
    """
    init_mongo()

    try:
        app = Application.objects(id=application_id).first()
    except Exception:
        return api_error("Invalid application ID.", status=400)

    if not app:
        return api_error("Application not found.", status=404)

    if request.method == 'GET':
        dss = DSSScore.objects(application=app).order_by('-calculated_at').first()
        if not dss:
            # Default preview calculation
            preview = compute_dss_scores(app)
            return api_success(data={'dss': preview, 'persisted': False})
        return api_success(data={'dss': dss.to_dict(), 'persisted': True})

    elif request.method == 'POST':
        data = _parse_json(request)
        ratings = data.get('ratings', {})
        weights = data.get('weights', DEFAULT_WEIGHTS)

        computed = compute_dss_scores(app, custom_ratings=ratings, weights=weights)

        dss = DSSScore.objects(application=app).first()
        if not dss:
            dss = DSSScore(application=app)

        dss.merit_score = computed['merit']['normalized']
        dss.competence_score = computed['competence']['normalized']
        dss.ethics_score = computed['ethics']['normalized']
        dss.service_score = computed['service_orientation']['normalized']
        dss.total_score = computed['total_score']
        dss.qs_compliant = computed['qs_compliant']
        dss.details = computed
        dss.calculated_at = datetime.utcnow()
        dss.save()

        # Advance stage if in earlier steps
        if app.stage in ['APPLIED', 'SCREENING']:
            app.add_stage_history(
                stage='DSS_SCORED',
                actor=request.user,
                remarks=f"4-Pillar DSS score computed: {computed['total_score']}/100."
            )
            app.save()

        return api_success(
            data={'dss': dss.to_dict()},
            message=f"4-Pillar DSS score computed successfully ({computed['total_score']}/100)."
        )

    return api_error("Method not allowed.", status=405)


@csrf_exempt
@login_required_api
def dept_head_evaluation_view(request, application_id):
    """
    GET: Retrieve Department Head evaluation(s).
    POST: Submit Department Head rubric scores and recommendation.
    """
    init_mongo()

    try:
        app = Application.objects(id=application_id).first()
    except Exception:
        return api_error("Invalid application ID.", status=400)

    if not app:
        return api_error("Application not found.", status=404)

    if request.method == 'GET':
        evals = DeptHeadEvaluation.objects(application=app).order_by('-submitted_at')
        return api_success(data={'evaluations': [e.to_dict() for e in evals]})

    elif request.method == 'POST':
        user = request.user
        if user.role not in ['DEPT_HEAD', 'HR_ADMIN']:
            return api_error("Only Department Heads or HR Admins can submit formal evaluations.", status=403)

        data = _parse_json(request)
        ratings = data.get('ratings', {})
        recommendation = data.get('recommendation', 'RECOMMEND').strip().upper()
        remarks = data.get('remarks', '').strip()
        total_score = float(data.get('total_score', 85.0))

        if recommendation not in DeptHeadEvaluation.RECOMMENDATIONS:
            return api_error(f"Invalid recommendation. Choose: {', '.join(DeptHeadEvaluation.RECOMMENDATIONS)}", status=400)

        evaluator_name = f"{user.first_name} {user.last_name}".strip() or user.email

        evaluation = DeptHeadEvaluation(
            application=app,
            evaluator=user,
            evaluator_name=evaluator_name,
            ratings=ratings,
            total_score=total_score,
            recommendation=recommendation,
            remarks=remarks
        )
        evaluation.save()

        # Advance stage to DEPT_EVAL
        if app.stage in ['APPLIED', 'SCREENING', 'DSS_SCORED']:
            app.add_stage_history(
                stage='DEPT_EVAL',
                actor=user,
                remarks=f"Department Head evaluation submitted ({recommendation})."
            )
            app.save()

        return api_success(
            data={'evaluation': evaluation.to_dict()},
            message="Department Head evaluation submitted successfully.",
            status=201
        )

    return api_error("Method not allowed.", status=405)


@csrf_exempt
@login_required_api
def hrmpsb_voting_view(request, application_id):
    """
    GET: Get current user's ballot and all member votes.
    POST: Cast HRMPSB deliberative vote (HRMPSB_MEMBER or HR_ADMIN).
    """
    init_mongo()

    try:
        app = Application.objects(id=application_id).first()
    except Exception:
        return api_error("Invalid application ID.", status=400)

    if not app:
        return api_error("Application not found.", status=404)

    user = request.user

    if request.method == 'GET':
        my_vote = HRMPSBVote.objects(application=app, voter=user).first()
        all_votes = HRMPSBVote.objects(application=app).order_by('-voted_at')

        return api_success(data={
            'my_vote': my_vote.to_dict() if my_vote else None,
            'votes': [v.to_dict() for v in all_votes]
        })

    elif request.method == 'POST':
        if user.role not in ['HRMPSB_MEMBER', 'HR_ADMIN']:
            return api_error("Only HRMPSB Board Members can cast deliberation ballots.", status=403)

        data = _parse_json(request)
        vote_choice = data.get('vote', '').strip().upper()
        rank_priority = int(data.get('rank_priority', 1))
        deliberation_notes = data.get('deliberation_notes', '').strip()

        if vote_choice not in HRMPSBVote.VOTES:
            return api_error(f"Invalid vote choice. Must be one of: {', '.join(HRMPSBVote.VOTES)}", status=400)

        voter_name = f"{user.first_name} {user.last_name}".strip() or user.email

        # Upsert user vote
        vote_record = HRMPSBVote.objects(application=app, voter=user).first()
        if not vote_record:
            vote_record = HRMPSBVote(application=app, voter=user)

        vote_record.voter_name = voter_name
        vote_record.vote = vote_choice
        vote_record.rank_priority = rank_priority
        vote_record.deliberation_notes = deliberation_notes
        vote_record.voted_at = datetime.utcnow()
        vote_record.save()

        # Advance stage to DELIBERATION
        if app.stage in ['APPLIED', 'SCREENING', 'DSS_SCORED', 'DEPT_EVAL']:
            app.add_stage_history(
                stage='DELIBERATION',
                actor=user,
                remarks=f"HRMPSB deliberative vote cast ({vote_choice})."
            )
            app.save()

        return api_success(
            data={'vote': vote_record.to_dict()},
            message=f"Ballot successfully recorded ({vote_choice})."
        )

    return api_error("Method not allowed.", status=405)


@csrf_exempt
@login_required_api
def deliberation_summary_view(request, application_id):
    """
    GET: Comprehensive comparative summary of candidate's credentials, DSS score,
    department head rubrics, and HRMPSB consensus tally.
    """
    init_mongo()

    try:
        app = Application.objects(id=application_id).first()
    except Exception:
        return api_error("Invalid application ID.", status=400)

    if not app:
        return api_error("Application not found.", status=404)

    dss = DSSScore.objects(application=app).order_by('-calculated_at').first()
    evals = DeptHeadEvaluation.objects(application=app).order_by('-submitted_at')
    votes = list(HRMPSBVote.objects(application=app))

    vote_tally = {
        'APPROVE': sum(1 for v in votes if v.vote == 'APPROVE'),
        'DISAPPROVE': sum(1 for v in votes if v.vote == 'DISAPPROVE'),
        'ABSTAIN': sum(1 for v in votes if v.vote == 'ABSTAIN'),
        'TOTAL': len(votes)
    }

    decision = HiringDecision.objects(application=app).first()

    return api_success(data={
        'application': app.to_dict(),
        'dss': dss.to_dict() if dss else None,
        'evaluations': [e.to_dict() for e in evals],
        'votes': [v.to_dict() for v in votes],
        'vote_tally': vote_tally,
        'final_decision': decision.to_dict() if decision else None
    })


@csrf_exempt
@login_required_api
def final_decision_view(request, application_id):
    """
    POST: Issue final hiring appointment or rejection resolution.
    Cryptographically commits the decision to the SHA-256 Audit Chain.
    Restricted to HR_ADMIN.
    """
    init_mongo()
    if request.method != 'POST':
        return api_error("Method not allowed.", status=405)

    user = request.user
    if user.role != 'HR_ADMIN':
        return api_error("Only the HR Administrator / Board Chair can commit appointment resolutions.", status=403)

    try:
        app = Application.objects(id=application_id).first()
    except Exception:
        return api_error("Invalid application ID.", status=400)

    if not app:
        return api_error("Application not found.", status=404)

    data = _parse_json(request)
    decision_type = data.get('decision', '').strip().upper()
    remarks = data.get('remarks', '').strip()
    resolution_number = data.get('resolution_number', '').strip()

    if decision_type not in HiringDecision.DECISIONS:
        return api_error("Decision must be 'APPOINTED' or 'REJECTED'.", status=400)

    year = datetime.utcnow().year
    if not resolution_number:
        resolution_number = f"NBSC-BOT-RES-{year}-{app.tracking_number.split('-')[-1]}"

    # Commit Cryptographic Block to SHA-256 Audit Chain
    audit_payload = {
        'resolution_number': resolution_number,
        'tracking_number': app.tracking_number,
        'applicant_name': app.applicant_name,
        'applicant_email': app.applicant_email,
        'vacancy_title': app.vacancy.title if app.vacancy else 'Position',
        'vacancy_department': app.vacancy.department if app.vacancy else 'NBSC',
        'decision': decision_type,
        'signed_by': f"{user.first_name} {user.last_name}".strip() or user.email,
        'remarks': remarks
    }

    block = create_block(
        actor=user,
        action=f"HIRING_{decision_type}",
        target_id=str(app.id),
        payload=audit_payload
    )

    # Save HiringDecision document
    decision_record = HiringDecision.objects(application=app).first()
    if not decision_record:
        decision_record = HiringDecision(application=app)

    decision_record.decision = decision_type
    decision_record.resolution_number = resolution_number
    decision_record.appointed_by = user
    decision_record.audit_block_index = block.index
    decision_record.audit_block_hash = block.hash
    decision_record.decided_at = datetime.utcnow()
    decision_record.save()

    # Transition Application stage
    app.add_stage_history(
        stage=decision_type,
        actor=user,
        remarks=f"Appointment Resolution #{resolution_number} issued. Audit Block #{block.index} signed ({block.hash[:16]}...)."
    )
    if decision_type == 'REJECTED':
        app.disqualification_reason = remarks or 'HRMPSB deliberation concluded.'

    app.save()

    return api_success(
        data={
            'decision': decision_record.to_dict(),
            'audit_block': block.to_dict()
        },
        message=f"Official appointment decision '{decision_type}' committed to Audit Chain (Block #{block.index})."
    )
