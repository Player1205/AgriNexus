import pytest
from app.services.kvk_service import kvk_service

def test_kvk_directory_loaded():
    """Verifies that certified ICAR Krishi Vigyan Kendra directory is loaded."""
    assert len(kvk_service.kvk_directory) >= 20
    first_kvk = kvk_service.kvk_directory[0]
    assert "name" in first_kvk
    assert "latitude" in first_kvk
    assert "longitude" in first_kvk
    assert "phone" in first_kvk

def test_kvk_nearest_punjab():
    """Verifies nearest KVK resolution for a farmer in Ludhiana, Punjab."""
    # Coordinates in Ludhiana: (30.9010, 75.8573)
    nearest = kvk_service.find_nearest_kvk(30.9010, 75.8573)
    assert nearest is not None
    assert "Samrala" in nearest["name"] or "Ludhiana" in nearest["district"]
    assert nearest["distance_km"] < 50.0
    assert nearest["phone"] != ""

def test_kvk_nearest_maharashtra():
    """Verifies nearest KVK resolution for a farmer in Baramati, Maharashtra."""
    # Coordinates in Baramati: (18.1511, 74.5772)
    nearest = kvk_service.find_nearest_kvk(18.1511, 74.5772)
    assert nearest is not None
    assert "Baramati" in nearest["name"]
    assert nearest["distance_km"] < 5.0
    assert "02112-255207" in nearest["phone"]

def test_kvk_nearest_varanasi():
    """Verifies nearest KVK resolution for a farmer in Varanasi, Uttar Pradesh."""
    # Coordinates in Varanasi: (25.3176, 82.9739)
    nearest = kvk_service.find_nearest_kvk(25.3176, 82.9739)
    assert nearest is not None
    assert "Varanasi" in nearest["district"] or "IIVR" in nearest["name"]
    assert nearest["distance_km"] < 30.0

def test_kvk_fallback_coordinates():
    """Verifies graceful handling when coordinates are None."""
    nearest = kvk_service.find_nearest_kvk(None, None)
    assert nearest is not None
    assert "name" in nearest
    assert "phone" in nearest
