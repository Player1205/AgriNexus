from app.state import AgriNexusState
from app.services.chroma_db import chroma_service
import os
import json

async def rag_node(state: AgriNexusState) -> dict:
    """
    Agent 2: Grounded ICAR RAG & Agronomy Verification Engine.
    Strict Zero-Hallucination Policy: Queries verified ICAR research protocols.
    If evidence is missing or confidence is low (<60%), it refuses to guess hazardous chemicals
    and triggers a statutory Human-in-the-Loop extension referral to the nearest KVK.
    """
    diagnosis = state.get("vision_diagnosis")
    confidence = float(state.get("vision_confidence", 0.0))

    # Strict Gate: If vision diagnosis is missing, unrecognized, or low-confidence (<60%)
    if not diagnosis or "Unrecognized" in diagnosis or confidence < 0.60:
        return {
            "proposed_chemical": "None - Field Inspection Required",
            "safe_dosage_ml_per_acre": 0.0,
            "dosage_unit": "g",
            "formulation_type": "NONE",
            "min_mic_dosage": 0.0,
            "max_statutory_dosage": 0.0,
            "rag_treatment_plan": (
                "NON-ACTIONABLE: Diagnostic confidence is below the statutory 60% threshold. "
                "Chemical application is strictly prohibited without physical verification. "
                "Farmer is referred to the nearest ICAR Krishi Vigyan Kendra (KVK) extension center."
            ),
            "current_humidity": 75.0,
            "errors": ["Diagnostic confidence below certified safety threshold (60%). Chemical prescription blocked."]
        }

    updates = {}
    try:
        # 1. Search verified ICAR research database
        protocol = chroma_service.search_protocol(diagnosis)
        
        if protocol:
            proposed_chemical = protocol.get("active_chemical")
            base_dosage = float(protocol.get("base_dosage_per_acre", 150.0))
            dilution_liters = int(protocol.get("dilution_water_liters", 200))
            source = protocol.get("source_institute", "ICAR Extension Center")
            advisory_text = protocol.get("advisory_text")
            unit = protocol.get("unit", "ml" if "SC" in proposed_chemical or "EC" in proposed_chemical else "g")
            f_type = protocol.get("formulation_type", "LIQUID_SC" if unit == "ml" else "SOLID_WP")
            min_mic = float(protocol.get("min_mic_dosage", round(base_dosage * 0.8, 1)))
            max_stat = float(protocol.get("max_statutory_dosage", round(base_dosage * 1.3, 1)))

            updates["proposed_chemical"] = proposed_chemical
            updates["safe_dosage_ml_per_acre"] = base_dosage
            updates["dosage_unit"] = unit
            updates["formulation_type"] = f_type
            updates["min_mic_dosage"] = min_mic
            updates["max_statutory_dosage"] = max_stat
            updates["rag_treatment_plan"] = advisory_text
            updates["current_humidity"] = float(state.get("current_humidity", 75.0))
            
            print(f"[RAG SUCCESS] Grounded ICAR Protocol: '{diagnosis}' -> '{proposed_chemical}' @ {base_dosage} {unit}/acre (MIC: {min_mic}, Max: {max_stat}) [{source}]")
        else:
            # If no certified ICAR scientific protocol matches
            updates["proposed_chemical"] = "None - Consultation Required"
            updates["safe_dosage_ml_per_acre"] = 0.0
            updates["dosage_unit"] = "g"
            updates["formulation_type"] = "NONE"
            updates["min_mic_dosage"] = 0.0
            updates["max_statutory_dosage"] = 0.0
            updates["rag_treatment_plan"] = (
                f"No verified ICAR chemical protocol found for '{diagnosis}'. "
                "Consult a certified plant pathologist at the District Agriculture Office / KVK before applying any chemical."
            )
            updates["current_humidity"] = float(state.get("current_humidity", 75.0))

    except Exception as e:
        print(f"[RAG ERROR] {e}")
        updates["errors"] = [f"RAG Agent Error: {str(e)}"]
        updates["proposed_chemical"] = "None - Error in Protocol Retrieval"
        updates["safe_dosage_ml_per_acre"] = 0.0
        updates["dosage_unit"] = "g"
        updates["formulation_type"] = "NONE"
        updates["rag_treatment_plan"] = "System encountered an error retrieving certified treatment protocols."

    return updates
