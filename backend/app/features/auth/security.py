import base64
import hashlib
import hmac
import json
import secrets
import time
from typing import Any

from fastapi import HTTPException, status

from app.core.config import settings


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 260_000)
    return f"pbkdf2_sha256$260000${salt.hex()}${digest.hex()}"


def verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, rounds, salt_hex, digest_hex = encoded.split("$")
        if algorithm != "pbkdf2_sha256":
            return False
        digest = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt_hex), int(rounds))
        return hmac.compare_digest(digest.hex(), digest_hex)
    except (ValueError, TypeError):
        return False


def _encode(payload: dict[str, Any]) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    parts = []
    for value in (header, payload):
        raw = json.dumps(value, separators=(",", ":"), sort_keys=True).encode()
        parts.append(base64.urlsafe_b64encode(raw).rstrip(b"=").decode())
    signing_input = ".".join(parts).encode()
    signature = hmac.new(settings.jwt_secret.encode(), signing_input, hashlib.sha256).digest()
    parts.append(base64.urlsafe_b64encode(signature).rstrip(b"=").decode())
    return ".".join(parts)


def _decode(token: str) -> dict[str, Any]:
    try:
        encoded_header, encoded_payload, encoded_signature = token.split(".")
        signing_input = f"{encoded_header}.{encoded_payload}".encode()
        expected = hmac.new(settings.jwt_secret.encode(), signing_input, hashlib.sha256).digest()
        supplied = base64.urlsafe_b64decode(encoded_signature + "=" * (-len(encoded_signature) % 4))
        if not hmac.compare_digest(expected, supplied):
            raise ValueError
        payload = json.loads(base64.urlsafe_b64decode(encoded_payload + "=" * (-len(encoded_payload) % 4)))
        if payload.get("exp", 0) < int(time.time()):
            raise ValueError
        return payload
    except (ValueError, TypeError, json.JSONDecodeError, UnicodeDecodeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")


def create_token(user_id: str, token_type: str, expires_in: int) -> str:
    now = int(time.time())
    return _encode({"sub": user_id, "type": token_type, "iat": now, "exp": now + expires_in})


def decode_access_token(token: str) -> dict[str, Any]:
    payload = _decode(token)
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Access token required")
    return payload


def decode_refresh_token(token: str) -> dict[str, Any]:
    payload = _decode(token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Refresh token required")
    return payload
