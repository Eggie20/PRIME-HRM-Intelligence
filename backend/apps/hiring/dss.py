"""
NBSC PRIME-HRM Intelligence Hub — 4-Pillar Decision Support System (DSS) Engine
Implements Civil Service Commission PRIME-HRM Level 2 Merit Selection Scoring.
"""

# Default CSC PRIME-HRM Level 2 Weights
DEFAULT_WEIGHTS = {
    'MERIT': 0.30,
    'COMPETENCE': 0.30,
    'ETHICS': 0.20,
    'SERVICE_ORIENTATION': 0.20
}


def compute_dss_scores(application, custom_ratings: dict = None, weights: dict = None) -> dict:
    """
    Computes normalized 4-pillar scores for an application.
    @param application: Application document
    @param custom_ratings: Dict containing evaluator rubric inputs
    @param weights: Optional custom weights dictionary (must sum to 1.0)
    @returns dict with breakdown, weighted total, and radar chart coordinates
    """
    w = weights or DEFAULT_WEIGHTS
    ratings = custom_ratings or {}
    profile = getattr(application, 'applicant_profile', {}) or {}

    # Pillar 1: Merit (Weight: 30%)
    # Sub-factors: Education (15), Experience (10), Training (5)
    edu_raw = float(ratings.get('education_score', 12.0))
    exp_raw = float(ratings.get('experience_score', 8.0))
    train_raw = float(ratings.get('training_score', 4.0))
    merit_raw = min(30.0, max(0.0, edu_raw + exp_raw + train_raw))
    merit_normalized = round((merit_raw / 30.0) * 100.0, 2)

    # Pillar 2: Competence (Weight: 30%)
    # Sub-factors: Teaching Demo / Technical Exam (15), Behavioral Interview (15)
    demo_raw = float(ratings.get('teaching_demo_score', 12.5))
    interview_raw = float(ratings.get('behavioral_interview_score', 13.0))
    competence_raw = min(30.0, max(0.0, demo_raw + interview_raw))
    competence_normalized = round((competence_raw / 30.0) * 100.0, 2)

    # Pillar 3: Ethics (Weight: 20%)
    # Sub-factors: Background Investigation (10), Character References (10)
    bi_raw = float(ratings.get('background_investigation_score', 8.5))
    ref_raw = float(ratings.get('character_reference_score', 9.0))
    ethics_raw = min(20.0, max(0.0, bi_raw + ref_raw))
    ethics_normalized = round((ethics_raw / 20.0) * 100.0, 2)

    # Pillar 4: Service Orientation (Weight: 20%)
    # Sub-factors: Community Engagement (10), Public Service Dedication (10)
    community_raw = float(ratings.get('community_engagement_score', 8.5))
    dedication_raw = float(ratings.get('public_service_dedication_score', 9.0))
    service_raw = min(20.0, max(0.0, community_raw + dedication_raw))
    service_normalized = round((service_raw / 20.0) * 100.0, 2)

    # Composite Weighted Total (0 - 100)
    total_weighted = round(
        (merit_normalized * w['MERIT']) +
        (competence_normalized * w['COMPETENCE']) +
        (ethics_normalized * w['ETHICS']) +
        (service_normalized * w['SERVICE_ORIENTATION']),
        2
    )

    # CSC Qualification Standards Pass Threshold (Standard: >= 70.0)
    qs_compliant = (total_weighted >= 70.0)

    return {
        'weights': w,
        'merit': {
            'raw': merit_raw,
            'max': 30.0,
            'normalized': merit_normalized,
            'weighted_contribution': round(merit_normalized * w['MERIT'], 2)
        },
        'competence': {
            'raw': competence_raw,
            'max': 30.0,
            'normalized': competence_normalized,
            'weighted_contribution': round(competence_normalized * w['COMPETENCE'], 2)
        },
        'ethics': {
            'raw': ethics_raw,
            'max': 20.0,
            'normalized': ethics_normalized,
            'weighted_contribution': round(ethics_normalized * w['ETHICS'], 2)
        },
        'service_orientation': {
            'raw': service_raw,
            'max': 20.0,
            'normalized': service_normalized,
            'weighted_contribution': round(service_normalized * w['SERVICE_ORIENTATION'], 2)
        },
        'total_score': total_weighted,
        'qs_compliant': qs_compliant,
        'radar_coordinates': [
            merit_normalized,
            competence_normalized,
            ethics_normalized,
            service_normalized
        ]
    }
