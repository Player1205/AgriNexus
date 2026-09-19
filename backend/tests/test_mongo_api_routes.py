import uuid
import pytest
from fastapi.testclient import TestClient
from main import app
from app.services.mongodb_service import get_users_collection, get_sessions_collection, get_scans_collection

client = TestClient(app)

def test_full_auth_and_user_scans_flow():
    uid = uuid.uuid4().hex[:8]
    email = f"api_farmer_{uid}@example.com"
    name = f"Test Farmer {uid}"
    password = "SuperStrongPassword123"

    # 1. Register
    reg_resp = client.post("/api/v1/auth/register", json={
        "name": name,
        "email": email,
        "password": password
    })
    assert reg_resp.status_code == 200, reg_resp.text
    data = reg_resp.json()
    assert "token" in data
    assert data["user"]["email"] == email.lower()
    token = data["token"]
    user_id = data["user"]["id"]

    # 2. Duplicate registration should return 409
    dup_resp = client.post("/api/v1/auth/register", json={
        "name": name,
        "email": email,
        "password": password
    })
    assert dup_resp.status_code == 409

    # 3. Test /me endpoint
    me_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == email.lower()

    # 4. Test login
    login_resp = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": password
    })
    assert login_resp.status_code == 200
    login_token = login_resp.json()["token"]

    # 5. Test user scans (initially empty)
    scans_resp = client.get("/api/v1/user/scans", headers={"Authorization": f"Bearer {login_token}"})
    assert scans_resp.status_code == 200
    assert scans_resp.json()["count"] == 0

    # 6. Insert a scan for this user directly via scan_service
    from app.services.scan_service import save_user_scan
    scan = save_user_scan(user_id, {
        "vision_diagnosis": "Paddy Blast Disease",
        "crop": "Paddy",
        "dosage_unit": "ml",
        "is_spray_safe": True
    })

    # Now verify scans list returns the scan
    scans_resp2 = client.get("/api/v1/user/scans", headers={"Authorization": f"Bearer {login_token}"})
    assert scans_resp2.status_code == 200
    scans_data = scans_resp2.json()["scans"]
    assert len(scans_data) == 1
    assert scans_data[0]["id"] == scan["id"]
    assert scans_data[0]["vision_diagnosis"] == "Paddy Blast Disease"

    # 7. Delete the scan
    del_resp = client.delete(f"/api/v1/user/scans/{scan['id']}", headers={"Authorization": f"Bearer {login_token}"})
    assert del_resp.status_code == 200

    # Verify scan is deleted
    scans_resp3 = client.get("/api/v1/user/scans", headers={"Authorization": f"Bearer {login_token}"})
    assert scans_resp3.json()["count"] == 0

    # 8. Test Logout
    logout_resp = client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {login_token}"})
    assert logout_resp.status_code == 200

    # After logout, accessing /me should fail with 401
    me_after_logout = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {login_token}"})
    assert me_after_logout.status_code == 401

    # Cleanup test data from MongoDB Atlas
    get_users_collection().delete_one({"email": email.lower()})
    get_sessions_collection().delete_many({"user_id": user_id})
    get_scans_collection().delete_many({"user_id": user_id})
