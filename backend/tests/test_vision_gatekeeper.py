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

@pytest.mark.asyncio
async def test_vision_node_tier1_priority_on_confident_ml_model(monkeypatch):
    """
    Verifies that when the trained ONNX model identifies a crop with confidence >= 60%,
    it returns the diagnosis immediately with ZERO Gemini API calls.
    """
    from app.agents.vision_agent import vision_node
    import numpy as np

    # Mock preprocess
    monkeypatch.setattr("app.agents.vision_agent.preprocess_image_for_efficientnet", lambda p: np.zeros((1, 3, 380, 380), dtype=np.float32))
    
    # Mock ONNX InferenceSession
    class MockInferenceSession:
        def __init__(self, *args, **kwargs):
            pass
        def get_inputs(self):
            class MockInput:
                name = "input"
            return [MockInput()]
        def run(self, *args, **kwargs):
            # 38 classes, make class 27 (Tomato Late blight) the winning class with high score
            logits = np.zeros((1, 38), dtype=np.float32)
            logits[0, 27] = 10.0  # High confidence
            return [logits]

    monkeypatch.setattr("app.agents.vision_agent.ort.InferenceSession", MockInferenceSession)
    monkeypatch.setattr("app.agents.vision_agent.HAS_EDGE_AI", True)
    monkeypatch.setattr("app.agents.vision_agent.os.path.exists", lambda p: True)

    state = {"image_path": "fake_leaf.jpg"}
    result = await vision_node(state)

    assert result["vision_confidence"] >= 0.60
    assert result["is_crop_supported"] is True
    assert "Tomato" in result["vision_diagnosis"] or "Leaf" in result["detected_subject"]

@pytest.mark.asyncio
async def test_vision_node_tier2_fallback_when_confidence_below_threshold(monkeypatch):
    """
    Verifies that when the trained ONNX model has low confidence (< 60%),
    it engages the Tier-2 fallback mechanism.
    """
    from app.agents.vision_agent import vision_node
    import numpy as np

    # Mock preprocess
    monkeypatch.setattr("app.agents.vision_agent.preprocess_image_for_efficientnet", lambda p: np.zeros((1, 3, 380, 380), dtype=np.float32))
    
    # Mock ONNX InferenceSession returning uniform/low confidence
    class MockLowConfSession:
        def __init__(self, *args, **kwargs):
            pass
        def get_inputs(self):
            class MockInput:
                name = "input"
            return [MockInput()]
        def run(self, *args, **kwargs):
            # Uniform logits => confidence = 1/38 = ~2.6% (< 60%)
            logits = np.zeros((1, 38), dtype=np.float32)
            return [logits]

    monkeypatch.setattr("app.agents.vision_agent.ort.InferenceSession", MockLowConfSession)
    monkeypatch.setattr("app.agents.vision_agent.HAS_EDGE_AI", True)
    monkeypatch.setattr("app.agents.vision_agent.os.path.exists", lambda p: True)
    # Ensure no API key to test graceful fallback
    monkeypatch.setenv("GOOGLE_API_KEY", "")

    state = {"image_path": "fake_leaf.jpg"}
    result = await vision_node(state)

    # When fallback has no API key, returns low-confidence referral
    assert result["vision_confidence"] < 0.60
    assert result["is_crop_supported"] is False
    assert "Unrecognized" in result["vision_diagnosis"]

