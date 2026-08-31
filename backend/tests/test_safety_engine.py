import pytest
import os
import sys

# Ensure backend root is in python path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.agents.safety_agent import safety_node

@pytest.mark.asyncio
async def test_safety_approves_safe_chemical():
    """Verify that verified ICAR chemical under optimal weather is approved."""
    state = {
        "proposed_chemical": "Azoxystrobin 18.2% + Difenoconazole 11.4% SC",
        "safe_dosage_ml_per_acre": 150.0,
        "current_humidity": 65.0,
        "current_temperature": 28.0,
        "rain_risk_6h_percent": 5.0,
        "wind_speed_kmh": 8.0,
        "vision_confidence": 0.95,
        "vision_diagnosis": "Tomato Late Blight"
    }
    result = await safety_node(state)
    assert result["is_safe"] is True
    assert result["safe_dosage_ml_per_acre"] == 150.0
    assert "Verified" in result["safety_warning"]
    assert result["is_non_actionable_referral"] is False

@pytest.mark.asyncio
async def test_safety_rejects_banned_endosulfan():
    """Verify statutory interception of banned pesticide Endosulfan."""
    state = {
        "proposed_chemical": "Endosulfan 35% EC",
        "safe_dosage_ml_per_acre": 200.0,
        "current_humidity": 70.0,
        "vision_confidence": 0.92,
        "vision_diagnosis": "Tomato Pest"
    }
    result = await safety_node(state)
    assert result["is_safe"] is False
    assert result["safe_dosage_ml_per_acre"] == 0.0
    assert "STATUTORY VIOLATION" in result["safety_warning"]
    assert "BANNED" in result["safety_warning"]

@pytest.mark.asyncio
async def test_safety_rejects_banned_monocrotophos():
    """Verify statutory interception of banned chemical Monocrotophos."""
    state = {
        "proposed_chemical": "Monocrotophos 36% SL",
        "safe_dosage_ml_per_acre": 150.0,
        "vision_confidence": 0.88,
        "vision_diagnosis": "Cotton Pest"
    }
    result = await safety_node(state)
    assert result["is_safe"] is False
    assert "BANNED" in result["safety_warning"]

@pytest.mark.asyncio
async def test_safety_clamps_overdose():
    """Verify mathematical clamping of extreme dosage exceeding statutory ceiling."""
    state = {
        "proposed_chemical": "Mancozeb 75% WP",
        "safe_dosage_ml_per_acre": 850.0, # Dangerous overdose attempt
        "max_statutory_dosage": 260.0,
        "current_humidity": 70.0,
        "vision_confidence": 0.91,
        "vision_diagnosis": "Potato Early Blight"
    }
    result = await safety_node(state)
    assert result["is_safe"] is True
    assert result["safe_dosage_ml_per_acre"] <= 260.0 # Clamped to statutory maximum

@pytest.mark.asyncio
async def test_safety_humidity_attenuation():
    """Verify 10% dosage reduction when relative humidity > 80% to prevent foliar burn."""
    state = {
        "proposed_chemical": "Chlorothalonil 75% WP",
        "safe_dosage_ml_per_acre": 200.0,
        "min_mic_dosage": 140.0,
        "max_statutory_dosage": 260.0,
        "current_humidity": 88.0, # High humidity
        "vision_confidence": 0.89,
        "vision_diagnosis": "Tomato Early Blight"
    }
    result = await safety_node(state)
    assert result["is_safe"] is True
    assert result["safe_dosage_ml_per_acre"] == 180.0 # 200.0 * 0.9 = 180.0

@pytest.mark.asyncio
async def test_safety_mic_floor_protection():
    """Verify dosage is protected at Minimum Inhibitory Concentration (MIC) floor."""
    state = {
        "proposed_chemical": "Pyraclostrobin 20% WG",
        "safe_dosage_ml_per_acre": 100.0,
        "min_mic_dosage": 95.0, # MIC Floor is 95.0
        "current_humidity": 90.0, # Attenuation would be 90.0 (below MIC)
        "vision_confidence": 0.94,
        "vision_diagnosis": "Tomato Target Spot"
    }
    result = await safety_node(state)
    assert result["is_safe"] is True
    assert result["safe_dosage_ml_per_acre"] == 95.0 # Held at MIC floor 95.0!
    assert result["is_mic_protected"] is True

@pytest.mark.asyncio
async def test_safety_low_confidence_triggers_kvk_referral():
    """Verify that diagnostic confidence < 60% blocks chemical application and resolves nearest KVK."""
    state = {
        "proposed_chemical": "Azoxystrobin 18.2%",
        "safe_dosage_ml_per_acre": 150.0,
        "vision_confidence": 0.48, # Low confidence (<60%)
        "vision_diagnosis": "Unrecognized Pattern (Low Confidence)",
        "client_latitude": 30.9010,
        "client_longitude": 75.8573
    }
    result = await safety_node(state)
    assert result["is_safe"] is False
    assert result["safe_dosage_ml_per_acre"] == 0.0
    assert result["is_non_actionable_referral"] is True
    assert "NON-ACTIONABLE" in result["safety_warning"]
    assert result["nearest_kvk"] is not None
    assert "Samrala" in result["nearest_kvk"]["name"] or "Ludhiana" in result["nearest_kvk"]["district"]
    assert result["nearest_kvk"]["distance_km"] < 50.0
