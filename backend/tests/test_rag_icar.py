import pytest
import os
import sys

# Ensure backend root is in python path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.services.chroma_db import chroma_service
from app.agents.rag_agent import rag_node

@pytest.mark.asyncio
async def test_chroma_database_loaded():
    """Verify that all 38 ICAR research protocols are loaded in vector memory."""
    assert len(chroma_service.protocols) >= 38

@pytest.mark.asyncio
async def test_rag_tomato_late_blight():
    """Verify exact ICAR protocol retrieval for Tomato Late Blight."""
    state = {"vision_diagnosis": "Tomato Late Blight", "vision_confidence": 0.95}
    result = await rag_node(state)
    
    assert "Azoxystrobin" in result["proposed_chemical"]
    assert result["safe_dosage_ml_per_acre"] == 150.0
    assert "ICAR" in result["rag_treatment_plan"]

@pytest.mark.asyncio
async def test_rag_apple_scab():
    """Verify exact ICAR protocol retrieval for Apple Scab."""
    state = {"vision_diagnosis": "Apple Apple Scab", "vision_confidence": 0.92}
    result = await rag_node(state)
    
    assert "Difenoconazole" in result["proposed_chemical"]
    assert result["safe_dosage_ml_per_acre"] == 120.0

@pytest.mark.asyncio
async def test_rag_corn_rust():
    """Verify exact ICAR protocol retrieval for Corn Common Rust."""
    state = {"vision_diagnosis": "Corn Common Rust", "vision_confidence": 0.90}
    result = await rag_node(state)
    
    assert "Propiconazole" in result["proposed_chemical"]
    assert result["safe_dosage_ml_per_acre"] == 150.0

@pytest.mark.asyncio
async def test_rag_healthy_crop_bio_protectant():
    """Verify that healthy crops receive bio-stimulants rather than hazardous chemical pesticides."""
    state = {"vision_diagnosis": "Tomato Healthy", "vision_confidence": 0.98}
    result = await rag_node(state)
    
    assert "Trichoderma" in result["proposed_chemical"] or "Bio" in result["proposed_chemical"]
    assert result["safe_dosage_ml_per_acre"] > 0.0

@pytest.mark.asyncio
async def test_rag_zero_guesswork_on_low_confidence():
    """Verify that low-confidence / unverified images strictly refuse chemical prescriptions."""
    state = {"vision_diagnosis": "Unrecognized Pattern (Low Confidence)", "vision_confidence": 0.35}
    result = await rag_node(state)
    
    assert "None" in result["proposed_chemical"]
    assert result["safe_dosage_ml_per_acre"] == 0.0
    assert "Krishi Vigyan Kendra" in result["rag_treatment_plan"] or "inspection" in result["rag_treatment_plan"].lower()
