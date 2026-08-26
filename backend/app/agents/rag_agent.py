from app.state import AgriNexusState
from app.services.chroma_db import chroma_service

async def rag_node(state: AgriNexusState) -> AgriNexusState:
    """
    Agent 2: Grounded RAG & Spatial Agronomy.
    Cross-references diagnosis with ICAR vector DB.
    """
    if not state.vision_diagnosis:
        state.errors.append("RAG Agent skipped: No vision diagnosis available.")
        return state

    try:
        # Perform vector search
        guidelines = chroma_service.search_guidelines(state.vision_diagnosis)
        
        if guidelines:
            state.rag_treatment_plan = guidelines[0] if isinstance(guidelines, list) else guidelines
        else:
            state.rag_treatment_plan = "Apply standard broad-spectrum fungicide as per local guidelines."

        # Extract chemical proposal (simplified extraction for demo)
        plan_lower = state.rag_treatment_plan.lower()
        if "mancozeb" in plan_lower:
            state.proposed_chemical = "Mancozeb"
        elif "propiconazole" in plan_lower:
            state.proposed_chemical = "Propiconazole"
        elif "azoxystrobin" in plan_lower:
            state.proposed_chemical = "Azoxystrobin"
        elif "endosulfan" in plan_lower: # Simulating a dangerous RAG hallucination
            state.proposed_chemical = "Endosulfan"
        else:
            state.proposed_chemical = "Mancozeb" # Default safe

        # In a real app, we'd call OpenWeatherMap API here
        state.current_humidity = 85.0 # Mock high humidity

    except Exception as e:
        state.errors.append(f"RAG Agent Error: {str(e)}")
        state.proposed_chemical = "Mancozeb"
        state.rag_treatment_plan = "Fallback treatment."

    return state
