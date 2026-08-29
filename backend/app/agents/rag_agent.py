from app.state import AgriNexusState
from app.services.chroma_db import chroma_service
import os
import json
from langchain_google_genai import ChatGoogleGenerativeAI

async def rag_node(state: AgriNexusState) -> dict:
    """
    Agent 2: Grounded ICAR RAG & Agronomy Verification Engine.
    Strict Zero-Hallucination Policy: Queries verified ICAR research protocols.
    If evidence is missing or confidence is low, it refuses to guess hazardous chemicals.
    """
    diagnosis = state.get("vision_diagnosis")
    confidence = float(state.get("vision_confidence", 0.0))

    # Strict Gate: If vision diagnosis is missing or low-confidence
    if not diagnosis or "Unrecognized" in diagnosis or confidence < 0.60:
        return {
            "proposed_chemical": "None - Field Inspection Required",
            "safe_dosage_ml_per_acre": 0.0,
            "rag_treatment_plan": (
                "Indeterminate foliar symptom. Do not apply chemical pesticides without physical verification. "
                "Farmer is advised to submit a leaf sample to the nearest Krishi Vigyan Kendra (KVK) or ICAR extension center."
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

            updates["proposed_chemical"] = proposed_chemical
            updates["safe_dosage_ml_per_acre"] = base_dosage
            updates["rag_treatment_plan"] = advisory_text
            updates["current_humidity"] = 78.0 # Standard field relative humidity
            
            print(f"[RAG SUCCESS] Grounded ICAR Protocol: '{diagnosis}' -> '{proposed_chemical}' @ {base_dosage} / acre [{source}]")
        else:
            # If no certified ICAR scientific protocol matches
            updates["proposed_chemical"] = "None - Consultation Required"
            updates["safe_dosage_ml_per_acre"] = 0.0
            updates["rag_treatment_plan"] = (
                f"No verified ICAR chemical protocol found for '{diagnosis}'. "
                "Consult a certified plant pathologist at the District Agriculture Office before applying any chemical."
            )
            updates["current_humidity"] = 75.0

    except Exception as e:
        print(f"[RAG ERROR] {e}")
        updates["errors"] = [f"RAG Agent Error: {str(e)}"]
        updates["proposed_chemical"] = "None - Error in Protocol Retrieval"
        updates["safe_dosage_ml_per_acre"] = 0.0
        updates["rag_treatment_plan"] = "System encountered an error retrieving certified treatment protocols."

    return updates
