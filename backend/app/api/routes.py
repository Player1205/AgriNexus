import os
import shutil
import asyncio
import uuid
from typing import Optional
from fastapi import APIRouter, Header, UploadFile, File, Form, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from app.services.auth_service import authenticate, create_user, get_user_for_token, revoke_token
from app.services.scan_service import save_user_scan, get_user_scans, delete_user_scan
import json

router = APIRouter()

class AuthPayload(BaseModel):
    email: str
    password: str

class RegisterPayload(AuthPayload):
    name: str

def _token_from_header(authorization: Optional[str]):
    if authorization and authorization.lower().startswith("bearer "):
        return authorization[7:].strip()
    return None

def _require_user(authorization: Optional[str]):
    token = _token_from_header(authorization)
    user = get_user_for_token(token) if token else None
    return user or JSONResponse(status_code=401, content={"error": "Authentication required"})

@router.post("/api/v1/auth/register")
async def register(payload: RegisterPayload):
    if len(payload.name.strip()) < 2 or len(payload.password) < 8:
        return JSONResponse(status_code=400, content={"error": "Name and an 8-character password are required"})
    try:
        user = create_user(payload.name, payload.email, payload.password)
        token, _ = authenticate(payload.email, payload.password)
        return {"token": token, "user": user}
    except ValueError as error:
        return JSONResponse(status_code=409, content={"error": str(error)})

@router.post("/api/v1/auth/login")
async def login(payload: AuthPayload):
    try:
        token, user = authenticate(payload.email, payload.password)
        return {"token": token, "user": user}
    except ValueError as error:
        return JSONResponse(status_code=401, content={"error": str(error)})

@router.get("/api/v1/auth/me")
async def current_user(authorization: Optional[str] = Header(None)):
    return _require_user(authorization)

@router.post("/api/v1/auth/logout")
async def logout(authorization: Optional[str] = Header(None)):
    token = _token_from_header(authorization)
    if token:
        revoke_token(token)
    return {"status": "ok"}

@router.get("/api/v1/user/scans")
async def get_my_scans(authorization: Optional[str] = Header(None)):
    user = _require_user(authorization)
    if not isinstance(user, dict):
        return user
    scans = get_user_scans(user["id"])
    return {"scans": scans, "count": len(scans)}

@router.delete("/api/v1/user/scans/{scan_id}")
async def delete_my_scan(scan_id: str, authorization: Optional[str] = Header(None)):
    user = _require_user(authorization)
    if not isinstance(user, dict):
        return user
    deleted = delete_user_scan(user["id"], scan_id)
    if not deleted:
        return JSONResponse(status_code=404, content={"error": "Scan record not found"})
    return {"status": "ok", "deleted_id": scan_id}

# Thread-safe set of active websocket connections for telemetry
active_connections: set[WebSocket] = set()

@router.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    await websocket.accept()
    active_connections.add(websocket)
    try:
        while True:
            # Keep the connection alive
            await websocket.receive_text()
    except (WebSocketDisconnect, Exception):
        pass
    finally:
        active_connections.discard(websocket)

async def broadcast_telemetry(node_name: str, state_data: dict, session_id: str = ""):
    """
    Safely sanitizes state_data for JSON serialization (handling numpy floats/types)
    and broadcasts to all active dashboard and farmer listeners.
    Each message is tagged with a session_id so clients can filter events from their own session.
    """
    safe_state = {}
    for k, v in state_data.items():
        if hasattr(v, 'item'):  # Numpy scalars (float32, int64, etc.)
            safe_state[k] = v.item()
        elif isinstance(v, (int, float, str, bool, list, dict, type(None))):
            safe_state[k] = v
        else:
            safe_state[k] = str(v)

    message = json.dumps({"node": node_name, "state": safe_state, "session_id": session_id})
    dead_connections = []
    
    for connection in list(active_connections):
        try:
            await connection.send_text(message)
        except Exception:
            dead_connections.append(connection)

    for dead in dead_connections:
        active_connections.discard(dead)

