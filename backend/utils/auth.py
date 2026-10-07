import os
import time
from functools import wraps
from datetime import datetime, timezone
import jwt
from flask import request, jsonify, g, current_app
from config import Config
from models import db
from models.user import User

# In-memory store for basic rate-limiting of authentication attempts
# Format: { key: [timestamp, timestamp, ...] }
_FAILED_ATTEMPTS = {}
RATE_LIMIT_WINDOW = 300  # 5 minutes
RATE_LIMIT_MAX_ATTEMPTS = 5  # Max failed attempts per window

def _get_jwt_secret():
    """Retrieve the configured JWT secret key."""
    if current_app:
        return current_app.config.get('JWT_SECRET_KEY') or os.getenv('JWT_SECRET_KEY') or Config.SECRET_KEY
    return os.getenv('JWT_SECRET_KEY') or Config.SECRET_KEY

def generate_access_token(user, expires_in=None):
    """
    Generates a secure signed JWT token containing standard claims.
    """
    secret = _get_jwt_secret()
    if expires_in is None:
        if current_app:
            expires_in = current_app.config.get('JWT_ACCESS_TOKEN_EXPIRES', 86400)
        else:
            expires_in = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 86400))

    now = int(time.time())
    payload = {
        'sub': str(user.id),
        'user_id': user.id,
        'phone': user.phone,
        'role': user.role,
        'name': user.name,
        'iat': now,
        'exp': now + expires_in
    }
    return jwt.encode(payload, secret, algorithm='HS256')

def decode_access_token(token):
    """
    Decodes and verifies a JWT token.
    Returns (payload, error_string, http_status_code).
    """
    secret = _get_jwt_secret()
    try:
        payload = jwt.decode(token, secret, algorithms=['HS256'])
        return payload, None, 200
    except jwt.ExpiredSignatureError:
        return None, 'Token has expired. Please log in again.', 401
    except (jwt.InvalidTokenError, jwt.DecodeError) as e:
        return None, f'Invalid token: {str(e)}', 401
    except Exception as e:
        return None, f'Authentication error: {str(e)}', 401

def get_token_from_request():
    """Extracts Bearer token from the HTTP Authorization header."""
    auth_header = request.headers.get('Authorization', '').strip()
    if not auth_header:
        return None
    parts = auth_header.split()
    if len(parts) == 2 and parts[0].lower() == 'bearer':
        return parts[1]
    return None

def jwt_required(fn):
    """
    Decorator requiring a valid JWT Bearer token.
    Populates g.current_user and g.jwt_payload on success.
    Returns consistent 401 JSON responses on failure.
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        token = get_token_from_request()
        if not token:
            return jsonify({
                'success': False,
                'error': 'Unauthorized',
                'message': 'Authorization token required. Please sign in.'
            }), 401

        payload, error_msg, status_code = decode_access_token(token)
        if error_msg or not payload:
            return jsonify({
                'success': False,
                'error': 'Unauthorized',
                'message': error_msg or 'Invalid authorization token.'
            }), status_code

        user_id_raw = payload.get('sub') or payload.get('user_id')
        try:
            user_id = int(user_id_raw)
        except (ValueError, TypeError):
            return jsonify({
                'success': False,
                'error': 'Unauthorized',
                'message': 'Malformed token subject identifier.'
            }), 401

        user = db.session.get(User, user_id)
        if not user:
            return jsonify({
                'success': False,
                'error': 'Unauthorized',
                'message': 'User associated with this token no longer exists.'
            }), 401

        if user.verification_status == 'SUSPENDED':
            return jsonify({
                'success': False,
                'error': 'Account Suspended',
                'message': 'Your account has been suspended pending administrative inquiry.'
            }), 403

        g.current_user = user
        g.jwt_payload = payload
        return fn(*args, **kwargs)
    return wrapper

def jwt_optional(fn):
    """
    Decorator that populates g.current_user if a valid token is present,
    but does NOT reject unauthenticated requests.
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        token = get_token_from_request()
        g.current_user = None
        g.jwt_payload = None

        if token:
            payload, error_msg, _ = decode_access_token(token)
            if payload and not error_msg:
                user_id_raw = payload.get('sub') or payload.get('user_id')
                try:
                    user_id = int(user_id_raw)
                    user = db.session.get(User, user_id)
                    if user and user.verification_status != 'SUSPENDED':
                        g.current_user = user
                        g.jwt_payload = payload
                except (ValueError, TypeError):
                    pass

        return fn(*args, **kwargs)
    return wrapper

def role_required(*allowed_roles):
    """
    Decorator enforcing role-based authorization.
    Can be used together with or without explicit @jwt_required.
    """
    normalized_roles = [r.upper() for r in allowed_roles]

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            # Ensure user is authenticated first
            if not getattr(g, 'current_user', None):
                token = get_token_from_request()
                if not token:
                    return jsonify({
                        'success': False,
                        'error': 'Unauthorized',
                        'message': 'Authorization token required. Please sign in.'
                    }), 401

                payload, error_msg, status_code = decode_access_token(token)
                if error_msg or not payload:
                    return jsonify({
                        'success': False,
                        'error': 'Unauthorized',
                        'message': error_msg or 'Invalid authorization token.'
                    }), status_code

                user_id_raw = payload.get('sub') or payload.get('user_id')
                try:
                    user_id = int(user_id_raw)
                except (ValueError, TypeError):
                    return jsonify({
                        'success': False,
                        'error': 'Unauthorized',
                        'message': 'Malformed token subject identifier.'
                    }), 401

                user = db.session.get(User, user_id)
                if not user:
                    return jsonify({
                        'success': False,
                        'error': 'Unauthorized',
                        'message': 'User associated with this token no longer exists.'
                    }), 401

                if user.verification_status == 'SUSPENDED':
                    return jsonify({
                        'success': False,
                        'error': 'Account Suspended',
                        'message': 'Your account has been suspended pending administrative inquiry.'
                    }), 403

                g.current_user = user
                g.jwt_payload = payload

            if g.current_user.role not in normalized_roles:
                return jsonify({
                    'success': False,
                    'error': 'Forbidden',
                    'message': f'Access denied. Role "{g.current_user.role}" is not authorized for this resource. Required: {", ".join(normalized_roles)}'
                }), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator

# --- Basic Rate Limiting Helper ---

def check_rate_limit(key):
    """
    Checks if an IP or identifier has exceeded the failed attempts threshold.
    Returns (is_allowed, seconds_remaining).
    """
    now = time.time()
    cutoff = now - RATE_LIMIT_WINDOW
    attempts = _FAILED_ATTEMPTS.get(key, [])
    # Prune old attempts
    attempts = [t for t in attempts if t > cutoff]
    _FAILED_ATTEMPTS[key] = attempts

    if len(attempts) >= RATE_LIMIT_MAX_ATTEMPTS:
        oldest = attempts[0]
        retry_after = int(RATE_LIMIT_WINDOW - (now - oldest))
        return False, max(1, retry_after)
    return True, 0

def record_failed_attempt(key):
    """Records a failed authentication attempt."""
    now = time.time()
    attempts = _FAILED_ATTEMPTS.get(key, [])
    attempts.append(now)
    _FAILED_ATTEMPTS[key] = attempts

def clear_failed_attempts(key):
    """Clears failed attempts on successful login."""
    if key in _FAILED_ATTEMPTS:
        del _FAILED_ATTEMPTS[key]
