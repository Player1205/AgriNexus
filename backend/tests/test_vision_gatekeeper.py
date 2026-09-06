import pytest
from app.agents.rag_agent import rag_node
from app.agents.safety_agent import safety_node
from app.agents.voice_agent import voice_node

@pytest.mark.asyncio
async def test_gatekeeper_blocks_houseplant_chemical_prescription():
    """
    Verifies that when a non-agricultural plant (e.g. Areca Palm houseplant) is detected,
    RAG and Safety nodes strictly block chemical prescriptions and enforce 0.0 dosage.
    """
    state = {
        "vision_diagnosis": "Unrecognized Plant / Non-Agricultural Subject",
        "vision_confidence": 0.0,
        "is_crop_supported": False,
        "detected_subject": "Areca Palm Houseplant",
        "current_humidity": 65.0,
        "current_temperature": 30.0,
        "rain_risk_6h_percent": 10.0,
        "wind_speed_kmh": 2.0,
        "client_latitude": 30.9010,
        "client_longitude": 75.8573,
        "errors": []
    }

    # 1. RAG Node Gate
    rag_result = await rag_node(state)
    assert rag_result["safe_dosage_ml_per_acre"] == 0.0
    assert "None" in rag_result["proposed_chemical"]
    assert "NON-ACTIONABLE" in rag_result["rag_treatment_plan"]

    # 2. Safety Node Gate
    merged_state = {**state, **rag_result}
    safety_result = await safety_node(merged_state)
    assert safety_result["is_safe"] is False
    assert safety_result["safe_dosage_ml_per_acre"] == 0.0
    assert safety_result["is_non_actionable_referral"] is True
    assert "NON-AGRICULTURAL SUBJECT DETECTED" in safety_result["safety_warning"]
    assert safety_result["nearest_kvk"] is not None

@pytest.mark.asyncio
async def test_gatekeeper_allows_supported_tomato_crop():
    """
    Verifies that supported agricultural crops (e.g. Tomato Late blight) proceed normally
    to grounded ICAR treatment and verified dosage.
    """
    state = {
        "vision_diagnosis": "Tomato Late blight",
        "vision_confidence": 0.95,
        "is_crop_supported": True,
        "detected_subject": "Tomato Leaf",
        "current_humidity": 75.0,
        "current_temperature": 28.0,
        "rain_risk_6h_percent": 5.0,
        "wind_speed_kmh": 4.0,
        "client_latitude": 30.9010,
        "client_longitude": 75.8573,
        "errors": []
    }

    rag_result = await rag_node(state)
    assert rag_result["safe_dosage_ml_per_acre"] > 0.0
    assert "Azoxystrobin" in rag_result["proposed_chemical"]

    merged_state = {**state, **rag_result}
    safety_result = await safety_node(merged_state)
    assert safety_result["is_safe"] is True
    assert safety_result["safe_dosage_ml_per_acre"] == 150.0