@router.post("/api/v1/analyze")
async def analyze_image(
    file: UploadFile = File(...),
    language: str = Form("hi"),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    authorization: Optional[str] = Header(None),
    session_id: Optional[str] = Form(None)
):
    authenticated = _require_user(authorization)
    if not isinstance(authenticated, dict):
        return authenticated
    # Save uploaded image temporarily (sanitize filename to prevent path traversal attacks)
    temp_dir = os.path.join(os.path.dirname(__file__), "..", "..", "temp")
    os.makedirs(temp_dir, exist_ok=True)
    safe_filename = os.path.basename(file.filename or "upload.jpg").replace("..", "").replace("/", "").replace("\\", "")
    if not safe_filename:
        safe_filename = f"{uuid.uuid4().hex[:8]}.jpg"
    temp_path = os.path.join(temp_dir, safe_filename)
    
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 1. Fetch Real-Time Hyper-Local Agricultural Weather (EXIF GPS -> Device GPS -> Regional Base)
    from app.services.weather_service import fetch_live_weather
    from app.agents.graph import agrinexus_app

    weather = await fetch_live_weather(image_path=temp_path, client_lat=latitude, client_lng=longitude)
    print(f"[WEATHER LIVE] {weather['temperature_c']}°C | Humidity: {weather['relative_humidity']}% | Rain Risk (6h): {weather['rain_risk_6h_percent']}% | Source: {weather['location_source']}")

    # 2. Initialize Swarm State
    initial_state = {
        "image_path": temp_path,
        "language_code": language,
        "weather_data": weather,
        "current_temperature": weather["temperature_c"],
        "current_humidity": weather["relative_humidity"],
        "rain_risk_6h_percent": weather["rain_risk_6h_percent"],
        "wind_speed_kmh": weather["wind_speed_kmh"],
        "aqi": weather.get("aqi", 2),
        "aqi_label": weather.get("aqi_label", "Fair"),
        "pm2_5": weather.get("pm2_5", 25.0),
        "is_spray_safe": weather["is_spray_safe"],
        "location_source": weather["location_source"],
        "is_live_weather": weather.get("is_live_weather", True),
        "client_latitude": latitude,
        "client_longitude": longitude,
        "errors": []
    }
    
    current_state = initial_state.copy()
    
    # Use frontend's session ID or fallback to server-generated
    if not session_id:
        session_id = str(uuid.uuid4())[:8]
    
    try:
        async for output in agrinexus_app.astream(initial_state):
            for node_name, state_update in output.items():
                if isinstance(state_update, dict):
                    current_state.update(state_update)
                
                # Broadcast the node execution to all active dashboards, tagged with session_id
                await broadcast_telemetry(node_name, current_state, session_id)
                # 1.6s delay per node to clearly showcase the laser path animations in Telemetry
                await asyncio.sleep(1.6)
                
        # Clean numpy types for final JSONResponse
        safe_response = {}
        for k, v in current_state.items():
            if hasattr(v, 'item'):
                safe_response[k] = v.item()
            elif isinstance(v, (int, float, str, bool, list, dict, type(None))):
                safe_response[k] = v
            else:
                safe_response[k] = str(v)

        safe_response["session_id"] = session_id

        # Automatically store scan in MongoDB Atlas under the authenticated user's account
        try:
            saved_scan = save_user_scan(authenticated["id"], {
                **safe_response,
                "filename": safe_filename,
            })
            safe_response["scan_id"] = saved_scan.get("id")
        except Exception as scan_err:
            print(f"[MONGODB ATLAS SCAN RECORD ERROR] {scan_err}")
        return JSONResponse(content=safe_response)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

class TTSPayload(BaseModel):
    text: str
    language_code: str = "hi"

@router.post("/api/v1/tts")
async def synthesize_speech_endpoint(payload: TTSPayload):
    from app.services.tts_client import tts_client
    audio_path = await tts_client.synthesize_speech(payload.text, payload.language_code)
    if audio_path:
        return {"audio_url": audio_path}
    return JSONResponse(status_code=500, content={"error": "Speech synthesis failed"})
