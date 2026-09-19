import os
import logging
from typing import Optional
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.collection import Collection
from pymongo.database import Database

logger = logging.getLogger("agrinexus.mongodb")

DEFAULT_URI = "mongodb://localhost:27017"
DEFAULT_DB = "agrinexus"

_client: Optional[MongoClient] = None
_db: Optional[Database] = None

def get_mongo_client() -> MongoClient:
    """Returns a singleton MongoClient instance with connection pooling."""
    global _client
    if _client is None:
        raw_uri = os.getenv("MONGODB_URI")
        uri = raw_uri.strip() if raw_uri and raw_uri.strip() else DEFAULT_URI
        _client = MongoClient(
            uri,
            serverSelectionTimeoutMS=7000,
            connectTimeoutMS=7000,
            maxPoolSize=50,
            minPoolSize=5,
        )
    return _client

def get_db() -> Database:
    """Returns the AgriNexus MongoDB Database instance."""
    global _db
    if _db is None:
        client = get_mongo_client()
        raw_db = os.getenv("MONGODB_DB_NAME")
        db_name = raw_db.strip() if raw_db and raw_db.strip() else DEFAULT_DB
        _db = client[db_name]
    return _db

def get_users_collection() -> Collection:
    return get_db()["users"]

def get_sessions_collection() -> Collection:
    return get_db()["sessions"]

def get_scans_collection() -> Collection:
    return get_db()["user_scans"]

def init_mongo_db() -> bool:
    """
    Verifies connection to MongoDB Atlas and ensures all required indexes are present.
    """
    try:
        client = get_mongo_client()
        # Verify cluster ping
        client.admin.command("ping")
        logger.info("Successfully connected to MongoDB Atlas cluster.")

        db = get_db()
        users = db["users"]
        sessions = db["sessions"]
        scans = db["user_scans"]

        # 1. Unique index on email for users
        users.create_index([("email", ASCENDING)], unique=True, name="idx_user_email_unique")

        # 2. Index on session token hash
        sessions.create_index([("token_hash", ASCENDING)], unique=True, name="idx_session_token_unique")
        sessions.create_index([("expires_at", ASCENDING)], name="idx_session_expires_at")

        # 3. Compound index on user_scans (user_id + created_at DESC) for fast isolated history queries
        scans.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)], name="idx_user_scans_user_time")

        logger.info("MongoDB Atlas indexes verified successfully.")
        return True
    except Exception as exc:
        logger.error(f"Failed to initialize MongoDB Atlas: {exc}")
        return False

def close_mongo_connection():
    global _client, _db
    if _client is not None:
        _client.close()
        _client = None
        _db = None
