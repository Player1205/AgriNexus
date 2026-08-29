import pytest
import os
import sys

# Ensure backend root is in python path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.services.weather_service import fetch_live_weather, DEFAULT_LAT, DEFAULT_LNG

@pytest.mark.asyncio
async def test_weather_device_gps_resolution():
    """Verify live weather fetch with valid client GPS coordinates."""
    weather = await fetch_live_weather(client_lat=28.7041, client_lng=77.1025) # New Delhi
    
    assert weather is not None
    assert "temperature_c" in weather
    assert "relative_humidity" in weather
    assert "rain_risk_6h_percent" in weather
    assert "wind_speed_kmh" in weather
    assert "is_spray_safe" in weather
    assert weather["location_source"] == "DEVICE_LIVE_GPS"
    assert weather["latitude"] == 28.7041

@pytest.mark.asyncio
async def test_weather_fallback_resolution():
    """Verify graceful fallback to regional baseline when GPS is omitted or denied."""
    weather = await fetch_live_weather(client_lat=None, client_lng=None)
    
    assert weather is not None
    assert weather["latitude"] == DEFAULT_LAT
    assert weather["longitude"] == DEFAULT_LNG
    assert weather["location_source"] == "REGIONAL_BASELINE"
    assert isinstance(weather["is_spray_safe"], bool)
