"""
NBSC PRIME-HRM Intelligence Hub — SARA Views
REST endpoints for conversational voice & text AI queries, session history,
and user feedback tracking.
"""
import json
import uuid
from datetime import datetime
from django.views.decorators.csrf import csrf_exempt
from core.response import api_success, api_error
from .models import SaraSession, SaraMessage
from .llm import SaraEngine


@csrf_exempt
def sara_chat_view(request):
    """
    POST /api/v1/sara/chat/
    Accepts user message (from Web Speech recognition transcript or keyboard),
    retrieves policy citations and executes tools, and saves conversation turn.
    """
    if request.method != 'POST':
        return api_error("Method not allowed", status_code=405)

    try:
        body = json.loads(request.body.decode('utf-8'))
    except Exception:
        body = {}

    user_message = body.get('message', '').strip()
    if not user_message:
        return api_error("Missing required field 'message'.", status_code=400)

    session_id = body.get('session_id', '').strip()
    if not session_id:
        session_id = f"SARA-{uuid.uuid4().hex[:12].upper()}"

    user_email = getattr(request.user, 'email', 'guest@nbsc.edu.ph') if getattr(request, 'user', None) else 'guest@nbsc.edu.ph'
    user_role = getattr(request.user, 'role', 'GUEST') if getattr(request, 'user', None) else 'GUEST'

    # Get or create session (with fallback if MongoDB is offline)
    session = None
    try:
        session = SaraSession.objects(session_id=session_id).first()
        if not session:
            session = SaraSession(
                session_id=session_id,
                user_email=user_email,
                user_role=user_role
            )
            session.save()
        else:
            session.updated_at = datetime.utcnow()
            session.save()

        # Save user message
        user_msg_doc = SaraMessage(
            session=session,
            role='user',
            content=user_message
        )
        user_msg_doc.save()
    except Exception:
        pass

    # Process query through SARA engine (RAG + Tools + Persona)
    ai_result = SaraEngine.process_query(user_message, user_role=user_role)

    # Save assistant message
    message_id = f"MSG-{uuid.uuid4().hex[:8]}"
    if session:
        try:
            asst_msg_doc = SaraMessage(
                session=session,
                role='assistant',
                content=ai_result['response'],
                citations=ai_result.get('citations', []),
                tool_calls=ai_result.get('tool_calls', []),
                suggested_prompts=ai_result.get('suggested_prompts', [])
            )
            asst_msg_doc.save()
            message_id = str(asst_msg_doc.id)
        except Exception:
            pass

    return api_success(
        data={
            'session_id': session.session_id if session else session_id,
            'message_id': message_id,
            'response': ai_result['response'],
            'citations': ai_result.get('citations', []),
            'tool_calls': ai_result.get('tool_calls', []),
            'suggested_prompts': ai_result.get('suggested_prompts', [])
        },
        message="SARA AI response generated."
    )


def sara_history_view(request, session_id):
    """
    GET /api/v1/sara/history/<session_id>/
    Retrieves previous message history for an ongoing session.
    """
    session = SaraSession.objects(session_id=session_id).first()
    if not session:
        return api_error(f"Conversation session '{session_id}' not found.", status_code=404)

    messages = SaraMessage.objects(session=session).order_by('created_at')
    return api_success(
        data={
            'session': session.to_dict(),
            'messages': [m.to_dict() for m in messages]
        },
        message="Conversation history retrieved."
    )


@csrf_exempt
def sara_feedback_view(request):
    """
    POST /api/v1/sara/feedback/
    Updates user helpfulness rating on an assistant utterance.
    """
    if request.method != 'POST':
        return api_error("Method not allowed", status_code=405)

    try:
        body = json.loads(request.body.decode('utf-8'))
    except Exception:
        body = {}

    message_id = body.get('message_id')
    rating = body.get('rating', 'HELPFUL').upper()

    if not message_id or rating not in ('HELPFUL', 'NOT_HELPFUL'):
        return api_error("Invalid parameters. 'message_id' and valid 'rating' required.", status_code=400)

    msg = SaraMessage.objects(id=message_id).first()
    if not msg:
        return api_error("Message not found.", status_code=404)

    msg.feedback = rating
    msg.save()

    return api_success(
        data={'message_id': str(msg.id), 'feedback': msg.feedback},
        message="Feedback saved. Thank you for helping SARA improve!"
    )
