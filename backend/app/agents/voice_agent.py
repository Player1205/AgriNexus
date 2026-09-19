from app.state import AgriNexusState
from app.services.tts_client import tts_client
from langchain_google_genai import ChatGoogleGenerativeAI
import os

# Complete 11 Indian Regional Languages Metadata Matrix
LANGUAGE_INFO = {
    "hi": {"name": "Hindi", "script": "Devanagari", "greeting": "किसान भाई"},
    "pa": {"name": "Punjabi", "script": "Gurmukhi", "greeting": "ਕਿਸਾਨ ਵੀਰੋ"},
    "te": {"name": "Telugu", "script": "Telugu", "greeting": "రైతు సోదరులారా"},
    "ta": {"name": "Tamil", "script": "Tamil", "greeting": "விவசாய சகோதரர்களே"},
    "ml": {"name": "Malayalam", "script": "Malayalam", "greeting": "കർഷക സുഹൃത്തുക്കളെ"},
    "kn": {"name": "Kannada", "script": "Kannada", "greeting": "ರೈತ ಮಿತ್ರರೇ"},
    "bn": {"name": "Bengali", "script": "Bengali", "greeting": "কৃষক ভাইয়েরা"},
    "mr": {"name": "Marathi", "script": "Devanagari", "greeting": "शेतकरी मित्रांनो"},
    "gu": {"name": "Gujarati", "script": "Gujarati", "greeting": "ખેડૂત મિત્રો"},
    "od": {"name": "Odia", "script": "Odia", "greeting": "କୃଷକ ଭାଇମାନେ"},
    "en": {"name": "English", "script": "Latin", "greeting": "Dear Farmer"}
}

# Dynamic Regional Pathology Localization Dictionary across All 11 Indian Languages
PATHOLOGY_TRANSLATIONS = {
    "Tomato Late Blight": {
        "hi": "पछेता झुलसा रोग (Late Blight)",
        "pa": "ਪਛੇਤਾ ਝੁਲਸ ਰੋਗ (Late Blight)",
        "te": "ఆలస్యపు తెగులు (Late Blight)",
        "ta": "பின்தங்கிய கருகல் நோய் (Late Blight)",
        "ml": "ലേറ്റ് ബ്ലൈറ്റ് രോഗം (Late Blight)",
        "kn": "ತಡವಾದ ಅಂಗಮಾರಿ ರೋಗ (Late Blight)",
        "bn": "নাবী ধসা রোগ (Late Blight)",
        "mr": "उशिरा येणारा करपा (Late Blight)",
        "gu": "પાછોતરો સુકારો (Late Blight)",
        "od": "ପଛୁଆ ଝାଉଁଳା ରୋଗ (Late Blight)",
        "en": "Tomato Late Blight"
    },
    "Tomato Early Blight": {
        "hi": "अगेती झुलसा रोग (Early Blight)",
        "pa": "ਅਗੇਤਾ ਝੁਲਸ ਰੋਗ (Early Blight)",
        "te": "ముందస్తు తెగులు (Early Blight)",
        "ta": "முந்தைய கருகல் நோய் (Early Blight)",
        "ml": "ഏർലി ബ്ലൈറ്റ് രോഗം (Early Blight)",
        "kn": "ಮುಂಚಿನ ಅಂಗಮಾರಿ ರೋಗ (Early Blight)",
        "bn": "আগাম ধসা রোগ (Early Blight)",
        "mr": "लवकर येणारा करपा (Early Blight)",
        "gu": "અગેતરો સુકારો (Early Blight)",
        "od": "ଆଗୁଆ ଝାଉଁଳା ରୋଗ (Early Blight)",
        "en": "Tomato Early Blight"
    },
    "Tomato Leaf Mold": {
        "hi": "पत्ती फफूंद रोग (Leaf Mold)",
        "pa": "ਪੱਤਿਆਂ ਦੀ ਉੱਲੀ (Leaf Mold)",
        "te": "ఆకు బూజు తెగులు (Leaf Mold)",
        "ta": "இலை பூஞ்சை நோய் (Leaf Mold)",
        "ml": "ഇല പൂപ്പൽ രോഗം (Leaf Mold)",
        "kn": "ಎಲೆ ಬೂಜು ರೋಗ (Leaf Mold)",
        "bn": "পাতার ছত্রাক রোগ (Leaf Mold)",
        "mr": "पानावरील बुरशी (Leaf Mold)",
        "gu": "પાનની ફૂગ (Leaf Mold)",
        "od": "ପତ୍ର ଫିମ୍ପି ରୋଗ (Leaf Mold)",
        "en": "Tomato Leaf Mold"
    },
    "Tomato Target Spot": {
        "hi": "टारगेट स्पॉट धब्बा रोग (Target Spot)",
        "pa": "ਟਾਰਗੇਟ ਸਪਾਟ ਰੋਗ (Target Spot)",
        "te": "టార్గెట్ స్పాట్ తెగులు (Target Spot)",
        "ta": "வட்டப் புள்ளி நோய் (Target Spot)",
        "ml": "ടാർഗെറ്റ് സ്പോട്ട് (Target Spot)",
        "kn": "ಟಾರ್ಗೆಟ್ ಸ್ಪಾಟ್ ರೋಗ (Target Spot)",
        "bn": "টার্গেট স্পট রোগ (Target Spot)",
        "mr": "टारगेट स्पॉट ठिपके (Target Spot)",
        "gu": "ટાર્ગેટ સ્પોટ રોગ (Target Spot)",
        "od": "ଟାର୍ଗେଟ୍ ସ୍ପଟ୍ ରୋଗ (Target Spot)",
        "en": "Tomato Target Spot"
    },
    "Tomato Bacterial Spot": {
        "hi": "जीवाणु धब्बा रोग (Bacterial Spot)",
        "pa": "ਜੀਵਾਣੂ ਧੱਬਾ ਰੋਗ (Bacterial Spot)",
        "te": "బాక్టీరియల్ మచ్చల తెగులు (Bacterial Spot)",
        "ta": "பாக்டீரியா புள்ளி நோய் (Bacterial Spot)",
        "ml": "ബാക്ടീരിയൽ സ്പോട്ട് (Bacterial Spot)",
        "kn": "ಬ್ಯಾಕ್ಟೀರಿಯಾದ ಕಲೆ ರೋಗ (Bacterial Spot)",
        "bn": "ব্যাকটেরিয়াল স্পট রোগ (Bacterial Spot)",
        "mr": "जिवाणू ठिपके रोग (Bacterial Spot)",
        "gu": "બેક્ટેરિયલ સ્પોટ રોગ (Bacterial Spot)",
        "od": "ବ୍ୟାକ୍ଟେରିଆଲ୍ ଦାଗ ରୋଗ (Bacterial Spot)",
        "en": "Tomato Bacterial Spot"
    },
    "Tomato Yellow Leaf Curl Virus": {
        "hi": "पत्ता मरोड़ वायरस (Yellow Leaf Curl Virus)",
        "pa": "ਪੱਤਾ ਮਰੋੜ ਵਿਸ਼ਾਣੂ (Yellow Leaf Curl Virus)",
        "te": "ఆకు ముడుత వైరస్ (Leaf Curl Virus)",
        "ta": "இலை சுருள் நச்சுயிரி (Leaf Curl Virus)",
        "ml": "ഇല ചുരുളൽ വൈറസ് (Leaf Curl Virus)",
        "kn": "ಎಲೆ ಮುದುರು ರೋಗ (Leaf Curl Virus)",
        "bn": "পাতা কোঁকড়ানো ভাইরাস (Leaf Curl Virus)",
        "mr": "पर्णगुच्छ विषाणू (Leaf Curl Virus)",
        "gu": "પાન સંકોચન વાયરસ (Leaf Curl Virus)",
        "od": "ପତ୍ର କୁଞ୍ଚନ ଭୂତାଣୁ (Leaf Curl Virus)",
        "en": "Tomato Yellow Leaf Curl Virus"
    },
    "Apple Apple Scab": {
        "hi": "सेब का स्कैब रोग (Apple Scab)",
        "pa": "ਸੇਬ ਦਾ ਸਕੈਬ ਰੋਗ (Apple Scab)",
        "te": "యాపిల్ స్కాబ్ తెగులు (Apple Scab)",
        "ta": "ஆப்பிள் ஸ்கேப் நோய் (Apple Scab)",
        "ml": "ആപ്പിൾ സ്കാബ് രോഗം (Apple Scab)",
        "kn": "ಸೇಬು ಸ್ಕ್ಯಾಬ್ ರೋಗ (Apple Scab)",
        "bn": "আপেল স্ক্যাব রোগ (Apple Scab)",
        "mr": "सफरचंद स्कॅब रोग (Apple Scab)",
        "gu": "સફરજન સ્કેબ રોગ (Apple Scab)",
        "od": "ସେଓ ସ୍କାବ୍ ରୋଗ (Apple Scab)",
        "en": "Apple Scab"
    },
    "Corn Common Rust": {
        "hi": "मक्के का रतुआ रोग (Corn Rust)",
        "pa": "ਮੱਕੀ ਦਾ ਕੁੰਗੀ ਰੋਗ (Corn Rust)",
        "te": "మొక్కజొన్న తుప్పు తెగులు (Corn Rust)",
        "ta": "சோள துரு நோய் (Corn Rust)",
        "ml": "മക്കാച്ചോളം തുരുമ്പ് രോഗം (Corn Rust)",
        "kn": "ಮೆಕ್ಕೆಜೋಳದ ತುಕ್ಕು ರೋಗ (Corn Rust)",
        "bn": "ভুট্টার মরিচা রোগ (Corn Rust)",
        "mr": "मक्यावरील तांबेरा (Corn Rust)",
        "gu": "મકાઈનો ગેરુ રોગ (Corn Rust)",
        "od": "ମକା କଳଙ୍କୀ ରୋଗ (Corn Rust)",
        "en": "Corn Common Rust"
    },
    "Healthy": {
        "hi": "स्वस्थ फसल (Healthy Crop)",
        "pa": "ਤੰਦਰੁਸਤ ਫਸਲ (Healthy Crop)",
        "te": "ఆరోగ్యకరమైన పంట (Healthy Crop)",
        "ta": "ஆரோக்கியமான பயிர் (Healthy Crop)",
        "ml": "ആരോഗ്യമുള്ള വിള (Healthy Crop)",
        "kn": "ಆರೋಗ್ಯಕರ ಬೆಳೆ (Healthy Crop)",
        "bn": "সুস্থ ফসল (Healthy Crop)",
        "mr": "निरोगी पीक (Healthy Crop)",
        "gu": "તંદુરસ્ત પાક (Healthy Crop)",
        "od": "ସୁସ୍ଥ ଫସଲ (Healthy Crop)",
        "en": "Healthy Crop"
    }
}

