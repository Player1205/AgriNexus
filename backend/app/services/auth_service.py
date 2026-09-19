import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, Tuple
from bson import ObjectId
from pymongo.errors import DuplicateKeyError
from app.services.mongodb_service import (
    get_users_collection,
    get_sessions_collection,
    init_mongo_db,
)

TOKEN_TTL_DAYS = 7

def init_auth_db():
    """Initializes MongoDB database connection and indexes."""
    return init_mongo_db()

def _password_hash(password: str, salt: bytes | None = None) -> str:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 120_000)
    return f"{salt.hex()}${digest.hex()}"

def _password_matches(password: str, stored_hash: str) -> bool:
    try:
        salt_hex, digest_hex = stored_hash.split("$", 1)
        candidate = _password_hash(password, bytes.fromhex(salt_hex)).split("$", 1)[1]
        return hmac.compare_digest(candidate, digest_hex)
    except Exception:
        return False

def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()

def _user_dict(doc: Dict[str, Any]) -> Dict[str, Any]:
    if not doc:
        return {}
    return {
        "id": str(doc.get("_id")),
        "name": doc.get("name", ""),
        "email": doc.get("email", ""),
        "created_at": doc.get("created_at", ""),
    }

def create_user(name: str, email: str, password: str) -> Dict[str, Any]:
    """Registers a new user into MongoDB Atlas users collection."""
    clean_name = name.strip()
    clean_email = email.strip().lower()

    if len(clean_name) < 2:
        raise ValueError("Name must be at least 2 characters long")
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long")
    if not clean_email or "@" not in clean_email:
        raise ValueError("A valid email address is required")

    users = get_users_collection()
    now_iso = datetime.now(timezone.utc).isoformat()

    user_doc = {
        "name": clean_name,
        "email": clean_email,
        "password_hash": _password_hash(password),
        "created_at": now_iso,
        "updated_at": now_iso,
    }

    try:
        result = users.insert_one(user_doc)
        user_doc["_id"] = result.inserted_id
        return _user_dict(user_doc)
    except DuplicateKeyError as error:
        raise ValueError("An account with that email already exists") from error

def authenticate(email: str, password: str) -> Tuple[str, Dict[str, Any]]:
    """Authenticates user against MongoDB Atlas and issues a 7-day session token."""
    clean_email = email.strip().lower()
    users = get_users_collection()
    sessions = get_sessions_collection()

    user = users.find_one({"email": clean_email})
    if not user or not _password_matches(password, user.get("password_hash", "")):
        raise ValueError("Invalid email or password")

    token = secrets.token_urlsafe(32)
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=TOKEN_TTL_DAYS)

    session_doc = {
        "token_hash": _token_hash(token),
        "user_id": str(user["_id"]),
        "expires_at": expires_at.isoformat(),
        "created_at": now.isoformat(),
    }
    sessions.insert_one(session_doc)

    return token, _user_dict(user)

def get_user_for_token(token: str) -> Optional[Dict[str, Any]]:
    """Retrieves authenticated user corresponding to active session token."""
    if not token:
        return None

    sessions = get_sessions_collection()
    users = get_users_collection()

    hashed = _token_hash(token)
    session = sessions.find_one({"token_hash": hashed})
    if not session:
        return None

    expires_at_str = session.get("expires_at", "")
    now_iso = datetime.now(timezone.utc).isoformat()
    if expires_at_str and expires_at_str < now_iso:
        # Token has expired, cleanup session
        sessions.delete_one({"_id": session["_id"]})
        return None

    user_id_val = session.get("user_id")
    user = None
    try:
        user = users.find_one({"_id": ObjectId(user_id_val)})
    except Exception:
        user = users.find_one({"_id": user_id_val})

    return _user_dict(user) if user else None

def revoke_token(token: str) -> bool:
    """Revokes session token in MongoDB Atlas upon logout."""
    if not token:
        return False
    sessions = get_sessions_collection()
    result = sessions.delete_one({"token_hash": _token_hash(token)})
    return result.deleted_count > 0

def revoke_all_user_tokens(user_id: str) -> int:
    """Revokes all active sessions for a given user."""
    sessions = get_sessions_collection()
    result = sessions.delete_many({"user_id": str(user_id)})
    return result.deleted_count