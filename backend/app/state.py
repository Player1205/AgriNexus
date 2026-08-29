from typing import TypedDict, Annotated, List, Optional
import operator

class AgriNexusState(TypedDict, total=False):
    # Image Input
    image_path: str
    
    # Live GPS & Meteorological Data
    weather_data: Optional[dict]
    current_temperature: Optional[float]
    current_humidity: Optional[float]
    rain_risk_6h_percent: Optional[float]
    wind_speed_kmh: Optional[float]
    is_spray_safe: Optional[bool]
    location_source: Optional[str]
    
    # Vision Agent Outputs
    vision_diagnosis: Optional[str]
    vision_confidence: float
    
    # RAG Agent Outputs
    rag_treatment_plan: Optional[str]
    proposed_chemical: Optional[str]
    
    # Safety Engine Outputs
    is_safe: bool
    safe_dosage_ml_per_acre: float
    safety_warning: Optional[str]
    
    # Web3 Agent Outputs
    tx_hash: Optional[str]
    passport_id: Optional[int]
    
    # Voice Agent Outputs
    language_code: Optional[str]
    vernacular_audio_url: Optional[str]
    translated_text: Optional[str]

    # LangGraph control (Annotated for appending)
    errors: Annotated[List[str], operator.add]
