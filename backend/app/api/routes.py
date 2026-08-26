import os
import shutil
import asyncio
from fastapi import APIRouter, UploadFile, File, WebSocket, WebSocketDisconnect
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
async def analyze_image(file: UploadFile = File(...)):
    # Save uploaded image temporarily
    temp_dir = os.path.join(os.path.dirname(__file__), "..", "..", "temp")
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, file.filename)
    
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Initialize state
    initial_state = AgriNexusState(image_path=temp_path)
    
    # We will run the graph manually step by step to broadcast telemetry
    current_state = initial_state.model_dump()
    
    try:
        for output in agrinexus_app.astream(initial_state):
            for node_name, state_update in output.items():
                if isinstance(state_update, AgriNexusState):
                    current_state = state_update.model_dump()
                else:
                    current_state = state_update
                
                # Broadcast the node execution to the dashboard
                await broadcast_telemetry(node_name, current_state)
                # Small delay to visualize graph progression
                await asyncio.sleep(0.5)
                
        return JSONResponse(content=current_state)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
