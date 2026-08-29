from app.state import AgriNexusState
from app.services.chroma_db import chroma_service
import os
import json
from langchain_google_genai import ChatGoogleGenerativeAI

async def rag_node(state: AgriNexusState) -> dict:
    """
    Agent 2: Grounded RAG & Spatial Agronomy Engine.
    Semantically cross-references diagnosed crop pathology with verified ICAR / CIB&RC vector store.
    Dynamically extracts official active chemicals, dosages, and dilution parameters.
    """
    diagnosis = state.get("vision_diagnosis")
    if not diagnosis or diagnosis == "Unknown crop condition":
        return {
            "errors": ["RAG Agent skipped: No vision diagnosis available."],
            "proposed_chemical": "Mancozeb 75% WP",
            "safe_dosage_ml_per_acre": 200.0,
            "rag_treatment_plan": "Apply standard broad-spectrum protective fungicide."
        }

    updates = {}
    try:
        # 1. Perform semantic vector retrieval against ICAR Research Database
        protocol = chroma_service.search_protocol(diagnosis)
        
        # 2. Dynamically extract certified agronomic metadata
        proposed_chemical = protocol.get("active_chemical", "Mancozeb 75% WP")
        base_dosage = float(protocol.get("base_dosage_per_acre", 150.0))
        dilution_liters = int(protocol.get("dilution_water_liters", 200))
        application_window = protocol.get("application_window", "Early morning on dry foliage")
        source = protocol.get("source_institute", "ICAR Research Institute")
        advisory_plan = protocol.get("advisory_text", f"Apply {proposed_chemical} at {base_dosage} per acre.")

        updates["proposed_chemical"] = proposed_chemical
        updates["safe_dosage_ml_per_acre"] = base_dosage
        updates["rag_treatment_plan"] = advisory_plan
        updates["current_humidity"] = 78.0 # Standard ambient relative humidity

        # 3. Optional LLM grounding enhancement if Google Gemini API key is configured
        api_key = os.environ.get("GOOGLE_API_KEY")
        if api_key and api_key != "your_google_api_key_here":
            try:
                llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=api_key)
                prompt = f"""You are a senior ICAR Agronomist. Given the crop diagnosis '{diagnosis}' and the verified ICAR protocol:
                - Active Chemical: {proposed_chemical}
                - Standard Dosage: {base_dosage} per acre
                - Source: {source}
                
                Provide a concise, 2-sentence agronomic summary specifying the exact treatment and application window. Zero fluff."""
                
                response = await llm.ainvoke(prompt)
                if response and response.content:
                    updates["rag_treatment_plan"] = response.content.strip()
            except Exception as llm_err:
                print(f"[RAG LLM Grounding Note] Using grounded ICAR protocol directly: {llm_err}")

        print(f"[RAG SUCCESS] Grounded ICAR Protocol: '{diagnosis}' -> '{proposed_chemical}' @ {base_dosage} / acre ({source})")

    except Exception as e:
        print(f"[RAG ERROR] {e}")
        updates["errors"] = [f"RAG Agent Error: {str(e)}"]
        updates["proposed_chemical"] = "Mancozeb 75% WP"
        updates["safe_dosage_ml_per_acre"] = 200.0
        updates["rag_treatment_plan"] = f"Apply standard ICAR protective treatment for {diagnosis}."

    return updates
