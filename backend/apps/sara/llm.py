"""
NBSC PRIME-HRM Intelligence Hub — SARA LLM Engine
Manages SARA's persona, Gemini Flash SDK integration, policy RAG retrieval,
and role-scoped tool dispatching with resilient fallback.
"""
import os
import re
import logging
from django.conf import settings
from .rag import search_prime_hrm_policies
from .tools import tool_query_vacancies, tool_track_application, tool_get_headcount_stats

logger = logging.getLogger(__name__)

SARA_SYSTEM_PROMPT = """
You are SARA (Smart Assistant for Recruitment & Analytics), the official AI Human Resource Officer of Northern Bukidnon State College (NBSC).
Your responsibilities:
1. Provide authoritative, courteous, and precise answers on Philippine Civil Service rules, CSC PRIME-HRM Level 2 standards, and NBSC institutional policies.
2. Explain the 4-Pillar Merit Selection Plan (Merit 30%, Competence 30%, Ethics 20%, Service Orientation 20%).
3. Assist applicants in tracking their 8-stage recruitment applications.
4. Explain compensation, TRAIN Law statutory deductions, and encrypted payslip access.
Tone: Warm, highly professional, academic, respectful, and encouraging. Always cite relevant CSC resolutions, laws, or institutional manuals when referencing rules.
"""


def get_gemini_client():
    """Returns initialized GenAI client if API key is present."""
    api_key = os.environ.get('GEMINI_API_KEY') or getattr(settings, 'GEMINI_API_KEY', None)
    if not api_key:
        return None
    try:
        from google import genai
        return genai.Client(api_key=api_key)
    except Exception as e:
        logger.debug("Could not initialize google-genai client: %s", e)
        return None


