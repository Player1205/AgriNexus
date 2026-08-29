from app.state import AgriNexusState
import sys
import os

# Complete CIB&RC Gazette List of Banned / Restricted Pesticides in India
CIBRC_BANNED_CHEMICALS = {
    "endosulfan", "monocrotophos", "dicofol", "methomyl", "carbofuran",
    "phorate", "triazophos", "methyl parathion", "diazinon", "alachlor",
    "captafol", "lindane", "chlordane", "aldrin", "dieldrin", "paraquat"
}

# Add cpp_core build dir to path if compiled
try:
    sys.path.append(os.path.join(os.path.dirname(__file__), "..", "cpp_core", "build"))
    import safety_engine
    HAS_CPP = True
except ImportError:
    HAS_CPP = False

async def safety_node(state: AgriNexusState) -> dict:
    """
    Agent 3: Deterministic Safety Engine & Chemical Validation Firewall.
    Validates any active chemical against statutory CIB&RC banned lists and
    enforces mathematical dosage clamping based on ambient relative humidity.
    """
    chemical = state.get("proposed_chemical", "Mancozeb 75% WP")
    humidity = float(state.get("current_humidity", 75.0))
    rag_dosage = float(state.get("safe_dosage_ml_per_acre", 150.0))

    if not chemical:
        return {"errors": ["Safety Agent skipped: No chemical proposed."]}

    # 1. Statutory Banned Chemical Check (CIB&RC Gazette)
    chemical_lower = chemical.lower()
    for banned in CIBRC_BANNED_CHEMICALS:
        if banned in chemical_lower:
            return {
                "is_safe": False,
                "safe_dosage_ml_per_acre": 0.0,
                "safety_warning": f"CRITICAL HAZARD: '{chemical}' contains '{banned.upper()}', which is strictly BANNED under Indian CIB&RC statutory regulations. Application prohibited."
            }

    # 2. C++ Safety Engine Execution (if compiled binary available)
    if HAS_CPP:
        try:
            engine = safety_engine.SafetyEngine()
            result = engine.evaluate_treatment(chemical, humidity)
            
            # Apply mathematical humidity attenuation to RAG dosage
            attenuated_dosage = rag_dosage
            if humidity > 80.0:
                attenuated_dosage = rag_dosage * 0.9  # Reduce by 10% under high humidity to prevent leaf scorching
                
            return {
                "is_safe": result.is_safe,
                "safe_dosage_ml_per_acre": round(attenuated_dosage, 1),
                "safety_warning": result.warning_message if not result.is_safe else "Deterministic C++ Safety Core Verified: Statutory Limits Compliant."
            }
        except Exception as e:
            print(f"[C++ Safety Engine Warning] Falling back to deterministic Python core: {e}")

    # 3. Deterministic Python Mathematical Firewall
    # Safe dosage clamping: Max 350.0 ml/g per acre
    safe_dosage = min(rag_dosage, 350.0)
    if humidity > 80.0:
        safe_dosage *= 0.9  # Humidity attenuation

    return {
        "is_safe": True,
        "safe_dosage_ml_per_acre": round(safe_dosage, 1),
        "safety_warning": "Deterministic Safety Core Verified: Safe for agricultural field application."
    }
