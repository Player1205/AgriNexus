import uuid
import pytest
from app.services.mongodb_service import init_mongo_db, get_users_collection, get_sessions_collection, get_scans_collection
from app.services.auth_service import create_user, authenticate, get_user_for_token, revoke_token
from app.services.scan_service import save_user_scan, get_user_scans, delete_user_scan

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    assert init_mongo_db() is True

def test_user_registration_and_duplicate():
    random_suffix = uuid.uuid4().hex[:8]
    email = f"farmer_{random_suffix}@example.com"
    name = f"Farmer {random_suffix}"
    password = "SecurePassword123"

    user = create_user(name, email, password)
    assert user["name"] == name
    assert user["email"] == email.lower()
    assert "id" in user
    assert len(user["id"]) > 0

    # Ensure duplicate email throws ValueError
    with pytest.raises(ValueError, match="already exists"):
        create_user(name, email, password)

    # Cleanup test user
    get_users_collection().delete_one({"email": email.lower()})

def test_user_authentication_and_session():
    random_suffix = uuid.uuid4().hex[:8]
    email = f"auth_{random_suffix}@example.com"
    name = "Auth Test Farmer"
    password = "MyPassword999"

    user = create_user(name, email, password)

    # Test wrong password
    with pytest.raises(ValueError, match="Invalid email or password"):
        authenticate(email, "WrongPassword")

    # Test successful login
    token, authed_user = authenticate(email, password)
    assert token is not None
    assert len(token) > 10
    assert authed_user["email"] == email.lower()

    # Test token validation
    verified_user = get_user_for_token(token)
    assert verified_user is not None
    assert verified_user["id"] == user["id"]
    assert verified_user["email"] == email.lower()

    # Test logout / token revocation
    revoked = revoke_token(token)
    assert revoked is True
    assert get_user_for_token(token) is None

    # Cleanup
    get_users_collection().delete_one({"email": email.lower()})
    get_sessions_collection().delete_many({"user_id": user["id"]})

def test_user_data_isolation_scans():
    user1_id = f"test_user_1_{uuid.uuid4().hex[:6]}"
    user2_id = f"test_user_2_{uuid.uuid4().hex[:6]}"

    # Save scan for User 1
    scan1 = save_user_scan(user1_id, {
        "vision_diagnosis": "Tomato Early Blight",
        "crop": "Tomato",
        "dosage_unit": "g",
        "is_spray_safe": True,
        "translated_text": "टमाटर में अगेती झुलसा का उपचार करें",
    })

    # Save scan for User 2
    scan2 = save_user_scan(user2_id, {
        "vision_diagnosis": "Wheat Rust",
        "crop": "Wheat",
        "dosage_unit": "ml",
        "is_spray_safe": False,
        "translated_text": "गेहूं में गेरुई रोग का उपचार",
    })

    # Verify User 1 only receives their scan
    u1_scans = get_user_scans(user1_id)
    assert len(u1_scans) == 1
    assert u1_scans[0]["id"] == scan1["id"]
    assert u1_scans[0]["vision_diagnosis"] == "Tomato Early Blight"

    # Verify User 2 only receives their scan
    u2_scans = get_user_scans(user2_id)
    assert len(u2_scans) == 1
    assert u2_scans[0]["id"] == scan2["id"]
    assert u2_scans[0]["vision_diagnosis"] == "Wheat Rust"

    # User 1 cannot delete User 2's scan
    deleted_cross = delete_user_scan(user1_id, scan2["id"])
    assert deleted_cross is False

    # User 1 can delete their own scan
    deleted_own = delete_user_scan(user1_id, scan1["id"])
    assert deleted_own is True
    assert len(get_user_scans(user1_id)) == 0

    # Cleanup
    get_scans_collection().delete_many({"user_id": {"$in": [user1_id, user2_id]}})
