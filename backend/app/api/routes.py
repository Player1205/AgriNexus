import os
import shutil
import asyncio
from fastapi import APIRouter, UploadFile, File, Form, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from app.agents.graph import agrinexus_app
from app.state import AgriNexusState
import json

router = APIRouter()

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

async def broadcast_telemetry(node_name: str, state_data: dict):
    """
    Safely sanitizes state_data for JSON serialization (handling numpy floats/types)
    and broadcasts to all active dashboard and farmer listeners.
    """
    safe_state = {}
    for k, v in state_data.items():
        if hasattr(v, 'item'):  # Numpy scalars (float32, int64, etc.)
            safe_state[k] = v.item()
        elif isinstance(v, (int, float, str, bool, list, dict, type(None))):
            safe_state[k] = v
        else:
            safe_state[k] = str(v)

    message = json.dumps({"node": node_name, "state": safe_state})
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
    language: str = Form("hi")
):
    # Save uploaded image temporarily
    temp_dir = os.path.join(os.path.dirname(__file__), "..", "..", "temp")
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, file.filename)
    
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Initialize state as TypedDict with farmer's selected vernacular language
    initial_state = {
        "image_path": temp_path,
        "language_code": language,
        "errors": []
    }
    
    current_state = initial_state.copy()
    
    try:
        async for output in agrinexus_app.astream(initial_state):
            for node_name, state_update in output.items():
                if isinstance(state_update, dict):
                    current_state.update(state_update)
                
                # Broadcast the node execution to all active dashboards
                await broadcast_telemetry(node_name, current_state)
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

        return JSONResponse(content=safe_response)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
