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
        "wind_speed_kmh": 8.0
    }
    result = await safety_node(state)
    assert result["is_safe"] is True
    assert result["safe_dosage_ml_per_acre"] == 150.0
    assert "Verified" in result["safety_warning"]

@pytest.mark.asyncio
async def test_safety_rejects_banned_endosulfan():
    """Verify statutory interception of banned pesticide Endosulfan."""
    state = {
        "proposed_chemical": "Endosulfan 35% EC",
        "safe_dosage_ml_per_acre": 200.0,
        "current_humidity": 70.0
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
        "safe_dosage_ml_per_acre": 150.0
    }
    result = await safety_node(state)
    assert result["is_safe"] is False
    assert "BANNED" in result["safety_warning"]

@pytest.mark.asyncio
async def test_safety_clamps_overdose():
    """Verify mathematical clamping of extreme dosage exceeding 350ml/g per acre."""
    state = {
        "proposed_chemical": "Mancozeb 75% WP",
        "safe_dosage_ml_per_acre": 850.0, # Dangerous overdose attempt
        "current_humidity": 70.0
    }
    result = await safety_node(state)
    assert result["is_safe"] is True
    assert result["safe_dosage_ml_per_acre"] <= 350.0 # Clamped to statutory maximum

@pytest.mark.asyncio
async def test_safety_humidity_attenuation():
    """Verify 10% dosage reduction when relative humidity > 80% to prevent foliar burn."""
    state = {
        "proposed_chemical": "Chlorothalonil 75% WP",
        "safe_dosage_ml_per_acre": 200.0,
        "current_humidity": 88.0 # High humidity
    }
    result = await safety_node(state)
    assert result["is_safe"] is True
    assert result["safe_dosage_ml_per_acre"] == 180.0 # 200.0 * 0.9 = 180.0

@pytest.mark.asyncio
async def test_safety_rain_fastness_warning():
    """Verify meteorological alert when rain risk exceeds 40% in next 6 hours."""
    state = {
        "proposed_chemical": "Propiconazole 25% EC",
        "safe_dosage_ml_per_acre": 150.0,
        "current_humidity": 75.0,
        "rain_risk_6h_percent": 65.0 # High rain probability
    }
    result = await safety_node(state)
    assert "rain" in result["safety_warning"].lower()
    assert "wash-off" in result["safety_warning"].lower()
