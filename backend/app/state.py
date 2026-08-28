from typing import TypedDict, Annotated, List, Optional
import operator

class AgriNexusState(TypedDict, total=False):
    # Image Input
    image_path: str
    
    # Vision Agent Outputs
    vision_diagnosis: Optional[str]
    vision_confidence: float
    
    # RAG Agent Outputs
    rag_treatment_plan: Optional[str]
    proposed_chemical: Optional[str]
    current_humidity: float
    
    # Safety Engine Outputs
    is_safe: bool
    safe_dosage_ml_per_acre: float
    safety_warning: Optional[str]
    
    # Web3 Agent Outputs
    tx_hash: Optional[str]
    passport_id: Optional[int]
    
    # Voice Agent Outputs
    vernacular_audio_url: Optional[str]
    translated_text: Optional[str]

    # LangGraph control (Annotated for appending)
    errors: Annotated[List[str], operator.add]
