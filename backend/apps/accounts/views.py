"""
NBSC PRIME-HRM Intelligence Hub — Accounts API Views
Endpoints for authentication, registration, TOTP 2FA, profile, and token refresh.
"""
import io
import json
import base64
from datetime import datetime
import qrcode
from django.views.decorators.csrf import csrf_exempt
from core.response import api_success, api_error
from core.mongo import init_mongo
from .models import User
from .tokens import create_access_token, create_refresh_token, decode_token
from .decorators import login_required_api


def _parse_json(request):
    """Safely extracts JSON body from request."""
    try:
        return json.loads(request.body.decode('utf-8'))
    except Exception:
        return {}


@csrf_exempt
def login_view(request):
    """
    Staff / general login.
    POST /api/v1/auth/login/
    Body: { email, password }
    """
    if request.method != 'POST':
        return api_error("Method not allowed", status=405)

    init_mongo()
    data = _parse_json(request)
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return api_error("Email and password are required.", status=400)

    user = User.objects(email=email).first()
    if not user or not user.check_password(password):
        return api_error("Invalid email or password.", status=401)

    if not user.is_active:
        return api_error("Account is disabled. Contact HR administrator.", status=403)

    user.last_login = datetime.utcnow()
    user.save()

    # If 2FA enabled, require code verification
    if user.two_factor_enabled:
        temp_token = create_access_token(user, extra_claims={'two_factor_pending': True})
        return api_success(
            data={
                'requires_2fa': True,
                'temp_token': temp_token,
                'user': {'id': str(user.id), 'email': user.email, 'role': user.role}
            },
            message="2FA verification required."
        )

    access_token = create_access_token(user)
    refresh_token = create_refresh_token(user)

    return api_success(
        data={
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user.to_dict()
        },
        message="Login successful."
    )


@csrf_exempt
def applicant_login_view(request):
    """
    Applicant-specific sign in.
    POST /api/v1/auth/applicant/login/
    Body: { email, password }
    """
    if request.method != 'POST':
        return api_error("Method not allowed", status=405)

    init_mongo()
    data = _parse_json(request)
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return api_error("Email and password are required.", status=400)

    user = User.objects(email=email, role='APPLICANT').first()
    if not user or not user.check_password(password):
        return api_error("Invalid applicant credentials.", status=401)

    user.last_login = datetime.utcnow()
    user.save()

    access_token = create_access_token(user)
    refresh_token = create_refresh_token(user)

    return api_success(
        data={
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user.to_dict()
        },
        message="Applicant login successful."
    )


@csrf_exempt
def applicant_register_view(request):
    """
    Applicant self-registration.
    POST /api/v1/auth/applicant/register/
    Body: { full_name, email, password, phone }
    """
    if request.method != 'POST':
        return api_error("Method not allowed", status=405)

    init_mongo()
    data = _parse_json(request)
    full_name = data.get('full_name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    phone = data.get('phone', '').strip()

    if not full_name or not email or not password:
        return api_error("Full name, email, and password are required.", status=400)

    if len(password) < 8:
        return api_error("Password must be at least 8 characters long.", status=400)

    if User.objects(email=email).first():
        return api_error("An account with this email already exists.", status=409)

    user = User(
        full_name=full_name,
        email=email,
        phone=phone,
        role='APPLICANT'
    )
    user.set_password(password)
    user.save()

    access_token = create_access_token(user)
    refresh_token = create_refresh_token(user)

    return api_success(
        data={
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user.to_dict()
        },
        message="Applicant account created successfully.",
        status=201
    )


@csrf_exempt
@login_required_api
def setup_2fa_view(request):
    """
    Generates TOTP secret and QR code for 2FA onboarding.
    POST /api/v1/auth/2fa/setup/
    """
    if request.method != 'POST':
        return api_error("Method not allowed", status=405)

    user = request.user
    secret = user.generate_totp_secret()
    uri = user.get_totp_uri()
    user.save()

    # Generate QR Code image
    qr = qrcode.QRCode(version=1, box_size=8, border=2)
    qr.add_data(uri)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#0F1B2D", back_color="#FFFFFF")

    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    qr_base64 = f"data:image/png;base64,{base64.b64encode(buffer.getvalue()).decode('utf-8')}"

    return api_success(
        data={
            'secret': secret,
            'qr_code': qr_base64,
            'otpauth_uri': uri
        },
        message="2FA setup initiated."
    )


@csrf_exempt
def verify_2fa_view(request):
    """
    Verifies TOTP code to complete login or finalize 2FA setup.
    POST /api/v1/auth/2fa/verify/
    Body: { code, temp_token (if during login) }
    """
    if request.method != 'POST':
        return api_error("Method not allowed", status=405)

    init_mongo()
    data = _parse_json(request)
    code = data.get('code', '').strip()
    temp_token = data.get('temp_token', '').strip()

    target_user = None
    if getattr(request, 'user', None):
        target_user = request.user
    elif temp_token:
        try:
            payload = decode_token(temp_token)
            target_user = User.objects(id=payload.get('user_id')).first()
        except Exception:
            return api_error("Invalid or expired temporary authentication token.", status=401)

    if not target_user:
        return api_error("User context missing for 2FA verification.", status=401)

    if not target_user.verify_totp(code):
        return api_error("Invalid or expired 2FA code. Please try again.", status=400)

    # If was setting up for first time, enable flag
    if not target_user.two_factor_enabled:
        target_user.two_factor_enabled = True
        target_user.save()

    access_token = create_access_token(target_user)
    refresh_token = create_refresh_token(target_user)

    return api_success(
        data={
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': target_user.to_dict()
        },
        message="Two-factor authentication verified successfully."
    )


@csrf_exempt
@login_required_api
def me_view(request):
    """
    Returns the profile of currently authenticated user.
    GET /api/v1/auth/me/
    """
    if request.method != 'GET':
        return api_error("Method not allowed", status=405)

    return api_success(
        data={'user': request.user.to_dict()},
        message="User profile retrieved."
    )


@csrf_exempt
def refresh_token_view(request):
    """
    Refreshes access token via valid refresh token.
    POST /api/v1/auth/refresh/
    Body: { refresh_token }
    """
    if request.method != 'POST':
        return api_error("Method not allowed", status=405)

    init_mongo()
    data = _parse_json(request)
    refresh_token = data.get('refresh_token', '').strip()

    if not refresh_token:
        return api_error("Refresh token is required.", status=400)

    try:
        payload = decode_token(refresh_token)
        if payload.get('token_type') != 'refresh':
            return api_error("Invalid token type.", status=400)

        user = User.objects(id=payload.get('user_id'), is_active=True).first()
        if not user:
            return api_error("User not found or inactive.", status=401)

        new_access_token = create_access_token(user)
        return api_success(
            data={'access_token': new_access_token},
            message="Token refreshed successfully."
        )
    except Exception as exc:
        return api_error(f"Failed to refresh token: {exc}", status=401)
