import os
import shutil
import asyncio
from fastapi import APIRouter, UploadFile, File, Form, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from app.agents.graph import agrinexus_app
from app.state import AgriNexusState
import json

router = APIRouter()

# Active websocket connections for telemetry
active_connections: list[WebSocket] = []

@router.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    try:
        while True:
            # Just keep the connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        active_connections.remove(websocket)

async def broadcast_telemetry(node_name: str, state_data: dict):
    message = json.dumps({"node": node_name, "state": state_data})
    for connection in active_connections:
        try:
            await connection.send_text(message)
        except Exception:
            pass

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
                
                # Broadcast the node execution to the dashboard
                await broadcast_telemetry(node_name, current_state)
                # 1.8s delay per node = ~9 seconds total for the swarm to execute, building trust
                await asyncio.sleep(1.8)
                
        return JSONResponse(content=current_state)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
