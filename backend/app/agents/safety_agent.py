from app.state import AgriNexusState
import sys
import os

# Add cpp_core build dir to path if compiled
try:
    sys.path.append(os.path.join(os.path.dirname(__file__), "..", "cpp_core", "build"))
    import safety_engine
    HAS_CPP = True
except ImportError:
    HAS_CPP = False

async def safety_node(state: AgriNexusState) -> AgriNexusState:
    """
    Agent 3: Deterministic C++ Safety Engine.
    Uses Pybind11 to execute rigorous chemical checks.
    """
    if not state.proposed_chemical:
        state.errors.append("Safety Agent skipped: No chemical proposed.")
        return state

    if HAS_CPP:
        try:
            engine = safety_engine.SafetyEngine()
            result = engine.evaluate_treatment(state.proposed_chemical, state.current_humidity)
            
            state.is_safe = result.is_safe
            state.safe_dosage_ml_per_acre = result.recommended_dosage_ml_per_acre
            state.safety_warning = result.warning_message
            
        except Exception as e:
            state.errors.append(f"C++ Safety Engine Error: {str(e)}")
            state.is_safe = False
    else:
        # Fallback if C++ module is not yet compiled
        print("WARNING: C++ module not found. Using Python mock safety check.")
        chemical_lower = state.proposed_chemical.lower()
        banned = {"endosulfan", "monocrotophos"}
        
        if chemical_lower in banned:
            state.is_safe = False
            state.safety_warning = "CRITICAL ALERT: Banned chemical."
        else:
            state.is_safe = True
            state.safe_dosage_ml_per_acre = 150.0
            state.safety_warning = "Approved (Mock Python Fallback)."

    return state
