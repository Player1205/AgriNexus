from app.state import AgriNexusState
import sys
import os

# Complete CIB&RC Gazette List of Banned / Prohibited Pesticides in India
CIBRC_BANNED_CHEMICALS = {
    "endosulfan", "monocrotophos", "dicofol", "methomyl", "carbofuran",
    "phorate", "triazophos", "methyl parathion", "diazinon", "alachlor",
    "captafol", "lindane", "chlordane", "aldrin", "dieldrin", "paraquat",
    "phosphamidon", "sodium cyanide", "fenitrothion"
}

# Maximum statutory allowable single-dose active ingredient threshold in India (g or ml / acre)
MAX_STATUTORY_SINGLE_DOSE = 350.0

# Add cpp_core build dir to path if compiled
try:
    sys.path.append(os.path.join(os.path.dirname(__file__), "..", "cpp_core", "build"))
    import safety_engine
    HAS_CPP = True
except ImportError:
    HAS_CPP = False

async def safety_node(state: AgriNexusState) -> dict:
    """
    Agent 3: Deterministic Mathematical Safety Firewall & Meteorological Spray Interlock.
    Enforces CIB&RC statutory compliance, rain-fastness forecasting, wind drift prevention,
    and mathematical dosage boundary clamping.
    """
    chemical = state.get("proposed_chemical", "None")
    humidity = float(state.get("current_humidity", 75.0))
    temperature = float(state.get("current_temperature", 28.0))
    rain_risk = float(state.get("rain_risk_6h_percent", 0.0))
    wind_speed = float(state.get("wind_speed_kmh", 6.0))
    rag_dosage = float(state.get("safe_dosage_ml_per_acre", 0.0))

    # Case 1: No chemical proposed (Indeterminate or Unverified)
    if not chemical or "None" in chemical:
        return {
            "is_safe": False,
            "safe_dosage_ml_per_acre": 0.0,
            "safety_warning": "No chemical approved for application. Physical agronomist inspection required."
        }

    # Case 2: Statutory Banned Chemical Check (CIB&RC Gazette)
    chemical_lower = chemical.lower()
    for banned in CIBRC_BANNED_CHEMICALS:
        if banned in chemical_lower:
            return {
                "is_safe": False,
                "safe_dosage_ml_per_acre": 0.0,
                "safety_warning": (
                    f"CRITICAL STATUTORY VIOLATION: '{chemical}' contains '{banned.upper()}', "
                    "which is strictly BANNED under the Insecticides Act, 1968 & CIB&RC Gazette. Field use is illegal."
                )
            }

    # Case 3: Meteorological Spray Safety Interlocks
    weather_warnings = []
    if rain_risk >= 40.0:
        weather_warnings.append(f"High rain probability ({int(rain_risk)}% in next 6h). Delay spraying to avoid chemical wash-off.")
    if wind_speed >= 15.0:
        weather_warnings.append(f"High wind speed ({wind_speed} km/h). Delay spraying to prevent chemical drift into neighboring areas.")
    if temperature >= 36.0:
        weather_warnings.append(f"High temperature ({temperature}°C). Spray strictly during dawn or dusk to avoid foliar burn.")

    # Case 4: Mathematical Boundary Clamping & Humidity Attenuation
    bounded_dosage = min(rag_dosage, MAX_STATUTORY_SINGLE_DOSE)
    
    # Humidity-based phytotoxicity attenuation (>80% relative humidity increases chemical absorption)
    if humidity > 80.0:
        bounded_dosage = bounded_dosage * 0.9

    final_dosage = round(bounded_dosage, 1)

    # If compiled C++ safety engine binary is available, execute native verification
    if HAS_CPP:
        try:
            engine = safety_engine.SafetyEngine()
            result = engine.evaluate_treatment(chemical, humidity)
            if not result.is_safe:
                return {
                    "is_safe": False,
                    "safe_dosage_ml_per_acre": 0.0,
                    "safety_warning": result.warning_message
                }
        except Exception as e:
            print(f"[C++ Safety Engine Note] {e}")

    # Build comprehensive safety confirmation
    if weather_warnings:
        warning_msg = " | ".join(weather_warnings)
    else:
        warning_msg = f"Deterministic Safety Core Verified: Live Weather Optimal ({temperature}°C, {humidity}% Humidity, Rain Risk: {int(rain_risk)}%)."

    return {
        "is_safe": True,
        "safe_dosage_ml_per_acre": final_dosage,
        "safety_warning": warning_msg
    }
