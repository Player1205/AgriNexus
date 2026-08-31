from app.state import AgriNexusState
from app.services.kvk_service import kvk_service
import sys
import os

# Complete CIB&RC Gazette List of Banned / Prohibited Pesticides in India
CIBRC_BANNED_CHEMICALS = {
    "endosulfan", "monocrotophos", "dicofol", "methomyl", "carbofuran",
    "phorate", "triazophos", "methyl parathion", "diazinon", "alachlor",
    "captafol", "lindane", "chlordane", "aldrin", "dieldrin", "paraquat",
    "phosphamidon", "sodium cyanide", "fenitrothion"
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
    Agent 3: Deterministic Mathematical Safety Firewall & Meteorological Spray Interlock.
    Enforces:
    1. Formulation separation (ml vs g) and ICAR Minimum Inhibitory Concentration (MIC) floor protection.
    2. CIB&RC statutory banned chemical firewall.
    3. Meteorological spray safety interlocks (Rain-fastness, Wind drift, Temperature).
    4. Statutory Non-Actionable Referral & Nearest ICAR KVK Geolocation Resolver on Low Confidence (<60%).
    """
    chemical = state.get("proposed_chemical", "None")
    humidity = float(state.get("current_humidity", 75.0))
    temperature = float(state.get("current_temperature", 28.0))
    rain_risk = float(state.get("rain_risk_6h_percent", 0.0))
    wind_speed = float(state.get("wind_speed_kmh", 6.0))
    rag_dosage = float(state.get("safe_dosage_ml_per_acre", 0.0))
    confidence = float(state.get("vision_confidence", 0.0))
    diagnosis = state.get("vision_diagnosis", "")
    unit = state.get("dosage_unit", "g")
    formulation_type = state.get("formulation_type", "SOLID_WP")
    min_mic = float(state.get("min_mic_dosage", rag_dosage * 0.8 if rag_dosage > 0 else 0.0))
    max_stat = float(state.get("max_statutory_dosage", 350.0))
    
    lat = state.get("client_latitude")
    lon = state.get("client_longitude")

    # Case 1: Low Confidence (<60%) or Unrecognized Anomaly -> Statutory KVK Extension Referral
    if confidence < 0.60 or not chemical or "None" in chemical or "Unrecognized" in diagnosis:
        nearest_kvk = kvk_service.find_nearest_kvk(lat, lon)
        warning_msg = (
            "NON-ACTIONABLE: Mandatory Physical Verification by Local KVK Extension Officer Required. "
            f"Foliar diagnostic confidence ({round(confidence*100, 1)}%) is below statutory 60% threshold. "
            f"Nearest Center: {nearest_kvk['name']} ({nearest_kvk['distance_km']} km away, Tel: {nearest_kvk['phone']})."
        )
        return {
            "is_safe": False,
            "safe_dosage_ml_per_acre": 0.0,
            "dosage_unit": unit,
            "formulation_type": formulation_type,
            "safety_warning": warning_msg,
            "is_non_actionable_referral": True,
            "nearest_kvk": nearest_kvk,
            "is_mic_protected": False
        }

    # Case 2: Statutory Banned Chemical Check (CIB&RC Gazette Schedule)
    chemical_lower = chemical.lower()
    for banned in CIBRC_BANNED_CHEMICALS:
        if banned in chemical_lower:
            return {
                "is_safe": False,
                "safe_dosage_ml_per_acre": 0.0,
                "dosage_unit": unit,
                "formulation_type": formulation_type,
                "safety_warning": (
                    f"CRITICAL STATUTORY VIOLATION: '{chemical}' contains '{banned.upper()}', "
                    "which is strictly BANNED under the Insecticides Act, 1968 & CIB&RC Gazette. Field use is illegal."
                ),
                "is_non_actionable_referral": False,
                "is_mic_protected": False
            }

    # Case 3: Meteorological Spray Safety Interlocks
    weather_warnings = []
    if rain_risk >= 40.0:
        weather_warnings.append(f"High rain probability ({int(rain_risk)}% in next 6h). Delay spraying to avoid chemical wash-off.")
    if wind_speed >= 15.0:
        weather_warnings.append(f"High wind speed ({wind_speed} km/h). Delay spraying to prevent chemical drift into neighboring areas.")
    if temperature >= 36.0:
        weather_warnings.append(f"High temperature ({temperature}°C). Spray strictly during dawn or dusk to avoid foliar burn.")

    # Case 4: Mathematical Formulation Clamping & ICAR MIC Floor Enforcement
    bounded_dosage = min(rag_dosage, max_stat)
    mic_held = False
    
    # Humidity attenuation (>80% relative humidity increases foliar absorption)
    if humidity > 80.0:
        attenuated = bounded_dosage * 0.90
        # Strict MIC Floor: Never drop below minimum inhibitory concentration
        if min_mic > 0.0 and attenuated < min_mic:
            bounded_dosage = min_mic
            mic_held = True
        else:
            bounded_dosage = attenuated

    final_dosage = round(bounded_dosage, 1)

    # If compiled C++ safety engine binary is available, execute native C++ verification
    if HAS_CPP:
        try:
            engine = safety_engine.SafetyEngine()
            if hasattr(engine, 'evaluate_treatment_v2'):
                result = engine.evaluate_treatment_v2(chemical, humidity, rag_dosage, min_mic, max_stat, unit, formulation_type)
            else:
                result = engine.evaluate_treatment(chemical, humidity, rag_dosage)
            
            if not result.is_safe:
                return {
                    "is_safe": False,
                    "safe_dosage_ml_per_acre": 0.0,
                    "dosage_unit": unit,
                    "formulation_type": formulation_type,
                    "safety_warning": result.warning_message,
                    "is_non_actionable_referral": False,
                    "is_mic_protected": False
                }
            final_dosage = round(result.recommended_dosage, 1)
            mic_held = getattr(result, 'is_mic_protected', mic_held)
        except Exception as e:
            print(f"[C++ Safety Engine Fallback] {e}")

    # Build comprehensive safety advisory
    if weather_warnings:
        warning_msg = " | ".join(weather_warnings)
    else:
        warning_msg = f"Deterministic Safety Core: Verified compliant within ICAR therapeutic window [{min_mic}-{max_stat} {unit}/acre]."
        if mic_held:
            warning_msg += " (Protected at Minimum Inhibitory Concentration floor)."

    return {
        "is_safe": True,
        "safe_dosage_ml_per_acre": final_dosage,
        "dosage_unit": unit,
        "formulation_type": formulation_type,
        "safety_warning": warning_msg,
        "is_non_actionable_referral": False,
        "is_mic_protected": mic_held,
        "nearest_kvk": None
    }