def get_localized_pathology(diagnosis: str, lang: str) -> str:
    """Returns localized pathology string or falls back to clean diagnosis."""
    for key, trans_dict in PATHOLOGY_TRANSLATIONS.items():
        if key.lower() in diagnosis.lower() or diagnosis.lower() in key.lower():
            return trans_dict.get(lang, f"{diagnosis}")
    return f"{diagnosis}"

async def voice_node(state: AgriNexusState) -> dict:
    """
    Agent 5: Vernacular Translation & Comprehensive Voice Synthesis.
    Dynamically maps verified diagnosis, chemical, and ICAR dosage into 11 Indic languages
    incorporating real-time field weather metrics, offline weather cautions, and nearest KVK extension location.
    """
    is_safe = state.get("is_safe", False)
    vision_diagnosis = state.get("vision_diagnosis", "Foliar Condition")
    proposed_chemical = state.get("proposed_chemical", "None")
    safe_dosage = state.get("safe_dosage_ml_per_acre", 0.0)
    safety_warning = state.get("safety_warning", "")
    language_code = state.get("language_code", "hi")
    
    # Weather metrics & Offline Location Source Check
    temperature = round(float(state.get("current_temperature", 28.0)), 1)
    humidity = round(float(state.get("current_humidity", 75.0)), 1)
    rain_risk = int(round(float(state.get("rain_risk_6h_percent", 0.0))))
    wind_speed = round(float(state.get("wind_speed_kmh", 6.0)), 1)
    aqi = int(state.get("aqi", state.get("weather_data", {}).get("aqi", 2)))
    aqi_label = str(state.get("aqi_label", state.get("weather_data", {}).get("aqi_label", "Fair")))
    location_source = str(state.get("location_source", "regional_baseline")).upper()
    is_live_weather = state.get("is_live_weather", True) if "is_live_weather" in state else ("OFFLINE" not in location_source)

    lang_meta = LANGUAGE_INFO.get(language_code, LANGUAGE_INFO["hi"])
    target_language = lang_meta["name"]
    target_script = lang_meta["script"]
    localized_disease = get_localized_pathology(vision_diagnosis, language_code)

    # Nearest KVK Details
    nearest_kvk = state.get("nearest_kvk")
    if not nearest_kvk:
        try:
            from app.services.kvk_service import kvk_service
            lat = state.get("client_latitude")
            lon = state.get("client_longitude")
            nearest_kvk = kvk_service.find_nearest_kvk(lat, lon)
        except Exception:
            nearest_kvk = None
    kvk_name_str = nearest_kvk.get("name", "District Krishi Vigyan Kendra") if nearest_kvk else "District Krishi Vigyan Kendra"
    kvk_dist_str = f"{nearest_kvk.get('distance_km', 0.0)} km" if nearest_kvk else ""
    unit = state.get("dosage_unit", "ml" if "SC" in proposed_chemical or "EC" in proposed_chemical else "g")

    # Deterministic Meteorological Interlocks (Rain >= 35%, Wind >= 15 km/h, Heat >= 36°C, AQI >= 4)
    is_rain_hazard = (rain_risk >= 35)
    is_wind_hazard = (wind_speed >= 15.0)
    is_heat_hazard = (temperature >= 36.0)
    is_aqi_hazard = (aqi >= 4)

    weather_hazard_notes = []
    if is_rain_hazard:
        weather_hazard_notes.append(f"High rain risk ({rain_risk}% in next 6h)")
    if is_wind_hazard:
        weather_hazard_notes.append(f"High wind velocity ({wind_speed} km/h)")
    if is_heat_hazard:
        weather_hazard_notes.append(f"Extreme heat ({temperature}°C)")
    if is_aqi_hazard:
        weather_hazard_notes.append(f"High air pollution (AQI {aqi} - {aqi_label})")

    is_crop_supported = state.get("is_crop_supported", True)
    detected_subj = state.get("detected_subject", "Non-Agricultural Subject")
    is_gemini_fallback = state.get("identified_by") == "gemini_fallback"

    if not is_crop_supported:
        if is_gemini_fallback and detected_subj and "Non-Agricultural" not in detected_subj:
            english_text = (
                f"Dear Farmer, our on-device ICAR computer vision model was uncertain or this crop is uncertified. "
                f"Via Gemini Cloud AI fallback, the crop was identified as {detected_subj}, showing signs of {vision_diagnosis}. "
                f"Current field weather: {temperature}°C, {humidity}% humidity, wind {wind_speed} km/h, and Air Quality Index is AQI {aqi} ({aqi_label}). "
                f"Please note: AgriNexus is officially certified only for 14 commercial agricultural food crops "
                f"(Tomato, Potato, Corn, Apple, Grape, Strawberry, Pepper, Orange, Soybean, Peach, Cherry, Squash, Raspberry, Blueberry). "
                f"Because this crop is not within our 14 ICAR-certified databases, chemical recommendations are strictly locked to prevent crop damage. "
                f"Recommended Action: Prune visibly affected foliage, ensure good field drainage, and maintain organic sanitation. "
                f"For certified chemical specifications and diagnostic clarity, please consult your nearest extension center: {kvk_name_str} ({kvk_dist_str} away)."
            )
        else:
            english_text = (
                f"Dear Farmer, the uploaded image appears to be {detected_subj}. "
                f"Current field weather: {temperature}°C, {humidity}% humidity, wind {wind_speed} km/h, AQI {aqi} ({aqi_label}). "
                f"AgriNexus is certified specifically for 14 commercial agricultural food crops (Tomato, Potato, Corn, Apple, Grape, Strawberry, Pepper, Soybean, etc.). "
                f"Chemical application is strictly prohibited on non-target plants. "
                f"Please upload a clear close-up photo of a supported crop leaf."
            )
    elif not is_safe:
        english_text = (
            f"Dear Farmer, your crop shows foliar symptoms of {vision_diagnosis}. "
            f"Current weather: {temperature}°C, wind {wind_speed} km/h, AQI {aqi} ({aqi_label}). "
            f"However, chemical application cannot be approved safely. {safety_warning} "
            f"Please do not spray any unverified chemical to avoid crop damage. "
            f"Please consult your nearest extension center: {kvk_name_str} ({kvk_dist_str} away)."
        )
    else:
        # Safe Prescription: Construct data-driven weather advisory
        aqi_str = f"Air Quality Index is {aqi} ({aqi_label}). "
        if not is_live_weather:
            weather_note = (
                "Caution: Live field weather could not be fetched due to lack of internet connection. "
                "Please visually verify there is no imminent rain or strong wind before spraying to prevent chemical wash-off."
            )
            english_text = (
                f"Dear Farmer, your crop is affected by {vision_diagnosis}. {weather_note} {aqi_str}"
                f"For safe, certified treatment, spray {proposed_chemical} at an exact dosage of {safe_dosage} {unit} per acre, "
                f"thoroughly mixed in 200 liters of clean water on dry foliage."
            )
        elif is_rain_hazard or is_wind_hazard or is_aqi_hazard:
            hazard_str = " and ".join(weather_hazard_notes)
            english_text = (
                f"Dear Farmer, your crop is affected by {vision_diagnosis}. "
                f"The verified ICAR treatment is {proposed_chemical} at {safe_dosage} {unit} per acre mixed in 200 liters of clean water. "
                f"HOWEVER, DO NOT SPRAY TODAY. Critical alert: {hazard_str}. "
                f"Adverse atmospheric conditions will cause severe chemical drift or wash-off. "
                f"Please postpone spraying until weather conditions clear and air quality improves."
            )
        elif is_heat_hazard:
            english_text = (
                f"Dear Farmer, your crop is affected by {vision_diagnosis}. "
                f"Warning: Extreme heat detected in your field ({temperature}°C). {aqi_str}"
                f"Spraying in midday sun will cause acute foliar scorching and droplet evaporation. "
                f"For safe treatment, spray {proposed_chemical} at {safe_dosage} {unit} per acre in 200 liters of clean water, "
                f"STRICTLY during cool early morning hours before 8 AM or after 6 PM in the evening."
            )
        else:
            english_text = (
                f"Dear Farmer, your crop is affected by {vision_diagnosis}. "
                f"Current field weather is optimal ({temperature}°C, {humidity}% humidity, wind {wind_speed} km/h, AQI {aqi} - {aqi_label}). Safe to spray. "
                f"For safe, certified treatment, spray {proposed_chemical} at an exact dosage of {safe_dosage} {unit} per acre, "
                f"thoroughly mixed in 200 liters of clean water during early morning or late evening."
            )

    def clean_voice_text(text: str) -> str:
        if not text:
            return ""
        text = text.strip()
        # Strip code block wrappers
        if text.startswith("```"):
            import re
            text = re.sub(r"^```[a-zA-Z]*\s*", "", text)
            text = re.sub(r"\s*```$", "", text)
            text = text.strip()
        
        # If it's JSON/dict with a message or text field
        if text.startswith("{") or text.startswith("["):
            import json, re
            try:
                parsed = json.loads(text)
                if isinstance(parsed, dict):
                    for k in ["text", "advisory", "message", "translation"]:
                        if k in parsed and isinstance(parsed[k], str):
                            return parsed[k].strip()
                elif isinstance(parsed, list) and len(parsed) > 0 and isinstance(parsed[0], dict):
                    for k in ["text", "advisory", "message"]:
                        if k in parsed[0] and isinstance(parsed[0][k], str):
                            return parsed[0][k].strip()
            except Exception:
                pass
            
            # Regex extraction for stringified python dicts like {'text': '...'}
            m = re.search(r"['\"](?:text|advisory|message)['\"]\s*:\s*['\"](.*?)['\"](?:\s*,\s*['\"]|\s*})", text, re.DOTALL)
            if m:
                text = m.group(1).replace("\\n", "\n").replace('\\"', '"').replace("\\'", "'").strip()
        return text

    def get_localized_fallback() -> str:
        if not is_crop_supported:
            if is_gemini_fallback and detected_subj and "Non-Agricultural" not in detected_subj:
                if language_code == "hi":
                    return (
                        f"किसान भाई, हमारे ऑन-डिवाइस मॉडल द्वारा पहचान न होने पर Gemini AI द्वारा इस पौधे की पहचान '{detected_subj}' ({vision_diagnosis}) के रूप में की गई है। "
                        f"खेत का मौसम: तापमान {temperature}°C, नमी {humidity}%, हवा {wind_speed} km/h तथा वायु गुणवत्ता सूचकांक AQI {aqi} ({aqi_label}) है। "
                        f"कृपया ध्यान दें: AgriNexus केवल 14 प्रमाणित फसलों के लिए सत्यापित है। सुरक्षा कारणों से इसके लिए रासायनिक कीटनाशक लॉक हैं। "
                        f"प्रभावित पत्तियों को छांटें और खेत साफ रखें। प्रमाणित विनिर्देशों और उपचार के लिए अपने नजदीकी कृषि विज्ञान केंद्र '{kvk_name_str}' ({kvk_dist_str}) से संपर्क करें।"
                    )
                elif language_code == "pa":
                    return (
                        f"ਕਿਸਾਨ ਵੀਰੋ, ਸਾਡੇ ਆਨ-ਡਿਵਾਈਸ ਮਾਡਲ ਦੁਆਰਾ ਪਛਾਣ ਨਾ ਹੋਣ 'ਤੇ Gemini AI ਦੁਆਰਾ ਇਸ ਪੌਦੇ ਦੀ ਪਛਾਣ '{detected_subj}' ({vision_diagnosis}) ਵਜੋਂ ਕੀਤੀ ਗਈ ਹੈ। "
                        f"ਖੇਤ ਦਾ ਮੌਸਮ: ਤਾਪਮਾਨ {temperature}°C, ਨਮੀ {humidity}%, ਹਵਾ {wind_speed} km/h ਅਤੇ ਹਵਾ ਗੁਣਵੱਤਾ ਸੂਚਕਾਂਕ AQI {aqi} ({aqi_label}) ਹੈ। "
                        f"ਕਿਰਪਾ ਕਰਕੇ ਧਿਆਨ ਦਿਓ: AgriNexus ਸਿਰਫ 14 ਪ੍ਰਮਾਣਿਤ ਫਸਲਾਂ ਲਈ ਪ੍ਰਮਾਣਿਤ ਹੈ। ਸੁਰੱਖਿਆ ਕਾਰਨਾਂ ਕਰਕੇ ਰਸਾਇਣਕ ਕੀਟਨਾਸ਼ਕ ਲਾਕ ਹਨ। "
                        f"ਪ੍ਰਭਾਵਿਤ ਪੱਤਿਆਂ ਦੀ ਛੰਗਾਈ ਕਰੋ। ਪ੍ਰਮਾਣਿਤ ਇਲਾਜ ਲਈ ਆਪਣੇ ਨਜ਼ਦੀਕੀ ਕ੍ਰਿਸ਼ੀ ਵਿਗਿਆਨ ਕੇਂਦਰ '{kvk_name_str}' ({kvk_dist_str}) ਨਾਲ ਸੰਪਰਕ ਕਰੋ।"
                    )
                elif language_code == "te":
                    return (
                        f"రైతు సోదరులారా, ఆన్-డివైస్ మోడల్ గుర్తించలేకపోవడంతో Gemini AI ద్వారా ఈ మొక్క '{detected_subj}' ({vision_diagnosis}) గా గుర్తించబడింది. "
                        f"వాతావరణం: ఉష్ణోగ్రత {temperature}°C, తేమ {humidity}%, గాలి {wind_speed} km/h, AQI {aqi} ({aqi_label}). "
                        f"AgriNexus 14 ధృవీకరించబడిన పంటలకే మద్దతు ఇస్తుంది. భద్రత దృష్ట్యా రసాయనాలు లాక్ చేయబడ్డాయి. "
                        f"సమీపంలోని కృషి విజ్ఞాన కేంద్రం '{kvk_name_str}' ({kvk_dist_str}) ను సంప్రదించండి."
                    )
                elif language_code == "ta":
                    return (
                        f"விவசாய சகோதரர்களே, Gemini AI மூலம் இந்த பயிர் '{detected_subj}' ({vision_diagnosis}) என அடையாளம் காணப்பட்டுள்ளது. "
                        f"வானிலை: வெப்பநிலை {temperature}°C, ஈரப்பதம் {humidity}%, காற்று {wind_speed} km/h, AQI {aqi} ({aqi_label}). "
                        f"பாதுகாப்பு கருதி ரசாயனங்கள் பூட்டப்பட்டுள்ளன. அருகிலுள்ள வேளாண் அறிவியல் மையம் '{kvk_name_str}' ({kvk_dist_str}) அணுகவும்."
                    )
                elif language_code == "mr":
                    return (
                        f"शेतकरी मित्रांनो, Gemini AI द्वारे या पिकाची ओळख '{detected_subj}' ({vision_diagnosis}) अशी झाली आहे. "
                        f"हवामान: तापमान {temperature}°C, आर्द्रता {humidity}%, वारा {wind_speed} km/h, AQI {aqi} ({aqi_label}). "
                        f"सुरक्षेसाठी रासायनिक फवारणी लॉक केली आहे. जवळच्या कृषी विज्ञान केंद्र '{kvk_name_str}' ({kvk_dist_str}) शी संपर्क साधा."
                    )
                elif language_code == "bn":
                    return (
                        f"কৃষক ভাইয়েরা, Gemini AI দ্বারা এই গাছটি '{detected_subj}' ({vision_diagnosis}) হিসাবে চিহ্নিত হয়েছে। "
                        f"আবহাওয়া: তাপমাত্রা {temperature}°C, আর্দ্রতা {humidity}%, বাতাস {wind_speed} km/h, AQI {aqi} ({aqi_label})। "
                        f"নিরাপত্তার কারণে রাসায়নিক স্প্রে লক করা হয়েছে। নিকটস্থ কৃষি বিজ্ঞান কেন্দ্র '{kvk_name_str}' ({kvk_dist_str}) এ যোগাযোগ করুন।"
                    )
                elif language_code == "gu":
                    return (
                        f"ખેડૂત મિત્રો, Gemini AI દ્વારા આ છોડની ઓળખ '{detected_subj}' ({vision_diagnosis}) તરીકે થઈ છે. "
                        f"હવામાન: તાપમાન {temperature}°C, ભેજ {humidity}%, પવન {wind_speed} km/h, AQI {aqi} ({aqi_label}). "
                        f"સુરક્ષા માટે દવાઓ લૉક કરેલ છે. નજીકના કૃષિ વિજ્ઞાન કેન્દ્ર '{kvk_name_str}' ({kvk_dist_str}) નો સંપર્ક કરો."
                    )
                elif language_code == "kn":
                    return (
                        f"ರೈತ ಮಿತ್ರರೇ, Gemini AI ಮೂಲಕ ಈ ಬೆಳೆ '{detected_subj}' ({vision_diagnosis}) ಎಂದು ಗುರುತಿಸಲಾಗಿದೆ. "
                        f"ಹವಾಮಾನ: ತಾಪಮಾನ {temperature}°C, ತೇವಾಂಶ {humidity}%, ಗಾಳಿ {wind_speed} km/h, AQI {aqi} ({aqi_label}). "
                        f"ಸುರಕ್ಷತೆಗಾಗಿ ರಾಸಾಯನಿಕಗಳನ್ನು ಲಾಕ್ ಮಾಡಲಾಗಿದೆ. ಹತ್ತಿರದ ಕೃಷಿ ವಿಜ್ಞಾನ ಕೇಂದ್ರ '{kvk_name_str}' ({kvk_dist_str}) ಸಂಪರ್ಕಿಸಿ."
                    )
                elif language_code == "ml":
                    return (
                        f"കർഷക സുഹൃത്തുക്കളെ, Gemini AI വഴി ഈ ചെടി '{detected_subj}' ({vision_diagnosis}) ആയി തിരിച്ചറിഞ്ഞു. "
                        f"കാലാവസ്ഥ: താപനില {temperature}°C, ഈർപ്പം {humidity}%, കാറ്റ് {wind_speed} km/h, AQI {aqi} ({aqi_label}). "
                        f"സുരക്ഷ മുൻനിർത്തി രാസവസ്തുക്കൾ പൂട്ടിയിരിക്കുന്നു. അടുത്തുള്ള കൃഷി വിജ്ഞാൻ കേന്ദ്രം '{kvk_name_str}' ({kvk_dist_str}) ബന്ധപ്പെടുക."
                    )
                elif language_code == "od":
                    return (
                        f"କୃଷକ ଭାଇମାନେ, Gemini AI ଦ୍ୱାରା ଏହି ଗଛଟି '{detected_subj}' ({vision_diagnosis}) ଭାବେ ଚିହ୍ନଟ ହୋଇଛି। "
                        f"ପାଣିପାଗ: ତାପମାତ୍ରା {temperature}°C, ଆର୍ଦ୍ରତା {humidity}%, ପବନ {wind_speed} km/h, AQI {aqi} ({aqi_label})। "
                        f"ସୁରକ୍ଷା ପାଇଁ କୌଣସି ରାସାୟନିକ ସ୍ପ୍ରେ ଲକ୍ ଅଛି। ନିକଟସ୍ଥ କୃଷି ବିଜ୍ଞାନ କେନ୍ଦ୍ର '{kvk_name_str}' ({kvk_dist_str}) ସହିତ ଯୋଗାଯୋଗ କରନ୍ତୁ।"
                    )
                else:
                    return (
                        f"Dear Farmer, identified via Gemini AI fallback as {detected_subj} ({vision_diagnosis}). "
                        f"Current weather: {temperature}°C, humidity {humidity}%, wind {wind_speed} km/h, and Air Quality Index AQI {aqi} ({aqi_label}). "
                        f"AgriNexus is certified for 14 main crops; chemical recommendations are locked for safety. "
                        f"Please maintain cultural sanitation and visit nearest KVK '{kvk_name_str}' ({kvk_dist_str}) for certified specifications."
                    )
            elif language_code == "hi":
                return f"किसान भाई, यह फोटो {detected_subj} की प्रतीत होती है, जो AgriNexus की 14 समर्थित मुख्य कृषि फसलों (जैसे टमाटर, आलू, मक्का, सेब, स्ट्रॉबेरी) में से नहीं है। गैर-लक्षित पौधों पर रासायनिक दवाइयों का छिड़काव वर्जित है। कृपया समर्थित फसल की पत्ती का स्पष्ट फोटो अपलोड करें।"
            elif language_code == "pa":
                return f"ਕਿਸਾਨ ਵੀਰੋ, ਇਹ ਫੋਟੋ {detected_subj} ਦੀ ਜਾਪਦੀ ਹੈ, ਜੋ AgriNexus ਦੀਆਂ 14 ਪ੍ਰਮਾਣਿਤ ਖੇਤੀਬਾੜੀ ਫਸਲਾਂ ਵਿੱਚੋਂ ਨਹੀਂ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਕਿਸੇ ਵੀ ਰਸਾਇਣ ਦਾ ਛਿੜਕਾਅ ਨਾ ਕਰੋ ਅਤੇ ਪ੍ਰਮਾਣਿਤ ਫਸਲ ਦੇ ਪੱਤੇ ਦੀ ਫੋਟੋ ਅਪਲੋਡ ਕਰੋ।"
            else:
                return f"Dear Farmer, this image appears to be {detected_subj}, which is not among AgriNexus's 14 supported agricultural food crops. Chemical application is prohibited on non-target plants. Please upload a clear photo of a supported crop leaf."
        elif not is_safe:
            if language_code == "pa":
                return f"ਕਿਸਾਨ ਵੀਰੋ, ਤੁਹਾਡੀ ਫਸਲ ਵਿੱਚ {localized_disease} ਦੇ ਲੱਛਣ ਮਿਲੇ ਹਨ। ਫਸਲ ਦੀ ਸੁਰੱਖਿਆ ਲਈ ਕਿਸੇ ਵੀ ਦਵਾਈ ਦਾ ਛਿੜਕਾਅ ਨਾ ਕਰੋ। ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੇ ਨਜ਼ਦੀਕੀ ਕ੍ਰਿਸ਼ੀ ਵਿਗਿਆਨ ਕੇਂਦਰ '{kvk_name_str}' ({kvk_dist_str} ਦੂਰ) ਵਿਖੇ ਮਾਹਿਰਾਂ ਨਾਲ ਸੰਪਰਕ ਕਰੋ।"
            elif language_code == "te":
                return f"రైతు సోదరులారా, మీ పంటలో {localized_disease} లక్షణాలు ఉన్నాయి. రక్షణ దృష్ట్యా ఎటువంటి రసాయనాన్ని పిచికారీ చేయవద్దు. దయచేసి మీ సమీపంలోని కృషి విజ్ఞాన కేంద్రం '{kvk_name_str}' ({kvk_dist_str} దూరం) ను సంప్రదించండి."
            elif language_code == "ta":
                return f"விவசாய சகோதரர்களே, உங்கள் பயிரில் {localized_disease} அறிகுறிகள் உள்ளன. ரசாயனங்களை தெளிக்க வேண்டாம். அருகிலுள்ள வேளாண் அறிவியல் மையம் '{kvk_name_str}' ({kvk_dist_str} தொலைவு) அணுகவும்."
            elif language_code == "ml":
                return f"കർഷക സുഹൃത്തുക്കളെ, നിങ്ങളുടെ വിളയിൽ {localized_disease} ലക്ഷണങ്ങൾ കാണുന്നു. ദയവായി രാസവസ്തുക്കൾ തളിക്കരുത്. അടുത്തുള്ള കൃഷി വിജ്ഞാൻ കേന്ദ്രം '{kvk_name_str}' ({kvk_dist_str} ദൂരം) ബന്ധപ്പെടുക."
            elif language_code == "mr":
                return f"शेतकरी मित्रांनो, तुमच्या पिकात {localized_disease} लक्षणे दिसत आहेत. पिकाच्या सुरक्षेसाठी फवारणी करू नका. जवळच्या कृषी विज्ञान केंद्र '{kvk_name_str}' ({kvk_dist_str} अंतरावर) शी संपर्क साधा."
            elif language_code == "bn":
                return f"কৃষক ভাইয়েরা, আপনার ফসলে {localized_disease} এর লক্ষণ দেখা গেছে। কোনও রাসায়নিক স্প্রে করবেন না। নিকটস্থ কৃষি বিজ্ঞান কেন্দ্র '{kvk_name_str}' ({kvk_dist_str} দূরে) যোগাযোগ করুন।"
            elif language_code == "gu":
                return f"ખેડૂત મિત્રો, તમારા પાકમાં {localized_disease} ના લક્ષણો જોવા મળ્યા છે. છંટકાવ ન કરો અને નજીકના કૃષિ વિજ્ઞાન કેન્દ્ર '{kvk_name_str}' ({kvk_dist_str} દૂર) નો સંપર્ક કરો."
            elif language_code == "kn":
                return f"ರೈತ ಮಿತ್ರರೇ, ನಿಮ್ಮ ಬೆಳೆಯಲ್ಲಿ {localized_disease} ಲಕ್ಷಣಗಳು ಕಂಡುಬಂದಿವೆ. ಯಾವುದೇ ರಾಸಾಯನಿಕ ಸಿಂಪಡಿಸಬೇಡಿ. ಹತ್ತಿರದ ಕೃಷಿ ವಿಜ್ಞಾನ ಕೇಂದ್ರ '{kvk_name_str}' ({kvk_dist_str} ದೂರ) ಸಂಪರ್ಕಿಸಿ."
            elif language_code == "od":
                return f"କୃଷକ ଭାଇମାନେ, ଆପଣଙ୍କ ଫସଲରେ {localized_disease} ର ଲକ୍ଷଣ ଦେଖାଯାଇଛି। କୌଣସି ରାସାୟନିକ ସ୍ପ୍ରେ କରନ୍ତୁ ନାହିଁ। ନିକଟସ୍ଥ କୃଷି ବିଜ୍ଞାନ କେନ୍ଦ୍ର '{kvk_name_str}' ({kvk_dist_str} ଦୂର) ସହିତ ଯୋଗାଯୋଗ କରନ୍ତୁ।"
            elif language_code == "en":
                return english_text
            else:
                return f"किसान भाई, आपकी फसल में {localized_disease} के लक्षण दिखे हैं। फसल सुरक्षा हेतु किसी रसायन का छिड़काव न करें। कृपया अपने नजदीकी कृषि विज्ञान केंद्र '{kvk_name_str}' ({kvk_dist_str} दूर) से संपर्क करें।"
        else:
            # Safe Case: Fact-grounded weather interlocks in fallback Indic dialects
            if not is_live_weather:
                if language_code == "pa":
                    return f"ਕਿਸਾਨ ਵੀਰੋ, ਸਾਵਧਾਨੀ: ਇੰਟਰਨੈੱਟ ਨਾ ਹੋਣ ਕਰਕੇ ਲਾਈਵ ਮੌਸਮ ਨਹੀਂ ਮਿਲ ਸਕਿਆ, ਛਿੜਕਾਅ ਤੋਂ ਪਹਿਲਾਂ ਮੀਂਹ ਅਤੇ ਤੇਜ਼ ਹਵਾ ਨਾ ਹੋਣ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ। ਫਸਲ ਵਿੱਚ {localized_disease} ਦੇ ਇਲਾਜ ਲਈ {proposed_chemical} ਦਾ {safe_dosage} {unit} ਪ੍ਰਤੀ ਏਕੜ 200 ਲੀਟਰ ਪਾਣੀ ਵਿੱਚ ਘੋਲ ਕੇ ਛਿੜਕਾਅ ਕਰੋ।"
                elif language_code == "te":
                    return f"రైతు సోదరులారా, హెచ్చరిక: ಇಂಟರ್ನೆట్ లేకపోవడం వల్ల ప్రత్యక్ష వాతావరణం పొందలేకపోయాము, వర్షం లేదని నిర్ధారించుకోండి. పంటలో {localized_disease} నివారణకు {proposed_chemical} మందును ఎకరానికి {safe_dosage} {unit} మోతాదులో 200 లీటర్ల నీటిలో కలిపి పిచికారీ చేయండి."
                elif language_code == "ta":
                    return f"விவசாய சகோதரர்களே, எச்சரிக்கை: நேரடி வானிலை கிடைக்கவில்லை. மழை மற்றும் பலத்த காற்று இல்லை என்பதை உறுதிப்படுத்தவும். {localized_disease} சிகிச்சைக்கு ஒரு ஏக்கருக்கு {safe_dosage} {unit} {proposed_chemical} மருந்தை 200 லிட்டர் தண்ணீரில் கலந்து தெளிக்கவும்."
                elif language_code == "ml":
                    return f"കർഷക സുഹൃത്തുക്കളെ, തത്സമയ കാലാവസ്ഥ ലഭ്യമല്ല. മഴയും കാറ്റും ഇല്ലെന്ന് ഉറപ്പാക്കുക. {localized_disease} ചികിത്സയ്ക്കായി ഏക്കറിന് {safe_dosage} {unit} തോതിൽ {proposed_chemical} 200 ലിറ്റർ വെള്ളത്തിൽ കലക്കി തളിക്കുക."
                elif language_code == "mr":
                    return f"शेतकरी मित्रांनो, थेट हवामान उपलब्ध नाही, पाऊस किंवा वादळ नाही याची खात्री करा. पिकातील {localized_disease} च्या नियंत्रणासाठी {proposed_chemical} {safe_dosage} {unit} प्रति एकर २०० लिटर पाण्यात मिसळून फवारा."
                elif language_code == "bn":
                    return f"কৃষক ভাইয়েরা, লাইভ আবহাওয়া পাওয়া যায়নি, বৃষ্টির সম্ভাবনা নেই তা নিশ্চিত করুন। {localized_disease} নিরাময়ের জন্য প্রতি একরে {safe_dosage} {unit} {proposed_chemical} ২০০ লিটার পরিষ্কার জলে মিশিয়ে স্প্রে করুন।"
                elif language_code == "gu":
                    return f"ખેડૂત મિત્રો, હવામાન ઉપલબ્ધ નથી, વરસાદ કે પવન નથી તેની ખાતરી કરો. {localized_disease} ના નિયંત્રણ માટે એકર દીઠ {safe_dosage} {unit} {proposed_chemical} ૨૦૦ લિટર પાણીમાં ભેળવીને છંટકાવ કરો."
                elif language_code == "kn":
                    return f"ರೈತ ಮಿತ್ರರೇ, ನೇರ ಹವಾಮಾನ ಲಭ್ಯವಿಲ್ಲ, ಮಳೆಯಿಲ್ಲ ಎಂದು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ. {localized_disease} ನಿಯಂತ್ರಣಕ್ಕಾಗಿ ಪ್ರತಿ ಎಕರೆಗೆ {safe_dosage} {unit} {proposed_chemical} ಅನ್ನು 200 ಲೀಟರ್ ನೀರಿನಲ್ಲಿ ಬೆರೆಸಿ ಸಿಂಪಡಿಸಿ."
                elif language_code == "od":
                    return f"କୃଷକ ଭାଇମାନେ, ଲାଇଭ ପାଣିପାଗ ଉପଲବ୍ଧ ନାହିଁ, ବର୍ଷା ନାହିଁ ବୋଲି ନିଶ୍ଚିତ କରନ୍ତୁ। {localized_disease} ର ନିରାକରଣ ପାଇଁ ଏକର ପ୍ରତି {safe_dosage} {unit} {proposed_chemical} କୁ ୨୦୦ ଲିଟର ପାଣିରେ ମିଶାଇ ସ୍ପ୍ରେ କରନ୍ତୁ।"
                elif language_code == "en":
                    return english_text
                else:
                    return f"किसान भाई, सावधानी: मौसम डेटा अनुपलब्ध होने के कारण छिड़काव से पहले बारिश न होने की पुष्टि करें। फसल में {localized_disease} के उपचार हेतु {proposed_chemical} की {safe_dosage} {unit} प्रति एकड़ २०० लीटर पानी में घोलकर छिड़काव करें।"
            elif is_rain_hazard or is_wind_hazard or is_aqi_hazard:
                if language_code == "pa":
                    return f"ਕਿਸਾਨ ਵੀਰੋ, ਅੱਜ ਦਵਾਈ ਦਾ ਛਿੜਕਾਅ ਬਿਲਕੁਲ ਨਾ ਕਰੋ! ਗੰਭੀਰ ਚੇਤਾਵਨੀ: {', '.join(weather_hazard_notes)}। ਮੌਸਮ ਖ਼ਰਾਬ ਹੋਣ ਕਾਰਨ ਦਵਾਈ ਵਹਿ ਜਾਵੇਗੀ ਜਾਂ ਜ਼ਹਿਰੀਲੀ ਹੋ ਸਕਦੀ ਹੈ। ਮੌਸਮ ਸਾਫ਼ ਹੋਣ ਦੀ ਉਡੀਕ ਕਰੋ।"
                elif language_code == "te":
                    return f"రైతు సోదరులారా, ఈ రోజు పిచికారీ చేయవద్దు! తీవ్ర హెచ్చరిక: {', '.join(weather_hazard_notes)}. వాతావరణం అనుకూలించే వరకు వేచి ఉండండి."
                elif language_code == "ta":
                    return f"விவசாய சகோதரர்களே, இன்று தெளிக்க வேண்டாம்! எச்சரிக்கை: {', '.join(weather_hazard_notes)}. வானிலை சீராகும் வரை காத்திருக்கவும்."
                elif language_code == "ml":
                    return f"കർഷക സുഹൃത്തുക്കളെ, ഇന്ന് തളിക്കരുത്! മുന്നറിയിപ്പ്: {', '.join(weather_hazard_notes)}. കാലാവസ്ഥ അനുകൂലമാകുന്നതുവരെ കാത്തിരിക്കുക."
                elif language_code == "mr":
                    return f"शेतकरी मित्रांनो, आज फवारणी करू नका! धोक्याचा इशारा: {', '.join(weather_hazard_notes)}. हवामान स्वच्छ होण्याची वाट पहा."
                elif language_code == "bn":
                    return f"কৃষক ভাইয়েরা, আজ স্প্রে করবেন না! সতর্কতা: {', '.join(weather_hazard_notes)}। আবহাওয়া পরিষ্কার হওয়া পর্যন্ত অপেক্ষা করুন।"
                elif language_code == "gu":
                    return f"ખેડૂત મિત્રો, આજે છંટકાવ કરશો નહીં! ચેતવણી: {', '.join(weather_hazard_notes)}. હવામાન સુધરે ત્યાં સુધી રાહ જુઓ."
                elif language_code == "kn":
                    return f"ರೈತ ಮಿತ್ರರೇ, ಇಂದು ಸಿಂಪಡಿಸಬೇಡಿ! ಎಚ್ಚರಿಕೆ: {', '.join(weather_hazard_notes)}. ಹವಾಮಾನ ಸರಿಯಾಗುವವರೆಗೆ ಕಾಯಿರಿ."
                elif language_code == "od":
                    return f"କୃଷକ ଭାଇମାନେ, ଆଜି ସ୍ପ୍ରେ କରନ୍ତୁ ନାହିଁ! ଚେତାବନୀ: {', '.join(weather_hazard_notes)}। ପାଣିପାଗ ସଫା ହେବା ପର୍ଯ୍ୟନ୍ତ ଅପେକ୍ଷା କରନ୍ତୁ।"
                elif language_code == "en":
                    return english_text
                else:
                    return f"किसान भाई, आज रासायनिक छिड़काव न करें और स्थगित करें! मौसम/प्रदूषण चेतावनी: {', '.join(weather_hazard_notes)}। प्रतिकूल वायुमंडल में छिड़काव से दवा धुल जाएगी या जहरीली गैस बन सकती है। मौसम साफ होने की प्रतीक्षा करें।"
            elif is_heat_hazard:
                if language_code == "pa":
                    return f"ਕਿਸਾਨ ਵੀਰੋ, ਖੇਤ ਵਿੱਚ ਬਹੁਤ ਜ਼ਿਆਦਾ ਗਰਮੀ ({temperature}°C) ਹੈ। ਦੁਪਹਿਰ ਵੇਲੇ ਛਿੜਕਾਅ ਨਾ ਕਰੋ, ਪੱਤੇ ਸੜ ਸਕਦੇ ਹਨ। {proposed_chemical} ਦਾ ਛਿੜਕਾਅ ਸਵੇਰੇ 8 ਵਜੇ ਤੋਂ ਪਹਿਲਾਂ ਜਾਂ ਸ਼ਾਮ ਨੂੰ 6 ਵਜੇ ਤੋਂ ਬਾਅਦ ਹੀ ਕਰੋ।"
                elif language_code == "te":
                    return f"రైతు సోదరులారా, తీవ్రమైన ఎండ ({temperature}°C) ఉంది. మధ్యాహ్నం పిచికారీ చేయవద్దు. తెల్లవారుజామున 8 గంటల లోపు లేదా సాయంత్రం 6 గంటల తర్వాత మాత్రమే పిచికారీ చేయండి."
                elif language_code == "ta":
                    return f"விவசாய சகோதரர்களே, அதிக வெப்பம் ({temperature}°C). நண்பகலில் தெளிக்க வேண்டாம். காலை 8 மணிக்குள் அல்லது மாலை 6 மணிக்கு பிறகு தெளிக்கவும்."
                elif language_code == "ml":
                    return f"കർഷക സുഹൃത്തുക്കളെ, കഠിനമായ ചൂട് ({temperature}°C). ഉച്ചയ്ക്ക് തളിക്കരുത്. രാവിലെ 8 മണിക്ക് മുൻപോ വൈകുന്നേരം 6 മണിക്ക് ശേഷമോ മാത്രം തളിക്കുക."
                elif language_code == "mr":
                    return f"शेतकरी मित्रांनो, अतिउष्णता ({temperature}°C) असल्यामुळे दुपारी फवारणी करू नका. सकाळी ८ च्या आधी किंवा संध्याकाळी ६ नंतरच फवारणी करा."
                elif language_code == "bn":
                    return f"কৃষক ভাইয়েরা, অতিরিক্ত তাপমাত্রার ({temperature}°C) কারণে দুপুরে স্প্রে করবেন না। সকাল ৮টার আগে বা সন্ধ্যা ৬টার পরে স্প্রে করুন।"
                elif language_code == "gu":
                    return f"ખેડૂત મિત્રો, ભારે ગરમી ({temperature}°C) હોવાથી બપોરે છંટકાવ ન કરવો. સવારે ૮ વાગ્યા પહેલા અથવા સાંજે ૬ વાગ્યા પછી જ છંટકાવ કરવો."
                elif language_code == "kn":
                    return f"ರೈತ ಮಿತ್ರರೇ, ಅತಿಯಾದ ತಾಪಮಾನ ({temperature}°C). ಮಧ್ಯಾಹ್ನ ಸಿಂಪಡಿಸಬೇಡಿ. ಬೆಳಗ್ಗೆ 8 ರ ಒಳಗೆ ಅಥವಾ ಸಂಜೆ 6 ರ ನಂತರ ಸಿಂಪಡಿಸಿ."
                elif language_code == "od":
                    return f"କୃଷକ ଭାଇମାନେ, ପ୍ରବଳ ଖରା ({temperature}°C) ହେତୁ ଦ୍ୱିପ୍ରହରରେ ସ୍ପ୍ରେ କରନ୍ତୁ ନାହିଁ। ସକାଳ ୮ ପୂର୍ବରୁ କିମ୍ବା ସନ୍ଧ୍ୟା ୬ ପରେ ସ୍ପ୍ରେ କରନ୍ତୁ।"
                elif language_code == "en":
                    return english_text
                else:
                    return f"किसान भाई, दोपहर की तेज धूप और गर्मी ({temperature}°C) में छिड़काव न करें, पत्तियां झुलस सकती हैं। {proposed_chemical} का छिड़काव केवल सुबह ८ बजे से पहले या शाम ६ बजे के बाद ही करें।"
            else:
                if language_code == "pa":
                    return f"ਕਿਸਾਨ ਵੀਰੋ, ਖੇਤ ਦਾ ਮੌਸਮ ਅਨੁਕੂਲ ਹੈ (ਤਾਪਮਾਨ {temperature}°C, ਨਮੀ {humidity}%, ਹਵਾ {wind_speed} km/h, AQI {aqi})। ਫਸਲ ਵਿੱਚ {localized_disease} ਦੇ ਇਲਾਜ ਲਈ {proposed_chemical} ਦੀ {safe_dosage} {unit} ਪ੍ਰਤੀ ਏਕੜ 200 ਲੀਟਰ ਪਾਣੀ ਵਿੱਚ ਘੋਲ ਕੇ ਸਵੇਰੇ ਜਾਂ ਸ਼ਾਮ ਨੂੰ ਛਿੜਕਾਅ ਕਰੋ।"
                elif language_code == "te":
                    return f"రైతు సోదరులారా, మీ పొలంలో వాతావరణం అనుకూలంగా ఉంది (ఉష్ణోగ్రత {temperature}°C, తేమ {humidity}%, గాలి {wind_speed} km/h, AQI {aqi})। పంటలో {localized_disease} నివారణకు ఎకరానికి {safe_dosage} {unit} {proposed_chemical} మందును 200 లీటర్ల నీటిలో కలిపి పిచికారీ చేయండి."
                elif language_code == "ta":
                    return f"விவசாய சகோதரர்களே, உங்கள் பகுதியில் வானிலை சாதகமாக உள்ளது (வெப்பநிலை {temperature}°C, ஈரப்பதம் {humidity}%, காற்று {wind_speed} km/h, AQI {aqi})। {localized_disease} நோயைக் கட்டுப்படுத்த ஒரு ஏக்கருக்கு {safe_dosage} {unit} {proposed_chemical} மருந்தை 200 லிட்டர் தண்ணீரில் கலந்து தெளிக்கவும்."
                elif language_code == "ml":
                    return f"കർഷക സുഹൃത്തുക്കളെ, കാലാവസ്ഥ അനുകൂലമാണ് (താപനില {temperature}°C, ഈർപ്പം {humidity}%, കാറ്റ് {wind_speed} km/h, AQI {aqi})। {localized_disease} നിയന്ത്രണത്തിനായി ഏക്കറിന് {safe_dosage} {unit} തോതിൽ {proposed_chemical} 200 ലിറ്റർ വെള്ളത്തിൽ കലക്കി തളിക്കുക."
                elif language_code == "mr":
                    return f"शेतकरी मित्रांनो, शेतातील हवामान अनुकूल आहे (तापमान {temperature}°C, आर्द्रता {humidity}%, वारा {wind_speed} km/h, AQI {aqi})। पिकातील {localized_disease} च्या नियंत्रणासाठी {proposed_chemical} {safe_dosage} {unit} प्रति एकर २०० लिटर पाण्यात मिसळून फवारा."
                elif language_code == "bn":
                    return f"কৃষক ভাইয়েরা, আপনার জমির আবহাওয়া অনুকূল (तापমাত্রা {temperature}°C, আর্দ্রতা {humidity}%, বাতাস {wind_speed} km/h, AQI {aqi})। {localized_disease} নিরাময়ের জন্য প্রতি একরে {safe_dosage} {unit} {proposed_chemical} ২০০ লিটার পরিষ্কার জলে মিশিয়ে স্প্রে করুন।"
                elif language_code == "gu":
                    return f"ખેડૂત મિત્રો, ખેતરનું હવામાન અનુકૂળ છે (તાપમાન {temperature}°C, ભેજ {humidity}%, પવન {wind_speed} km/h, AQI {aqi})। {localized_disease} ના નિયંત્રણ માટે એકર દીઠ {safe_dosage} {unit} {proposed_chemical} ૨૦૦ લિટર પાણીમાં ભેળવીને છંટકાવ કરો."
                elif language_code == "kn":
                    return f"ರೈತ ಮಿತ್ರರೇ, ನಿಮ್ಮ ಹೊಲದಲ್ಲಿ ಹವಾಮಾನ ಅನುಕೂಲಕರವಾಗಿದೆ (ತಾಪಮಾನ {temperature}°C, ತೇವಾಂಶ {humidity}%, ಗಾಳಿ {wind_speed} km/h, AQI {aqi})। {localized_disease} ನಿಯಂತ್ರಣಕ್ಕಾಗಿ ಪ್ರತಿ ಎಕರೆಗೆ {safe_dosage} {unit} {proposed_chemical} ಅನ್ನು 200 ಲೀಟರ್ ನೀರಿನಲ್ಲಿ ಬೆರೆಸಿ ಸಿಂಪಡಿಸಿ."
                elif language_code == "od":
                    return f"କୃଷକ ଭାଇମାନେ, ଆପଣଙ୍କ ଜମିରେ ପାଣିପାଗ ଅନୁକୂଳ ଅଛି (ତାପମାତ୍ରା {temperature}°C, ଆର୍ଦ୍ରତା {humidity}%, ପବନ {wind_speed} km/h, AQI {aqi})। {localized_disease} ର ନିରାକରଣ ପାଇଁ ଏକର ପ୍ରତି {safe_dosage} {unit} {proposed_chemical} କୁ ୨୦୦ ଲିଟର ପାଣିରେ ମିଶାଇ ସ୍ପ୍ରେ କରନ୍ତୁ।"
                elif language_code == "en":
                    return english_text
                else:
                    return f"किसान भाई, आपके खेत का मौसम अनुकूल है (तापमान {temperature}°C, आर्द्रता {humidity}%, हवा {wind_speed} km/h, वायु गुणवत्ता AQI {aqi} - {aqi_label})। फसल में {localized_disease} के उपचार हेतु {proposed_chemical} की {safe_dosage} {unit} प्रति एकड़ २०० लीटर पानी में घोलकर सुबह या शाम को छिड़काव करें।"

    try:
        api_key = os.environ.get("GOOGLE_API_KEY")
        if api_key and api_key != "your_google_api_key_here":
            prompt = f"""You are an expert senior agricultural scientist (Agronomist) advising an Indian farmer in their native language.
            
Translate and adapt the following agricultural advisory into natural, fluent, and highly detailed colloquial {target_language} (written in {target_script} script).

IMPORTANT INSTRUCTIONS:
1. Respectful Greeting (e.g. '{lang_meta["greeting"]}').
2. Maintain all exact metrics and readings: temperature ({temperature}°C), humidity ({humidity}%), wind speed ({wind_speed} km/h), rain probability ({rain_risk}%), and Air Quality Index (AQI {aqi} - {aqi_label}).
3. Maintain all agronomic and safety advice: mention the detected crop, diagnosis, practical care steps, note clearly that this identification is from Gemini AI fallback rather than on-device models, and the referral to {kvk_name_str}.
4. Respond strictly with plain text in {target_script} script with zero markdown headers, bullet points, JSON, or code quotes.

Advisory text: '{english_text}'"""
            
            gemini_models = ["gemini-flash-latest", "gemini-3.6-flash", "gemini-flash-lite-latest"]
            response = None
            for model_name in gemini_models:
                try:
                    llm = ChatGoogleGenerativeAI(model=model_name, google_api_key=api_key)
                    res = llm.invoke(prompt)
                    if res and res.content:
                        response = res
                        break
                except Exception as model_err:
                    print(f"[VOICE LLM] Model '{model_name}' failed: {model_err}")

            if not response or not response.content:
                raise RuntimeError("All Gemini models in voice cascade failed.")
            raw_content = response.content
            if isinstance(raw_content, list):
                parts = []
                for part in raw_content:
                    if isinstance(part, str):
                        parts.append(part)
                    elif isinstance(part, dict) and 'text' in part:
                        parts.append(part['text'])
                    elif hasattr(part, 'text'):
                        parts.append(part.text)
                    else:
                        parts.append(str(part))
                raw_content = "".join(parts)
            
            translated_text = clean_voice_text(str(raw_content))
            if not translated_text:
                translated_text = get_localized_fallback()
        else:
            translated_text = get_localized_fallback()
    except Exception as e:
        print(f"[VOICE LLM ERROR] {e}. Falling back to deterministic localized agronomic template...")
        translated_text = get_localized_fallback()

    # Final cleanup to guarantee zero JSON or dictionary artifacts reach TTS or frontend
    translated_text = clean_voice_text(translated_text)

    # Synthesize natural human acoustic speech using Sarvam AI Bulbul:v3
    audio_path = await tts_client.synthesize_speech(translated_text, language_code)

    res = {
        "vernacular_audio_url": audio_path,
        "translated_text": translated_text,
        "nearest_kvk": nearest_kvk
    }
    if not is_crop_supported:
        res["is_safe"] = False
        res["safety_warning"] = (
            f"Image identified as '{detected_subj}', which is not among AgriNexus's 14 certified agricultural food crops. "
            f"Chemical pesticide prescription is strictly blocked for biological safety. "
            f"For diagnostic assistance and certified specifications, visit nearest center: {kvk_name_str} ({kvk_dist_str} away)."
        )
    return res
