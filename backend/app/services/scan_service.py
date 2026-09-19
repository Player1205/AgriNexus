import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from bson import ObjectId
from pymongo import DESCENDING
from app.services.mongodb_service import get_scans_collection

logger = logging.getLogger("agrinexus.scans")

def _scan_dict(doc: Dict[str, Any]) -> Dict[str, Any]:
    if not doc:
        return {}
    return {
        "id": str(doc.get("_id")),
        "user_id": str(doc.get("user_id", "")),
        "timestamp": doc.get("timestamp") or doc.get("created_at", ""),
        "created_at": doc.get("created_at") or doc.get("timestamp", ""),
        "vision_diagnosis": doc.get("vision_diagnosis", ""),
        "crop": doc.get("crop", ""),
        "dosage_unit": doc.get("dosage_unit", "g"),
        "is_spray_safe": doc.get("is_spray_safe", True),
        "is_mic_protected": doc.get("is_mic_protected", False),
        "nearest_kvk": doc.get("nearest_kvk"),
        "weather_data": doc.get("weather_data"),
        "translated_text": doc.get("translated_text", ""),
        "vernacular_audio_url": doc.get("vernacular_audio_url", ""),
        "filename": doc.get("filename", ""),
    }

def save_user_scan(user_id: str, scan_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Saves a crop analysis scan record for an authenticated user into MongoDB Atlas.
    """
    if not user_id:
        raise ValueError("user_id is required to save scan")

    scans = get_scans_collection()
    now_iso = datetime.now(timezone.utc).isoformat()

    doc = {
        "user_id": str(user_id),
        "created_at": now_iso,
        "timestamp": now_iso,
        "vision_diagnosis": scan_data.get("vision_diagnosis", ""),
        "crop": scan_data.get("crop", ""),
        "dosage_unit": scan_data.get("dosage_unit", "g"),
        "is_spray_safe": scan_data.get("is_spray_safe", True),
        "is_mic_protected": scan_data.get("is_mic_protected", False),
        "nearest_kvk": scan_data.get("nearest_kvk"),
        "weather_data": scan_data.get("weather_data"),
        "translated_text": scan_data.get("translated_text", ""),
        "vernacular_audio_url": scan_data.get("vernacular_audio_url", ""),
        "filename": scan_data.get("filename", ""),
    }

    try:
        result = scans.insert_one(doc)
        doc["_id"] = result.inserted_id
        return _scan_dict(doc)
    except Exception as e:
        logger.error(f"Error saving user scan: {e}")
        raise

def get_user_scans(user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    """
    Fetches the scan history exclusively for the authenticated user, sorted latest first.
    """
    if not user_id:
        return []

    scans = get_scans_collection()
    cursor = scans.find({"user_id": str(user_id)}).sort("created_at", DESCENDING).limit(limit)
    return [_scan_dict(doc) for doc in cursor]

def delete_user_scan(user_id: str, scan_id: str) -> bool:
    """
    Deletes a specific scan document ensuring it belongs to the authenticated user.
    """
    if not user_id or not scan_id:
        return False

    scans = get_scans_collection()
    query: Dict[str, Any] = {"user_id": str(user_id)}
    try:
        query["_id"] = ObjectId(scan_id)
    except Exception:
        query["_id"] = scan_id

    result = scans.delete_one(query)
    return result.deleted_count > 0
