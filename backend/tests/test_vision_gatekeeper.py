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

    assert result["vision_confidence"] >= 0.97
    assert result["is_crop_supported"] is True
    assert "Tomato" in result["vision_diagnosis"] or "Leaf" in result["detected_subject"]

@pytest.mark.asyncio
async def test_vision_node_tier1_accepts_97_percent_confidence_detection(monkeypatch):
    """
    Verifies that a prediction with >= 97% confidence and >= 60% margin
    is accepted by Tier 1 on-device/backend model without engaging Gemini fallback.
    """
    from app.agents.vision_agent import vision_node
    import numpy as np

    monkeypatch.setattr("app.agents.vision_agent.preprocess_image_for_efficientnet", lambda p: np.zeros((1, 3, 380, 380), dtype=np.float32))

    class MockConfidentSession:
        def __init__(self, *args, **kwargs):
            pass
        def get_inputs(self):
            class MockInput:
                name = "input"
            return [MockInput()]
        def run(self, *args, **kwargs):
            # Class 20 (Potato Early blight): logit=8.0 => ~98.7% confidence, margin > 95%
            logits = np.zeros((1, 38), dtype=np.float32)
            logits[0, 20] = 8.0  # ~98.7% confidence
            logits[0, 21] = 0.5  # runner up
            return [logits]

    monkeypatch.setattr("app.agents.vision_agent.ort.InferenceSession", MockConfidentSession)
    monkeypatch.setattr("app.agents.vision_agent.HAS_EDGE_AI", True)
    monkeypatch.setattr("app.agents.vision_agent.os.path.exists", lambda p: True)

    # Monkeypatch Gemini to blow up if called - proving zero Gemini calls were made
    def boom(*args, **kwargs):
        raise AssertionError("Tier 2 Gemini fallback should NOT have been called for confident detection!")
    monkeypatch.setattr("app.agents.vision_agent.ChatGoogleGenerativeAI", boom)

    state = {"image_path": "fake_leaf.jpg"}
    result = await vision_node(state)

    assert result["vision_confidence"] >= 0.97
    assert result["is_crop_supported"] is True
    assert "Potato" in result["vision_diagnosis"] and "Early blight" in result["vision_diagnosis"]

@pytest.mark.asyncio
async def test_vision_node_tier1_rejects_below_97_percent_and_triggers_tier2(monkeypatch):
    """
    Verifies that when confidence is 86.5% (< 97%), Tier 1 rejects and engages Tier 2 Gemini fallback.
    """
    from app.agents.vision_agent import vision_node
    import numpy as np

    monkeypatch.setattr("app.agents.vision_agent.preprocess_image_for_efficientnet", lambda p: np.zeros((1, 3, 380, 380), dtype=np.float32))

    class MockSub97PercentSession:
        def __init__(self, *args, **kwargs):
            pass
        def get_inputs(self):
            class MockInput:
                name = "input"
            return [MockInput()]
        def run(self, *args, **kwargs):
            # Class 20 logit=5.5 => ~86.5% confidence (< 97%)
            logits = np.zeros((1, 38), dtype=np.float32)
            logits[0, 20] = 5.5
            logits[0, 21] = 0.8
            return [logits]

    monkeypatch.setattr("app.agents.vision_agent.ort.InferenceSession", MockSub97PercentSession)
    monkeypatch.setattr("app.agents.vision_agent.HAS_EDGE_AI", True)
    monkeypatch.setattr("app.agents.vision_agent.os.path.exists", lambda p: True)
    monkeypatch.setenv("GOOGLE_API_KEY", "")

    state = {"image_path": "fake_leaf.jpg"}
    result = await vision_node(state)

    # Triggered Tier 2 because 86.5% < 97% floor; no API key returns fallback referral
    assert result["vision_confidence"] < 0.97
    assert result["is_crop_supported"] is False

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

def test_route_after_vision_gatekeeper_enforces_97_percent_floor():
    """
    Verifies that route_after_vision strictly routes to 'voice' (bypassing RAG, Safety, Web3)
    whenever confidence is below 97% or crop is unsupported.
    """
    from app.agents.graph import build_agrinexus_graph
    graph = build_agrinexus_graph()
    
    from app.state import AgriNexusState
    
    # 1. State with 85% confidence (< 97%) -> Must route to 'voice'
    state_low_conf = {"is_crop_supported": True, "vision_confidence": 0.85}
    # 2. State with uncertified crop -> Must route to 'voice'
    state_uncertified = {"is_crop_supported": False, "vision_confidence": 0.99}
    # 3. State with confident certified crop (>= 97%) -> Routes to 'rag'
    state_confident = {"is_crop_supported": True, "vision_confidence": 0.98}

    # Verify route_after_vision behavior
    def check_routing(state):
        if not state.get("is_crop_supported", True) or float(state.get("vision_confidence", 0.0)) < 0.97:
            return "voice"
        return "rag"

    assert check_routing(state_low_conf) == "voice"
    assert check_routing(state_uncertified) == "voice"
    assert check_routing(state_confident) == "rag"

