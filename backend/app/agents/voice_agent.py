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
    location_source = str(state.get("location_source", "regional_baseline")).upper()
    is_live_weather = state.get("is_live_weather", True) if "is_live_weather" in state else ("OFFLINE" not in location_source)

    lang_meta = LANGUAGE_INFO.get(language_code, LANGUAGE_INFO["hi"])
    target_language = lang_meta["name"]
    target_script = lang_meta["script"]
    localized_disease = get_localized_pathology(vision_diagnosis, language_code)

    # Nearest KVK Details
    nearest_kvk = state.get("nearest_kvk")
    kvk_name_str = nearest_kvk.get("name", "District Krishi Vigyan Kendra") if nearest_kvk else "District Krishi Vigyan Kendra"
    kvk_dist_str = f"{nearest_kvk.get('distance_km', 0.0)} km" if nearest_kvk else ""
    unit = state.get("dosage_unit", "ml" if "SC" in proposed_chemical or "EC" in proposed_chemical else "g")

    # Deterministic Meteorological Interlocks (Rain >= 35%, Wind >= 15 km/h, Heat >= 36°C)
    is_rain_hazard = (rain_risk >= 35)
    is_wind_hazard = (wind_speed >= 15.0)
    is_heat_hazard = (temperature >= 36.0)

    weather_hazard_notes = []
    if is_rain_hazard:
        weather_hazard_notes.append(f"High rain risk ({rain_risk}% in next 6h)")
    if is_wind_hazard:
        weather_hazard_notes.append(f"High wind velocity ({wind_speed} km/h)")
    if is_heat_hazard:
        weather_hazard_notes.append(f"Extreme heat ({temperature}°C)")

    is_crop_supported = state.get("is_crop_supported", True)
    detected_subj = state.get("detected_subject", "Non-Agricultural Subject")

    if not is_crop_supported:
        english_text = (
            f"Dear Farmer, the uploaded image appears to be {detected_subj}. "
            f"AgriNexus is certified specifically for 14 commercial agricultural food crops (Tomato, Potato, Corn, Apple, Grape, Strawberry, Pepper, Soybean, etc.). "
            f"Chemical application is strictly prohibited on non-target plants. "
            f"Please upload a clear close-up photo of a supported crop leaf."
        )
    elif not is_safe:
        english_text = (
            f"Dear Farmer, your crop shows foliar symptoms of {vision_diagnosis}. "
            f"However, chemical application cannot be approved safely. {safety_warning} "
            f"Please do not spray any unverified chemical to avoid crop damage. "
            f"Please consult your nearest extension center: {kvk_name_str} ({kvk_dist_str} away)."
        )
    else:
        # Safe Prescription: Construct data-driven weather advisory
        if not is_live_weather:
            weather_note = (
                "Caution: Live field weather could not be fetched due to lack of internet connection. "
                "Please visually verify there is no imminent rain or strong wind before spraying to prevent chemical wash-off."
            )
            english_text = (
                f"Dear Farmer, your crop is affected by {vision_diagnosis}. {weather_note} "
                f"For safe, certified treatment, spray {proposed_chemical} at an exact dosage of {safe_dosage} {unit} per acre, "
                f"thoroughly mixed in 200 liters of clean water on dry foliage."
            )
        elif is_rain_hazard or is_wind_hazard:
            hazard_str = " and ".join(weather_hazard_notes)
            english_text = (
                f"Dear Farmer, your crop is affected by {vision_diagnosis}. "
                f"The verified ICAR treatment is {proposed_chemical} at {safe_dosage} {unit} per acre mixed in 200 liters of clean water. "
                f"HOWEVER, DO NOT SPRAY TODAY. Critical weather alert: {hazard_str}. "
                f"Spraying now will cause severe chemical wash-off or hazardous drift into neighboring lands. "
                f"Please postpone spraying until weather conditions clear and winds calm."
            )
        elif is_heat_hazard:
            english_text = (
                f"Dear Farmer, your crop is affected by {vision_diagnosis}. "
                f"Warning: Extreme heat detected in your field ({temperature}°C). "
                f"Spraying in midday sun will cause acute foliar scorching and droplet evaporation. "
                f"For safe treatment, spray {proposed_chemical} at {safe_dosage} {unit} per acre in 200 liters of clean water, "
                f"STRICTLY during cool early morning hours before 8 AM or after 6 PM in the evening."
            )
        else:
            english_text = (
                f"Dear Farmer, your crop is affected by {vision_diagnosis}. "
                f"Current field weather is optimal ({temperature}°C, {humidity}% humidity, wind {wind_speed} km/h). Safe to spray. "
                f"For safe, certified treatment, spray {proposed_chemical} at an exact dosage of {safe_dosage} {unit} per acre, "
                f"thoroughly mixed in 200 liters of clean water during early morning or late evening."
            )

    try:
        api_key = os.environ.get("GOOGLE_API_KEY")
        if api_key and api_key != "your_google_api_key_here":
            llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=api_key)
            prompt = f"""You are an expert senior agricultural scientist (Agronomist) advising an Indian farmer in their native language.
            
Translate and refine the following in-depth agricultural advisory into natural, fluent, and highly detailed colloquial {target_language} (written in {target_script} script).

IMPORTANT INSTRUCTIONS:
1. Respectful Greeting (e.g. '{lang_meta["greeting"]}').
2. Maintain all exact numbers: dosages ({safe_dosage} {unit}), rain probability ({rain_risk}%), wind speed ({wind_speed} km/h), and temperature ({temperature}°C).
3. Weather Action: If instructed NOT to spray due to rain or wind, emphasize forcefully that the farmer MUST DELAY SPRAYING to prevent wasting costly chemicals. If instructed to spray only at dawn/dusk due to heat, state the warning clearly.
4. Respond strictly with the translated speech text in {target_script} script with zero markdown headers or bullet points.

Advisory text: '{english_text}'"""
            
            response = llm.invoke(prompt)
            translated_text = response.content.strip()
        else:
            # Dynamic high-depth, fully localized agronomic fallback templates with live weather and KVK
            if not is_crop_supported:
                if language_code == "hi":
                    translated_text = f"किसान भाई, यह फोटो {detected_subj} की प्रतीत होती है, जो AgriNexus की 14 समर्थित मुख्य कृषि फसलों (जैसे टमाटर, आलू, मक्का, सेब, स्ट्रॉबेरी) में से नहीं है। गैर-लक्षित पौधों पर रासायनिक दवाइयों का छिड़काव वर्जित है। कृपया समर्थित फसल की पत्ती का स्पष्ट फोटो अपलोड करें।"
                elif language_code == "pa":
                    translated_text = f"ਕਿਸਾਨ ਵੀਰੋ, ਇਹ ਫੋਟੋ {detected_subj} ਦੀ ਜਾਪਦੀ ਹੈ, ਜੋ AgriNexus ਦੀਆਂ 14 ਪ੍ਰਮਾਣਿਤ ਖੇਤੀਬਾੜੀ ਫਸਲਾਂ ਵਿੱਚੋਂ ਨਹੀਂ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਕਿਸੇ ਵੀ ਰਸਾਇਣ ਦਾ ਛਿੜਕਾਅ ਨਾ ਕਰੋ ਅਤੇ ਪ੍ਰਮਾਣਿਤ ਫਸਲ ਦੇ ਪੱਤੇ ਦੀ ਫੋਟੋ ਅਪਲੋਡ ਕਰੋ।"
                else:
                    translated_text = f"Dear Farmer, this image appears to be {detected_subj}, which is not among AgriNexus's 14 supported agricultural food crops. Chemical application is prohibited on non-target plants. Please upload a clear photo of a supported crop leaf."
            elif not is_safe:
                if language_code == "pa":
                    translated_text = f"ਕਿਸਾਨ ਵੀਰੋ, ਤੁਹਾਡੀ ਫਸਲ ਵਿੱਚ {localized_disease} ਦੇ ਲੱਛਣ ਮਿਲੇ ਹਨ। ਫਸਲ ਦੀ ਸੁਰੱਖਿਆ ਲਈ ਕਿਸੇ ਵੀ ਦਵਾਈ ਦਾ ਛਿੜਕਾਅ ਨਾ ਕਰੋ। ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੇ ਨਜ਼ਦੀਕੀ ਕ੍ਰਿਸ਼ੀ ਵਿਗਿਆਨ ਕੇਂਦਰ '{kvk_name_str}' ({kvk_dist_str} ਦੂਰ) ਵਿਖੇ ਮਾਹਿਰਾਂ ਨਾਲ ਸੰਪਰਕ ਕਰੋ।"
                elif language_code == "te":
                    translated_text = f"రైతు సోదరులారా, మీ పంటలో {localized_disease} లక్షణాలు ఉన్నాయి. రక్షణ దృష్ట్యా ఎటువంటి రసాయనాన్ని పిచికారీ చేయవద్దు. దయచేసి మీ సమీపంలోని కృషి విజ్ఞాన కేంద్రం '{kvk_name_str}' ({kvk_dist_str} దూరం) ను సంప్రదించండి."
                elif language_code == "ta":
                    translated_text = f"விவசாய சகோதரர்களே, உங்கள் பயிரில் {localized_disease} அறிகுறிகள் உள்ளன. ரசாயனங்களை தெளிக்க வேண்டாம். அருகிலுள்ள வேளாண் அறிவியல் மையம் '{kvk_name_str}' ({kvk_dist_str} தொலைவு) அணுகவும்."
                elif language_code == "ml":
                    translated_text = f"കർഷക സുഹൃത്തുക്കളെ, നിങ്ങളുടെ വിളയിൽ {localized_disease} ലക്ഷണങ്ങൾ കാണുന്നു. ദയവായി രാസവസ്തുക്കൾ തളിക്കരുത്. അടുത്തുള്ള കൃഷി വിജ്ഞാൻ കേന്ദ്രം '{kvk_name_str}' ({kvk_dist_str} ദൂരം) ബന്ധപ്പെടുക."
                elif language_code == "mr":
                    translated_text = f"शेतकरी मित्रांनो, तुमच्या पिकात {localized_disease} लक्षणे दिसत आहेत. पिकाच्या सुरक्षेसाठी फवारणी करू नका. जवळच्या कृषी विज्ञान केंद्र '{kvk_name_str}' ({kvk_dist_str} अंतरावर) शी संपर्क साधा."
                elif language_code == "bn":
                    translated_text = f"কৃষক ভাইয়েরা, আপনার ফসলে {localized_disease} এর লক্ষণ দেখা গেছে। কোনও রাসায়নিক স্প্রে করবেন না। নিকটস্থ কৃষি বিজ্ঞান কেন্দ্র '{kvk_name_str}' ({kvk_dist_str} দূরে) যোগাযোগ করুন।"
                elif language_code == "gu":
                    translated_text = f"ખેડૂત મિત્રો, તમારા પાકમાં {localized_disease} ના લક્ષણો જોવા મળ્યા છે. છંટકાવ ન કરો અને નજીકના કૃષિ વિજ્ઞાન કેન્દ્ર '{kvk_name_str}' ({kvk_dist_str} દૂર) નો સંપર્ક કરો."
                elif language_code == "kn":
                    translated_text = f"ರೈತ ಮಿತ್ರರೇ, ನಿಮ್ಮ ಬೆಳೆಯಲ್ಲಿ {localized_disease} ಲಕ್ಷಣಗಳು ಕಂಡುಬಂದಿವೆ. ಯಾವುದೇ ರಾಸಾಯನಿಕ ಸಿಂಪಡಿಸಬೇಡಿ. ಹತ್ತಿರದ ಕೃಷಿ ವಿಜ್ಞಾನ ಕೇಂದ್ರ '{kvk_name_str}' ({kvk_dist_str} ದೂರ) ಸಂಪರ್ಕಿಸಿ."
                elif language_code == "od":
                    translated_text = f"କୃଷକ ଭାଇମାନେ, ଆପଣଙ୍କ ଫସଲରେ {localized_disease} ର ଲକ୍ଷଣ ଦେଖାଯାଇଛି। କୌଣସି ରାସାୟନିକ ସ୍ପ୍ରେ କରନ୍ତୁ ନାହିଁ। ନିକଟସ୍ଥ କୃଷି ବିଜ୍ଞାନ କେନ୍ଦ୍ର '{kvk_name_str}' ({kvk_dist_str} ଦୂର) ସହିତ ଯୋଗାଯୋଗ କରନ୍ତୁ।"
                elif language_code == "en":
                    translated_text = english_text
                else:
                    # Default Hindi
                    translated_text = f"किसान भाई, आपकी फसल में {localized_disease} के लक्षण दिखे हैं। फसल सुरक्षा हेतु किसी रसायन का छिड़काव न करें। कृपया अपने नजदीकी कृषि विज्ञान केंद्र '{kvk_name_str}' ({kvk_dist_str} दूर) से संपर्क करें।"
            else:
                # Safe Case: Fact-grounded weather interlocks in fallback Indic dialects
                if not is_live_weather:
                    if language_code == "pa":
                        translated_text = f"ਕਿਸਾਨ ਵੀਰੋ, ਸਾਵਧਾਨੀ: ਇੰਟਰਨੈੱਟ ਨਾ ਹੋਣ ਕਰਕੇ ਲਾਈਵ ਮੌਸਮ ਨਹੀਂ ਮਿਲ ਸਕਿਆ, ਛਿੜਕਾਅ ਤੋਂ ਪਹਿਲਾਂ ਮੀਂਹ ਅਤੇ ਤੇਜ਼ ਹਵਾ ਨਾ ਹੋਣ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ। ਫਸਲ ਵਿੱਚ {localized_disease} ਦੇ ਇਲਾਜ ਲਈ {proposed_chemical} ਦਾ {safe_dosage} {unit} ਪ੍ਰਤੀ ਏਕੜ 200 ਲੀਟਰ ਪਾਣੀ ਵਿੱਚ ਘੋਲ ਕੇ ਛਿੜਕਾਅ ਕਰੋ।"
                    elif language_code == "te":
                        translated_text = f"రైతు సోదరులారా, హెచ్చరిక: ಇಂಟರ್నెట్ లేకపోవడం వల్ల ప్రత్యక్ష వాతావరణం పొందలేకపోయాము, వర్షం లేదని నిర్ధారించుకోండి. పంటలో {localized_disease} నివారణకు {proposed_chemical} మందును ఎకరానికి {safe_dosage} {unit} మోతాదులో 200 లీటర్ల నీటిలో కలిపి పిచికారీ చేయండి."
                    elif language_code == "en":
                        translated_text = english_text
                    else:
                        translated_text = f"किसान भाई, सावधानी: इंटरनेट न होने के कारण लाइव मौसम प्राप्त नहीं हो सका, छिड़काव से पहले बारिश और तेज हवा न होने की पुष्टि करें। {localized_disease} के उपचार हेतु {proposed_chemical} की {safe_dosage} {unit} प्रति एकड़ २०० लीटर पानी में घोलकर सुबह या शाम को छिड़काव करें।"
                elif is_rain_hazard or is_wind_hazard:
                    # Active Spray Interlock / Delay Advisory
                    if language_code == "pa":
                        if is_rain_hazard and is_wind_hazard:
                            hazard_pa = f"{rain_risk}% ਮੀਂਹ ਦਾ ਖਤਰਾ ਅਤੇ {wind_speed} km/h ਤੇਜ਼ ਹਵਾ"
                        elif is_rain_hazard:
                            hazard_pa = f"ਅਗਲੇ 6 ਘੰਟਿਆਂ ਵਿੱਚ {rain_risk}% ਮੀਂਹ ਦਾ ਖਤਰਾ"
                        else:
                            hazard_pa = f"{wind_speed} km/h ਤੇਜ਼ ਹਵਾ"
                        translated_text = (
                            f"ਕਿਸਾਨ ਵੀਰੋ, ਤੁਹਾਡੀ ਫਸਲ ਵਿੱਚ {localized_disease} ਲਈ {proposed_chemical} {safe_dosage} {unit} ਪ੍ਰਤੀ ਏਕੜ ਸਿਫਾਰਿਸ਼ ਹੈ। "
                            f"ਪਰ ਚੇਤਾਵਨੀ: ਖੇਤ ਵਿੱਚ {hazard_pa} ਹੈ। ਦਵਾਈ ਦੇ ਧੁਲਣ ਅਤੇ ਨੁਕਸਾਨ ਤੋਂ ਬਚਣ ਲਈ ਅੱਜ ਛਿੜਕਾਅ ਬਿਲਕੁਲ ਨਾ ਕਰੋ, ਮੌਸਮ ਸਾਫ ਹੋਣ ਦੀ ਉਡੀਕ ਕਰੋ।"
                        )
                    elif language_code == "te":
                        translated_text = (
                            f"రైతు సోదరులారా, మీ పంటలో {localized_disease} నివారణకు {proposed_chemical} {safe_dosage} {unit} పిచికారీ చేయాలి. "
                            f"అయితే హెచ్చరిక: {rain_risk}% వర్ష సూచన లేదా {wind_speed} km/h వేగంతో గాలి వీస్తోంది. మందు కొట్టుకుపోకుండా ఉండటానికి ప్రస్తుతానికి పిచికారీని వాయిదా వేయండి."
                        )
                    elif language_code == "ta":
                        translated_text = (
                            f"விவசாய சகோதரர்களே, பயிரில் {localized_disease} கட்டுப்படுத்த {proposed_chemical} {safe_dosage} {unit} பரிந்துரைக்கப்படுகிறது. "
                            f"ஆனால் எச்சரிக்கை: {rain_risk}% மழை அல்லது {wind_speed} km/h பலத்த காற்று வீசுகிறது. மருந்து வீணாவதைத் தடுக்க தற்போதைக்கு தெளிப்பதைத் தள்ளிப்போடுங்கள்."
                        )
                    elif language_code == "mr":
                        translated_text = (
                            f"शेतकरी मित्रांनो, पिकातील {localized_disease} साठी {proposed_chemical} ची {safe_dosage} {unit} मात्रा आहे. "
                            f"परंतु सावधानता: {rain_risk}% पावसाची शक्यता किंवा {wind_speed} km/h वेगाने वारा आहे. औषध वाहून जाणे टाळण्यासाठी सध्या फवारणी पुढे ढकला."
                        )
                    elif language_code == "en":
                        translated_text = english_text
                    else:
                        # Default Hindi
                        if is_rain_hazard and is_wind_hazard:
                            hazard_hi = f"{rain_risk}% बारिश की संभावना और {wind_speed} km/h तेज हवा"
                        elif is_rain_hazard:
                            hazard_hi = f"अगले ६ घंटों में {rain_risk}% बारिश की संभावना"
                        else:
                            hazard_hi = f"खेत में {wind_speed} km/h तेज हवा"
                        translated_text = (
                            f"किसान भाई, आपकी फसल में {localized_disease} के उपचार हेतु प्रमाणित दवा {proposed_chemical} की मात्रा {safe_dosage} {unit} प्रति एकड़ है। "
                            f"परंतु चेतावनी: आपके क्षेत्र में {hazard_hi} है। दवा के धुलने और बहाव को रोकने के लिए आज छिड़काव बिल्कुल न करें, मौसम साफ होने की प्रतीक्षा करें।"
                        )
                elif is_heat_hazard:
                    # Extreme Heat Dawn/Dusk Warning
                    if language_code == "pa":
                        translated_text = (
                            f"ਕਿਸਾਨ ਵੀਰੋ, ਖੇਤ ਵਿੱਚ ਭਾਰੀ ਗਰਮੀ ({temperature}°C) ਹੈ। ਪੱਤਿਆਂ ਨੂੰ ਝੁਲਸਣ ਤੋਂ ਬਚਾਉਣ ਲਈ ਦੁਪਹਿਰ ਵੇਲੇ ਛਿੜਕਾਅ ਨਾ ਕਰੋ। "
                            f"{localized_disease} ਦੇ ਇਲਾਜ ਲਈ {proposed_chemical} ਦਾ {safe_dosage} {unit} ਪ੍ਰਤੀ ਏਕੜ ਛਿੜਕਾਅ ਸਿਰਫ਼ ਸਵੇਰੇ 8 ਵਜੇ ਤੋਂ ਪਹਿਲਾਂ ਜਾਂ ਸ਼ਾਮ ਵੇਲੇ ਕਰੋ।"
                        )
                    elif language_code == "te":
                        translated_text = (
                            f"రైతు సోదరులారా, ఉష్ణోగ్రత అధికంగా ({temperature}°C) ఉంది. ఆకులు మాడిపోకుండా ఉండటానికి మధ್ಯಾహ్నం పిచికారీ చేయవద్దు. "
                            f"{localized_disease} నివారణకు {proposed_chemical} మందును ఉదయం లేదా సాయంత్రం వేళల్లో మాత్రమే పిచికారీ చేయండి."
                        )
                    elif language_code == "en":
                        translated_text = english_text
                    else:
                        translated_text = (
                            f"किसान भाई, खेत में भारी तापमान ({temperature}°C) है। पत्तियों को झुलसने से बचाने के लिए दोपहर में छिड़काव बिल्कुल न करें। "
                            f"{localized_disease} के उपचार हेतु {proposed_chemical} की {safe_dosage} {unit} प्रति एकड़ २०० लीटर पानी में मिलाकर केवल सुबह ८ बजे से पहले या शाम को छिड़काव करें।"
                        )
                else:
                    # Optimal Weather Window
                    if language_code == "pa":
                        translated_text = (
                            f"ਕਿਸਾਨ ਵੀਰੋ, ਤੁਹਾਡੇ ਖੇਤ ਦਾ ਮੌਸਮ ਅਨੁਕੂਲ ਹੈ (ਤਾਪਮਾਨ {temperature}°C, ਨਮੀ {humidity}%, ਹਵਾ {wind_speed} km/h)। "
                            f"ਫਸਲ ਵਿੱਚ {localized_disease} ਦੇ ਪੱਕੇ ਇਲਾਜ ਲਈ {proposed_chemical} ਦਾ {safe_dosage} {unit} ਪ੍ਰਤੀ ਏਕੜ 200 ਲੀਟਰ ਪਾਣੀ ਵਿੱਚ ਘੋਲ ਕੇ ਸਵੇਰੇ ਜਾਂ ਸ਼ਾਮ ਨੂੰ ਛਿੜਕਾਅ ਕਰੋ।"
                        )
                    elif language_code == "te":
                        translated_text = (
                            f"రైతు సోదరులారా, మీ పొలంలో వాతావరణం అనుకూలంగా ఉంది (ఉష్ణోగ్రత {temperature}°C, తేమ {humidity}%, గాలి {wind_speed} km/h). "
                            f"పంటలో {localized_disease} నివారణకు ఎకరానికి {safe_dosage} {unit} {proposed_chemical} మందును 200 లీటర్ల నీటిలో కలిపి పిచికారీ చేయండి."
                        )
                    elif language_code == "ta":
                        translated_text = (
                            f"விவசாய சகோதரர்களே, உங்கள் பகுதியில் வானிலை சாதகமாக உள்ளது (வெப்பநிலை {temperature}°C, ஈரப்பதம் {humidity}%, காற்று {wind_speed} km/h). "
                            f"{localized_disease} நோயைக் கட்டுப்படுத்த ஒரு ஏக்கருக்கு {safe_dosage} {unit} {proposed_chemical} மருந்தை 200 லிட்டர் தண்ணீரில் கலந்து தெளிக்கவும்."
                        )
                    elif language_code == "ml":
                        translated_text = (
                            f"കർഷക സുഹൃത്തുക്കളെ, നിങ്ങളുടെ പ്രദേശത്തെ കാലാവസ്ഥ അനുകൂലമാണ് (താപനില {temperature}°C, ഈർപ്പം {humidity}%, കാറ്റ് {wind_speed} km/h). "
                            f"{localized_disease} നിയന്ത്രണത്തിനായി ഏക്കറിന് {safe_dosage} {unit} തോതിൽ {proposed_chemical} 200 ലിറ്റർ വെള്ളത്തിൽ കലക്കി തളിക്കുക."
                        )
                    elif language_code == "mr":
                        translated_text = (
                            f"शेतकरी मित्रांनो, शेतातील हवामान अनुकूल आहे (तापमान {temperature}°C, आर्द्रता {humidity}%, वारा {wind_speed} km/h). "
                            f"पिकातील {localized_disease} च्या नियंत्रणासाठी {proposed_chemical} {safe_dosage} {unit} प्रति एकर २०० लिटर पाण्यात मिसळून फवारा."
                        )
                    elif language_code == "bn":
                        translated_text = (
                            f"কৃষক ভাইয়েরা, আপনার জমির আবহাওয়া অনুকূল (তাপমাত্রা {temperature}°C, আর্দ্রতা {humidity}%, বাতাস {wind_speed} km/h)। "
                            f"{localized_disease} নিরাময়ের জন্য প্রতি একরে {safe_dosage} {unit} {proposed_chemical} ২০০ লিটার পরিষ্কার জলে মিশিয়ে স্প্রে করুন।"
                        )
                    elif language_code == "gu":
                        translated_text = (
                            f"ખેડૂત મિત્રો, ખેતરનું હવામાન અનુકૂળ છે (તાપમાન {temperature}°C, ભેજ {humidity}%, પવન {wind_speed} km/h). "
                            f"{localized_disease} ના નિયંત્રણ માટે એકર દીઠ {safe_dosage} {unit} {proposed_chemical} ૨૦૦ લિટર પાણીમાં ભેળવીને છંટકાવ કરો."
                        )
                    elif language_code == "kn":
                        translated_text = (
                            f"ರೈತ ಮಿತ್ರರೇ, ನಿಮ್ಮ ಹೊಲದಲ್ಲಿ ಹವಾಮಾನ ಅನುಕೂಲಕರವಾಗಿದೆ (ತಾಪಮಾನ {temperature}°C, ತೇವಾಂಶ {humidity}%, ಗಾಳಿ {wind_speed} km/h). "
                            f"{localized_disease} ನಿಯಂತ್ರಣಕ್ಕಾಗಿ ಪ್ರತಿ ಎಕರೆಗೆ {safe_dosage} {unit} {proposed_chemical} ಅನ್ನು 200 ಲೀಟರ್ ನೀರಿನಲ್ಲಿ ಬೆರೆಸಿ ಸಿಂಪಡಿಸಿ."
                        )
                    elif language_code == "od":
                        translated_text = (
                            f"କୃଷକ ଭାଇମାନେ, ଆପଣଙ୍କ ଜମିରେ ପାଣିପାଗ ଅନୁକୂଳ ଅଛି (ତାପମାତ୍ରା {temperature}°C, ଆର୍ଦ୍ରତା {humidity}%, ପବନ {wind_speed} km/h)। "
                            f"{localized_disease} ର ନିରାକରଣ ପାଇଁ ଏକର ପ୍ରତି {safe_dosage} {unit} {proposed_chemical} କୁ ୨୦୦ ଲିଟର ପାଣିରେ ମିଶାଇ ସ୍ପ୍ରେ କରନ୍ତୁ।"
                        )
                    elif language_code == "en":
                        translated_text = english_text
                    else:
                        # Default Hindi
                        translated_text = (
                            f"किसान भाई, आपके खेत का मौसम अनुकूल है (तापमान {temperature}°C, आर्द्रता {humidity}%, हवा {wind_speed} km/h)। "
                            f"फसल में {localized_disease} के उपचार हेतु {proposed_chemical} की {safe_dosage} {unit} प्रति एकड़ २०० लीटर पानी में घोलकर सुबह या शाम को छिड़काव करें।"
                        )

    except Exception as e:
        print(f"[VOICE LLM ERROR] {e}")
        translated_text = english_text

    # Synthesize natural human acoustic speech using Sarvam AI Bulbul:v3
    audio_path = await tts_client.synthesize_speech(translated_text, language_code)

    return {
        "vernacular_audio_url": audio_path,
        "translated_text": translated_text
    }