class SaraEngine:
    """
    Conversational pipeline for SARA incorporating tool calling, RAG, and LLM generation.
    """
    @classmethod
    def process_query(cls, user_message: str, user_role: str = 'GUEST') -> dict:
        """
        Executes query analysis, checks for database tool triggers and policy RAG matches,
        and constructs the final AI assistant response with citations and suggested questions.
        """
        msg_lower = user_message.lower().strip()
        citations = []
        tool_calls = []
        suggested_prompts = []

        # 1. Check for Application Tracking Code (e.g. NBSC-APP-2026-10042)
        track_match = re.search(r'nbsc[-_]app[-_]\d{4}[-_]\d+', msg_lower)
        if track_match or 'track' in msg_lower or 'status' in msg_lower:
            code = track_match.group(0).upper().replace('_', '-') if track_match else 'NBSC-APP-2026-10042'
            track_res = tool_track_application(code)
            tool_calls.append({'tool': 'track_application', 'args': {'tracking_number': code}, 'result': track_res})

            if track_res.get('found'):
                app_info = track_res
                content = (
                    f"Hello! I retrieved your application docket for **{app_info['applicant_name']}**:\n\n"
                    f"• **Tracking Code**: `{app_info['tracking_number']}`\n"
                    f"• **Position**: {app_info['position']}\n"
                    f"• **Current Stage**: **Stage {app_info['current_stage']}**\n"
                    f"• **Date Submitted**: {app_info['applied_at']}\n\n"
                    f"Your documents have passed documentary screening and are scheduled for the next committee review. "
                    f"You will receive automatic SMS and portal notifications as your application progresses!"
                )
                suggested_prompts = [
                    "What happens during Stage 3 (4-Pillar DSS Scoring)?",
                    "How are Department Head evaluations conducted?",
                    "What documents are needed for final appointment?"
                ]
                return {
                    'response': content,
                    'citations': [],
                    'tool_calls': tool_calls,
                    'suggested_prompts': suggested_prompts
                }

        # 2. Check for Open Vacancies / Job Board Queries
        if any(w in msg_lower for w in ['job', 'vacancy', 'vacancies', 'hiring', 'opening', 'position', 'apply', 'slots']):
            dept = None
            for d in ['ICS', 'IBM', 'ITE', 'DGEC', 'ADMIN']:
                if d.lower() in msg_lower:
                    dept = d
                    break
            vac_res = tool_query_vacancies(department=dept)
            tool_calls.append({'tool': 'query_vacancies', 'args': {'department': dept}, 'result': vac_res})

            vac_list = vac_res.get('vacancies', [])
            if vac_list:
                items_str = "\n".join([
                    f"• **{v['title']}** ({v['department']}) — Salary Grade {v['salary_grade']} (₱{v['monthly_salary']:,.2f}/mo) • Deadline: {v['deadline']}"
                    for v in vac_list
                ])
                content = (
                    f"NBSC is actively recruiting qualified faculty and administrative personnel! Here are current openings:\n\n"
                    f"{items_str}\n\n"
                    f"You can apply directly through our **Career Job Board** with your PDS (CS Form 212) and Transcript of Records."
                )
            else:
                content = "There are currently no active job vacancies matching that department. Please check our Public Job Board regularly for new openings!"

            suggested_prompts = [
                "What are the QS requirements for Instructor I?",
                "How do I submit my PDS CS Form 212?",
                "What are the 4 pillars of the NBSC Merit Selection Plan?"
            ]
            return {
                'response': content,
                'citations': [],
                'tool_calls': tool_calls,
                'suggested_prompts': suggested_prompts
            }

        # 3. Check for Headcount / Statistics Queries (Restricted/Staff)
        if any(w in msg_lower for w in ['headcount', 'statistics', 'how many employees', 'faculty count', 'total staff']):
            stats_res = tool_get_headcount_stats(user_role=user_role)
            tool_calls.append({'tool': 'get_headcount_stats', 'args': {}, 'result': stats_res})

            content = (
                f"Here is the institutional personnel summary for Northern Bukidnon State College:\n\n"
                f"• **Total Active Personnel**: {stats_res.get('total_headcount', 0)}\n"
                f"• **Teaching Faculty**: {stats_res.get('teaching', 0)}\n"
                f"• **Non-Teaching Staff**: {stats_res.get('non_teaching', 0)}\n\n"
                f"Department Distribution:\n" +
                "\n".join([f"  - {dept}: {count} personnel" for dept, count in stats_res.get('departments', {}).items()])
            )
            suggested_prompts = [
                "What is the status of the current hiring pipeline?",
                "View PRIME-HRM compliance level",
                "How are merit selection pillars weighted?"
            ]
            return {
                'response': content,
                'citations': [],
                'tool_calls': tool_calls,
                'suggested_prompts': suggested_prompts
            }

        # 4. Check for Greetings / Introduction
        if any(w in msg_lower for w in ['hello', 'hi', 'hey', 'greetings', 'who are you', 'what can you do', 'help me']):
            content = (
                "Greetings! I am **SARA**, your AI HR Officer at Northern Bukidnon State College. "
                "I can assist you with:\n\n"
                "• **PRIME-HRM Level 2 Policies**: Merit Selection Plan, 4-Pillar DSS formula, and CSC QS criteria.\n"
                "• **Recruitment & Tracking**: Search active teaching/staff vacancies and look up application milestones.\n"
                "• **Compensation & Payroll**: TRAIN Law statutory deductions and AES-128 encrypted payslips.\n\n"
                "How may I assist you today?"
            )
            suggested_prompts = [
                "What are the 4 pillars of the NBSC Merit Selection Plan?",
                "What are the active faculty vacancies?",
                "How is withholding tax computed under TRAIN Law?"
            ]
            return {
                'response': content,
                'citations': [],
                'tool_calls': tool_calls,
                'suggested_prompts': suggested_prompts
            }

        # 5. RAG Policy Search
        rag_hits = search_prime_hrm_policies(user_message, top_k=2)
        citations = rag_hits

        # Try Live Gemini Flash Generation if client available
        client = get_gemini_client()
        if client:
            try:
                context_texts = [f"[{h['title']} - {h['section']}]: {h['excerpt']}" for h in rag_hits]
                prompt = (
                    f"{SARA_SYSTEM_PROMPT}\n\n"
                    f"Retrieved Policy Context:\n" + "\n\n".join(context_texts) + "\n\n"
                    f"User Query: {user_message}\n"
                    f"Provide an authoritative, polite response with specific citations to NBSC/CSC regulations."
                )
                gemini_resp = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt
                )
                if gemini_resp and gemini_resp.text:
                    return {
                        'response': gemini_resp.text,
                        'citations': citations,
                        'tool_calls': tool_calls,
                        'suggested_prompts': [
                            "How do I unlock my encrypted payslip PDF?",
                            "What are the Qualification Standards for Assistant Professor?",
                            "Track an existing application: NBSC-APP-2026-10042"
                        ]
                    }
            except Exception as e:
                logger.debug("Live Gemini generation fallback: %s", e)

        # Deterministic High-Quality Policy Response Fallback
        if rag_hits:
            hit = rag_hits[0]
            content = (
                f"Based on **{hit['title']}** (*{hit['section']}*):\n\n"
                f"{hit['excerpt']}\n\n"
                f"All evaluation rubrics and appointments at NBSC strictly follow these Civil Service Commission provisions."
            )
            suggested_prompts = [
                "How do I unlock my encrypted payslip PDF?",
                "What are the Qualification Standards for Assistant Professor?",
                "Track an existing application: NBSC-APP-2026-10042"
            ]
        else:
            content = (
                "Greetings! I am **SARA**, your AI HR Officer at Northern Bukidnon State College. "
                "I can assist you with:\n\n"
                "• **PRIME-HRM Level 2 Policies**: Merit Selection Plan, 4-Pillar DSS formula, and CSC QS criteria.\n"
                "• **Recruitment & Tracking**: Search active teaching/staff vacancies and look up application milestones.\n"
                "• **Compensation & Payroll**: TRAIN Law statutory deductions and AES-128 encrypted payslips.\n\n"
                "How may I assist you today?"
            )
            suggested_prompts = [
                "What are the 4 pillars of the NBSC Merit Selection Plan?",
                "What are the active faculty vacancies?",
                "How is withholding tax computed under TRAIN Law?"
            ]

        return {
            'response': content,
            'citations': citations,
            'tool_calls': tool_calls,
            'suggested_prompts': suggested_prompts
        }
