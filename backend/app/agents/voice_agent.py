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
    temperature = state.get("current_temperature", 28.0)
    humidity = state.get("current_humidity", 75.0)
    rain_risk = int(state.get("rain_risk_6h_percent", 0.0))
    location_source = state.get("location_source", "regional_baseline")
    is_live_weather = (location_source in ["exif_gps", "device_gps"])

    lang_meta = LANGUAGE_INFO.get(language_code, LANGUAGE_INFO["hi"])
    target_language = lang_meta["name"]
    target_script = lang_meta["script"]
    localized_disease = get_localized_pathology(vision_diagnosis, language_code)

    # Nearest KVK Details
    nearest_kvk = state.get("nearest_kvk")
    kvk_name_str = nearest_kvk.get("name", "District Krishi Vigyan Kendra") if nearest_kvk else "District Krishi Vigyan Kendra"
    kvk_dist_str = f"{nearest_kvk.get('distance_km', 0.0)} km" if nearest_kvk else ""
    unit = state.get("dosage_unit", "ml" if "SC" in proposed_chemical or "EC" in proposed_chemical else "g")

    # Weather condition string in English
    if not is_live_weather:
        weather_note = "Caution: Live field weather could not be fetched due to lack of internet connection. Please verify there is no immediate rain before spraying to prevent chemical wash-off."
    elif rain_risk >= 40:
        weather_note = f"Warning: {rain_risk}% rain risk detected in your area. Delay spraying until weather clears."
    else:
        weather_note = f"Current field weather is optimal ({temperature}°C, {humidity}% humidity). Safe to spray."

    if not is_safe:
        english_text = (
            f"Dear Farmer, your crop shows foliar symptoms of {vision_diagnosis}. "
            f"However, chemical application cannot be approved safely. {safety_warning} "
            f"Please do not spray any unverified chemical to avoid crop damage. "
            f"Please consult your nearest extension center: {kvk_name_str} ({kvk_dist_str} away)."
        )
    else:
        english_text = (
            f"Dear Farmer, your crop is affected by {vision_diagnosis}. {weather_note} "
            f"For safe, certified treatment, spray {proposed_chemical} at an exact dosage of {safe_dosage} {unit} per acre, thoroughly mixed in 200 liters of clean water. "
            f"Apply the spray during early morning or late evening on dry foliage."
        )

    try:
        api_key = os.environ.get("GOOGLE_API_KEY")
        if api_key and api_key != "your_google_api_key_here":
            llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=api_key)
            prompt = f"""You are an expert senior agricultural scientist (Agronomist) advising an Indian farmer in their native language.
            
            Translate and refine the following in-depth agricultural advisory into natural, fluent, and highly detailed colloquial {target_language} (written in {target_script} script).
            
            Structure of response:
            1. Respectful Greeting (e.g. '{lang_meta["greeting"]}').
            2. Field Weather & Diagnosis: State current weather situation (mentioning if live weather was not fetched due to offline status) and diagnosed condition ('{localized_disease}').
            3. Treatment advisory: Chemical ({proposed_chemical}), exact certified dosage ({safe_dosage} {unit} per acre), and water dilution (200 Liters).
            4. Practical field instructions (spray in cool hours, check rain forecast, or direct to nearest KVK: {kvk_name_str} {kvk_dist_str}).
            
            Advisory text: '{english_text}'
            
            Respond strictly with the translated speech text in {target_script} script with zero markdown headers or bullet points."""
            
            response = llm.invoke(prompt)
            translated_text = response.content.strip()
        else:
            # Dynamic high-depth, fully localized agronomic fallback templates with live weather and KVK
            if not is_safe:
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
                # Safe Case: Prescribe verified ICAR treatment with weather context (and offline weather caution if applicable)
                weather_prefix_hi = "सावधानी: इंटरनेट न होने के कारण लाइव मौसम प्राप्त नहीं हो सका, छिड़काव से पहले बारिश न होने की पुष्टि करें।" if not is_live_weather else f"आपके खेत में तापमान {temperature}°C और आर्द्रता {humidity}% है।"
                weather_prefix_pa = "ਸਾਵਧਾਨੀ: ਇੰਟਰਨੈੱਟ ਨਾ ਹੋਣ ਕਰਕੇ ਲਾਈਵ ਮੌਸਮ ਨਹੀਂ ਮਿਲ ਸਕਿਆ, ਛਿੜਕਾਅ ਤੋਂ ਪਹਿਲਾਂ ਮੀਂਹ ਨਾ ਹੋਣ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ।" if not is_live_weather else f"ਤੁਹਾਡੇ ਖੇਤ ਵਿੱਚ ਤਾਪਮਾਨ {temperature}°C ਅਤੇ ਨਮੀ {humidity}% ਹੈ।"
                weather_prefix_te = "హెచ్చరిక: ఇంటర్నెట్ లేకపోవడం వల్ల ప్రత్యక్ష వాతావరణం పొందలేకపోయాము, వర్షం లేదని నిర్ధారించుకోండి." if not is_live_weather else f"మీ ప్రాంతంలో ఉష్ణోగ్రత {temperature}°C మరియు తేమ {humidity}% గా ఉంది."
                weather_prefix_ta = "எச்சரிக்கை: இணையம் இல்லாததால் நேரடி வானிலை பெற முடியவில்லை, மழை இல்லை என்பதை உறுதிப்படுத்தவும்." if not is_live_weather else f"உங்கள் பகுதியில் வெப்பநிலை {temperature}°C மற்றும் ஈரப்பதம் {humidity}%."
                weather_prefix_ml = "മുന്നറിയിപ്പ്: ഇന്റർനെറ്റ് ലഭ്യമല്ലാത്തതിനാൽ തത്സമയ കാലാവസ്ഥ ലഭിച്ചില്ല, മഴയില്ലെന്ന് ഉറപ്പാക്കുക." if not is_live_weather else f"നിങ്ങളുടെ പ്രദേശത്തെ താപനില {temperature}°C, ഈർപ്പം {humidity}% ആണ്."
                weather_prefix_mr = "सावधानता: इंटरनेट नसल्यामुळे थेट हवामान माहिती मिळू शकली नाही, फवारणीपूर्वी पाऊस नाही याची खात्री करा." if not is_live_weather else f"तुमच्या शेतात तापमान {temperature}°C आणि आर्द्रता {humidity}% आहे."
                weather_prefix_bn = "সতর্কতা: ইন্টারনেট না থাকার কারণে সরাসরি আবহাওয়া পাওয়া যায়নি, স্প্রে করার আগে বৃষ্টি নেই নিশ্চিত করুন।" if not is_live_weather else f"আপনার জমিতে তাপমাত্রা {temperature}°C এবং আর্দ্রতা {humidity}%।"
                weather_prefix_gu = "સાવધાની: ઇન્ટરનેટ ન હોવાને કારણે લાઇવ હવામાન મળ્યું નથી, છંટકાવ પહેલાં વરસાદ નથી તેની ખાતરી કરો." if not is_live_weather else f"તમારા ખેતરમાં તાપમાન {temperature}°C અને ભેજ {humidity}% છે."
                weather_prefix_kn = "ಎಚ್ಚರಿಕೆ: ಇಂಟರ್ನೆಟ್ ಇಲ್ಲದ ಕಾರಣ ಲೈವ್ ಹವಾಮಾನ ಲಭ್ಯವಿಲ್ಲ, ಸಿಂಪಡಿಸುವ ಮೊದಲು ಮಳೆ ಇಲ್ಲ ಎಂದು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ." if not is_live_weather else f"ನಿಮ್ಮ ಹೊಲದಲ್ಲಿ ತಾಪಮಾನ {temperature}°C ಮತ್ತು ತೇವಾಂಶ {humidity}% ಇದೆ."
                weather_prefix_od = "ସତର୍କତା: ଇଣ୍ଟରନେଟ୍ ନଥିବାରୁ ଲାଇଭ୍ ପାଣିପାଗ ମିଳିନାହିଁ, ସ୍ପ୍ରେ ପୂର୍ବରୁ ବର୍ଷା ନାହିଁ ନିଶ୍ଚିତ କରନ୍ତୁ।" if not is_live_weather else f"ଆପଣଙ୍କ ଜମିରେ ତାପମାତ୍ରା {temperature}°C ଏବଂ ଆର୍ଦ୍ରତା {humidity}% ଅଛି।"

                if language_code == "pa":
                    translated_text = (
                        f"ਕਿਸਾਨ ਵੀਰੋ, {weather_prefix_pa} ਫਸਲ ਵਿੱਚ {localized_disease} ਦੇ ਪੱਕੇ ਇਲਾਜ ਲਈ "
                        f"{proposed_chemical} ਦਾ {safe_dosage} {unit} ਪ੍ਰਤੀ ਏਕੜ 200 ਲੀਟਰ ਸਾਫ਼ ਪਾਣੀ ਵਿੱਚ ਘੋਲ ਕੇ ਛਿੜਕਾਅ ਕਰੋ। ਛਿੜਕਾਅ ਸਵੇਰੇ ਜਾਂ ਸ਼ਾਮ ਦੇ ਸਮੇਂ ਸੁੱਕੇ ਪੱਤਿਆਂ 'ਤੇ ਕਰੋ।"
                    )
                elif language_code == "te":
                    translated_text = (
                        f"రైతు సోదరులారా, {weather_prefix_te} పంటలో {localized_disease} నివారణకు "
                        f"ఎకరానికి {safe_dosage} {unit} మోతాదులో {proposed_chemical} మందును 200 లీటర్ల నీటిలో కలిపి పిచికారీ చేయండి."
                    )
                elif language_code == "ta":
                    translated_text = (
                        f"விவசாய சகோதரர்களே, {weather_prefix_ta} {localized_disease} நோயைக் கட்டுப்படுத்த "
                        f"ஒரு ஏக்கருக்கு {safe_dosage} {unit} அளவில் {proposed_chemical} மருந்தை 200 லிட்டர் தண்ணீரில் கலந்து தெளிக்கவும்."
                    )
                elif language_code == "ml":
                    translated_text = (
                        f"കർഷക സുഹൃത്തുക്കളെ, {weather_prefix_ml} {localized_disease} നിയന്ത്രണത്തിനായി "
                        f"ഏക്കറിന് {safe_dosage} {unit} തോതിൽ {proposed_chemical} 200 ലിറ്റർ വെള്ളത്തിൽ കലക്കി തളിക്കുക."
                    )
                elif language_code == "mr":
                    translated_text = (
                        f"शेतकरी मित्रांनो, {weather_prefix_mr} पिकातील {localized_disease} च्या नियंत्रणासाठी "
                        f"{proposed_chemical} हे औषध {safe_dosage} {unit} प्रति एकर २०० लिटर पाण्यात मिसळून फवारा."
                    )
                elif language_code == "bn":
                    translated_text = (
                        f"কৃষক ভাইয়েরা, {weather_prefix_bn} {localized_disease} নিরাময়ের জন্য "
                        f"প্রতি একরে {safe_dosage} {unit} হারে {proposed_chemical} ২০০ লিটার পরিষ্কার জলে মিশিয়ে স্প্রে করুন।"
                    )
                elif language_code == "gu":
                    translated_text = (
                        f"ખેડૂત મિત્રો, {weather_prefix_gu} {localized_disease} ના નિયંત્રણ માટે "
                        f"એકર દીઠ {safe_dosage} {unit} {proposed_chemical} દવા ૨૦૦ લિટર પાણીમાં ભેળવીને છંટકાવ કરો."
                    )
                elif language_code == "kn":
                    translated_text = (
                        f"ರೈತ ಮಿತ್ರರೇ, {weather_prefix_kn} {localized_disease} ನಿಯಂತ್ರಣಕ್ಕಾಗಿ "
                        f"ಪ್ರತಿ ಎಕರೆಗೆ {safe_dosage} {unit} {proposed_chemical} ಅನ್ನು 200 ಲೀಟರ್ ನೀರಿನಲ್ಲಿ ಬೆರೆಸಿ ಸಿಂಪಡಿಸಿ."
                    )
                elif language_code == "od":
                    translated_text = (
                        f"କୃଷକ ଭାଇମାନେ, {weather_prefix_od} {localized_disease} ର ନିରାକରଣ ପାଇଁ "
                        f"ଏକର ପ୍ରତି {safe_dosage} {unit} {proposed_chemical} କୁ ୨୦୦ ଲିଟର ପାଣିରେ ମିଶାଇ ସ୍ପ୍ରେ କରନ୍ତୁ।"
                    )
                elif language_code == "en":
                    translated_text = english_text
                else:
                    # Default Hindi
                    translated_text = (
                        f"किसान भाई, {weather_prefix_hi} फसल में {localized_disease} के उपचार हेतु "
                        f"{proposed_chemical} की {safe_dosage} {unit} प्रति एकड़ २०० लीटर पानी में घोलकर छिड़काव करें। छिड़काव सुबह या शाम को करें।"
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
