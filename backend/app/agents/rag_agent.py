from app.state import AgriNexusState
from app.services.chroma_db import chroma_service

async def rag_node(state: AgriNexusState) -> dict:
    """
    Agent 2: Grounded RAG & Spatial Agronomy.
    Cross-references diagnosis with ICAR vector DB.
    """
    diagnosis = state.get("vision_diagnosis")
    if not diagnosis:
        return {"errors": ["RAG Agent skipped: No vision diagnosis available."]}

    updates = {}
    try:
        # Perform vector search
        guidelines = chroma_service.search_guidelines(diagnosis)
        
        if guidelines:
            updates["rag_treatment_plan"] = guidelines[0] if isinstance(guidelines, list) else guidelines
        else:
            updates["rag_treatment_plan"] = "Apply standard broad-spectrum fungicide as per local guidelines."

        # Extract chemical proposal (simplified extraction for demo)
        plan_lower = updates["rag_treatment_plan"].lower()
        if "mancozeb" in plan_lower:
            updates["proposed_chemical"] = "Mancozeb"
        elif "propiconazole" in plan_lower:
            updates["proposed_chemical"] = "Propiconazole"
        elif "azoxystrobin" in plan_lower:
            updates["proposed_chemical"] = "Azoxystrobin"
        elif "endosulfan" in plan_lower: # Simulating a dangerous RAG hallucination
            updates["proposed_chemical"] = "Endosulfan"
        else:
            updates["proposed_chemical"] = "Mancozeb" # Default safe

        # In a real app, we'd call OpenWeatherMap API here
        updates["current_humidity"] = 85.0 # Mock high humidity

    except Exception as e:
        updates["errors"] = [f"RAG Agent Error: {str(e)}"]
        updates["proposed_chemical"] = "Mancozeb"
        updates["rag_treatment_plan"] = "Fallback treatment."

    return updates
