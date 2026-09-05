"""
Unit tests for 4-Pillar DSS scoring algorithm.
"""
from django.test import TestCase
from apps.hiring.dss import compute_dss_scores, DEFAULT_WEIGHTS


class DSSScoringTests(TestCase):
    def test_dss_scoring_computation(self):
        sample_ratings = {
            'education_score': 15.0,  # 15/15
            'experience_score': 10.0,  # 10/10
            'training_score': 5.0,     # 5/5 -> Merit = 100%
            'teaching_demo_score': 15.0,
            'behavioral_interview_score': 15.0, # Competence = 100%
            'background_investigation_score': 10.0,
            'character_reference_score': 10.0, # Ethics = 100%
            'community_engagement_score': 10.0,
            'public_service_dedication_score': 10.0 # Service = 100%
        }
        res = compute_dss_scores(None, custom_ratings=sample_ratings)
        self.assertEqual(res['total_score'], 100.0)
        self.assertTrue(res['qs_compliant'])
        self.assertEqual(res['radar_coordinates'], [100.0, 100.0, 100.0, 100.0])

    def test_dss_failing_threshold(self):
        low_ratings = {
            'education_score': 5.0,
            'experience_score': 2.0,
            'training_score': 1.0,
            'teaching_demo_score': 5.0,
            'behavioral_interview_score': 5.0,
            'background_investigation_score': 4.0,
            'character_reference_score': 4.0,
            'community_engagement_score': 3.0,
            'public_service_dedication_score': 3.0
        }
        res = compute_dss_scores(None, custom_ratings=low_ratings)
        self.assertLess(res['total_score'], 70.0)
        self.assertFalse(res['qs_compliant'])
