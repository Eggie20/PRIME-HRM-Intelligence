"""
NBSC PRIME-HRM Intelligence Hub — SARA Test Suite
Verifies RAG policy search, conversational queries, persona formatting,
and tool calls.
"""
import json
from unittest.mock import patch
from django.test import TestCase, Client
from apps.sara.rag import search_prime_hrm_policies, PRIME_HRM_POLICIES
from apps.sara.llm import SaraEngine


class SaraAITests(TestCase):
    """Verifies SARA RAG, tool calling, and conversational response engine."""

    def setUp(self):
        self.client = Client()

    def test_rag_policy_retrieval_merit_selection(self):
        results = search_prime_hrm_policies("What are the 4 pillars of merit selection?", top_k=1)
        self.assertGreater(len(results), 0)
        self.assertIn("4 Pillars", results[0]['title'])
        self.assertIn("Merit", results[0]['excerpt'])
        self.assertIn("Competence", results[0]['excerpt'])

    def test_rag_policy_retrieval_qualification_standards(self):
        results = search_prime_hrm_policies("What are the QS requirements for Instructor I in faculty?", top_k=1)
        self.assertGreater(len(results), 0)
        self.assertIn("Qualification Standards", results[0]['title'])

    def test_sara_engine_general_greeting(self):
        result = SaraEngine.process_query("Hello SARA, what can you do?")
        self.assertIn("SARA", result['response'])
        self.assertIn("PRIME-HRM Level 2", result['response'])
        self.assertGreater(len(result['suggested_prompts']), 0)

    def test_sara_engine_policy_answer(self):
        result = SaraEngine.process_query("Explain the 4 pillars of merit selection plan.")
        self.assertIn("4 Pillars", result['response'])
        self.assertGreater(len(result['citations']), 0)
        self.assertIn("Merit", result['response'])

    def test_sara_engine_vacancies_intent(self):
        with patch('apps.sara.llm.tool_query_vacancies') as mock_vac:
            mock_vac.return_value = {
                'success': True,
                'count': 1,
                'vacancies': [{
                    'id': 'v1',
                    'title': 'Instructor I (Information Technology)',
                    'department': 'ICS',
                    'category': 'TEACHING',
                    'salary_grade': 12,
                    'monthly_salary': 29165.0,
                    'slots': 2,
                    'deadline': 'September 30, 2026'
                }]
            }
            result = SaraEngine.process_query("Are there any job vacancies or hiring in ICS?")
            self.assertIn("Instructor I", result['response'])
            self.assertEqual(len(result['tool_calls']), 1)
            self.assertEqual(result['tool_calls'][0]['tool'], 'query_vacancies')

    def test_sara_engine_tracking_intent(self):
        with patch('apps.sara.llm.tool_track_application') as mock_track:
            mock_track.return_value = {
                'success': True,
                'found': True,
                'tracking_number': 'NBSC-APP-2026-10042',
                'applicant_name': 'April Anne Elizabeth A. Bajao',
                'position': 'Instructor I (IT)',
                'current_stage': 'SCREENING',
                'applied_at': 'September 1, 2026',
                'milestones': []
            }
            result = SaraEngine.process_query("Track application NBSC-APP-2026-10042")
            self.assertIn("April Anne Elizabeth A. Bajao", result['response'])
            self.assertIn("NBSC-APP-2026-10042", result['response'])
            self.assertEqual(len(result['tool_calls']), 1)

    def test_sara_chat_endpoint(self):
        payload = {
            'message': 'What are the 4 pillars of merit selection plan?'
        }
        response = self.client.post(
            '/api/v1/sara/chat/',
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data['success'])
        self.assertIn('response', json_data['data'])
        self.assertIn('session_id', json_data['data'])
        self.assertGreater(len(json_data['data']['response']), 20)
