from app.state import AgriNexusState
from app.services.tts_client import tts_client
import os
from langchain_google_genai import ChatGoogleGenerativeAI

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
    "en": {"name": "Indian English", "script": "Latin", "greeting": "Dear Farmer"}
}

# Dynamic Vernacular Pathology Dictionary
PATHOLOGY_TRANSLATIONS = {
    "Tomato Leaf Mold": {
        "hi": "पत्ती फफूंद (Leaf Mold)",
        "pa": "ਪੱਤਿਆਂ ਦੀ ਉੱਲੀ (Leaf Mold)",
        "te": "ఆకు బూజు తెగులు (Leaf Mold)",
        "ta": "இலை பூஞ்சை காளான் (Leaf Mold)",
        "ml": "ഇല പൂപ്പൽ രോഗം (Leaf Mold)",
        "kn": "ಎಲೆ ಬೂಷ್ಟು ರೋಗ (Leaf Mold)",
        "bn": "পাতার ছত্রাক রোগ (Leaf Mold)",
        "mr": "पानावरील बुरशी (Leaf Mold)",
        "gu": "પાનની ફૂગ (Leaf Mold)",
        "od": "ପତ୍ର ଫିମ୍ପି ରୋଗ (Leaf Mold)",
        "en": "Tomato Leaf Mold"
    },
    "Tomato Late Blight": {
        "hi": "पछेता झुलसा (Late Blight)",
        "pa": "ਪਛੇਤਾ ਝੁਲਸ ਰੋਗ (Late Blight)",
        "te": "లేట్ బ్లైట్ మచ్చల తెగులు (Late Blight)",
        "ta": "பின் பருவ கருகல் நோய் (Late Blight)",
        "ml": "ലേറ്റ് ബ്ലൈറ്റ് കരിമ്പൻ രോഗം (Late Blight)",
        "kn": "ಅಂಗಮಾರಿ ರೋಗ (Late Blight)",
        "bn": "নাবি ধসা রোগ (Late Blight)",
        "mr": "करपा रोग (Late Blight)",
        "gu": "પાછોતરો સુકારો (Late Blight)",
        "od": "ପଛୁଆ ପୋଡ଼ା ରୋଗ (Late Blight)",
        "en": "Tomato Late Blight"
    },
    "Tomato Early Blight": {
        "hi": "अगेती झुलसा (Early Blight)",
        "pa": "ਅਗੇਤਾ ਝੁਲਸ ਰੋਗ (Early Blight)",
        "te": "అర్లీ బ్లైట్ తెగులు (Early Blight)",
        "ta": "முன் பருவ கருகல் நோய் (Early Blight)",
        "ml": "ഏർലി ബ്ലൈറ്റ് രോഗം (Early Blight)",
        "kn": "ಮುಂಗಾರು ಅಂಗಮಾರಿ (Early Blight)",
        "bn": "আগাম ধসা রোগ (Early Blight)",
        "mr": "लवकर येणारा करपा (Early Blight)",
        "gu": "અગેતરો સુકારો (Early Blight)",
        "od": "ଆଗୁଆ ପୋଡ଼ା ରୋଗ (Early Blight)",
        "en": "Tomato Early Blight"
    },
    "Tomato Target Spot": {
        "hi": "टारगेट स्पॉट रोग (Target Spot)",
        "pa": "ਟਾਰਗੇਟ ਸਪਾਟ (Target Spot)",
        "te": "టార్గెట్ స్పాట్ తెగులు (Target Spot)",
        "ta": "இலக்கு புள்ளி நோய் (Target Spot)",
        "ml": "ടാർഗെറ്റ് സ്പോട്ട് രോഗം (Target Spot)",
        "kn": "ಟಾರ್ಗೆಟ್ ಸ್ಪಾಟ್ (Target Spot)",
        "bn": "টার্গেট স্পট রোগ (Target Spot)",
        "mr": "टार्गेट स्पॉट करपा (Target Spot)",
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
    Dynamically maps the verified diagnosis, chemical, and ICAR dosage into 11 Indic languages
    incorporating real-time field weather metrics.
    """
    is_safe = state.get("is_safe", False)
    vision_diagnosis = state.get("vision_diagnosis", "Foliar Condition")
    proposed_chemical = state.get("proposed_chemical", "None")
    safe_dosage = state.get("safe_dosage_ml_per_acre", 0.0)
    safety_warning = state.get("safety_warning", "")
    language_code = state.get("language_code", "hi")
    
    # Weather metrics
    temperature = state.get("current_temperature", 28.0)
    humidity = state.get("current_humidity", 75.0)
    rain_risk = int(state.get("rain_risk_6h_percent", 0.0))

    lang_meta = LANGUAGE_INFO.get(language_code, LANGUAGE_INFO["hi"])
    target_language = lang_meta["name"]
    target_script = lang_meta["script"]
    localized_disease = get_localized_pathology(vision_diagnosis, language_code)

    # Weather condition string in English
    if rain_risk >= 40:
        weather_note = f"Warning: {rain_risk}% rain risk detected in your area. Delay spraying until weather clears."
    else:
        weather_note = f"Current field weather is optimal ({temperature}°C, {humidity}% humidity). Safe to spray."

    if not is_safe:
        english_text = (
            f"Dear Farmer, your crop shows symptoms of {vision_diagnosis}. "
            f"However, chemical application cannot be approved safely. {safety_warning} "
            f"Please do not spray any unverified chemical to avoid crop damage and soil toxicity. Please bring a fresh leaf sample to your nearest Krishi Vigyan Kendra (KVK)."
        )
    else:
        english_text = (
            f"Dear Farmer, your crop is affected by {vision_diagnosis}. {weather_note} "
            f"For safe, certified treatment, spray {proposed_chemical} at an exact dosage of {safe_dosage} per acre, thoroughly mixed in 200 liters of clean water. "
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
            2. Field Weather & Diagnosis: State current temperature ({temperature}°C), humidity ({humidity}%), and diagnosed condition ('{localized_disease}').
            3. Treatment advisory: Chemical ({proposed_chemical}), exact certified dosage ({safe_dosage} per acre), and water dilution (200 Liters).
            4. Practical field instructions (spray in cool hours, check rain forecast).
            
            Advisory text: '{english_text}'
            
            Respond strictly with the translated speech text in {target_script} script with zero markdown headers or bullet points."""
            
            response = llm.invoke(prompt)
            translated_text = response.content.strip()
        else:
            # Dynamic high-depth, fully localized agronomic fallback templates with live weather
            if not is_safe:
                if language_code == "pa":
                    translated_text = f"ਕਿਸਾਨ ਵੀਰੋ, ਤੁਹਾਡੀ ਫਸਲ ਵਿੱਚ {localized_disease} ਦੇ ਲੱਛਣ ਮਿਲੇ ਹਨ। ਫਸਲ ਦੀ ਸੁਰੱਖਿਆ ਲਈ ਕਿਸੇ ਵੀ ਅਣਪ੍ਰਮਾਣਿਤ ਦਵਾਈ ਦਾ ਛਿੜਕਾਅ ਨਾ ਕਰੋ ਅਤੇ ਨੇੜਲੇ ਕ੍ਰਿਸ਼ੀ ਵਿਗਿਆਨ ਕੇਂਦਰ (KVK) ਨਾਲ ਸੰਪਰਕ ਕਰੋ।"
                elif language_code == "te":
                    translated_text = f"రైతు సోదరులారా, మీ పంటలో {localized_disease} లక్షణాలు ఉన్నాయి. రక్షణ దృష్ట్యా ఎటువంటి రసాయనాన్ని పిచికారీ చేయవద్దు మరియు సమీపంలోని కృషి విజ్ఞాన కేంద్రాన్ని (KVK) సంప్రదించండి."
                elif language_code == "ta":
                    translated_text = f"விவசாய சகோதரர்களே, உங்கள் பயிரில் {localized_disease} அறிகுறிகள் உள்ளன. பயிர் பாதுகாப்பிற்காக ரசாயனங்களை தெளிக்க வேண்டாம், அருகிலுள்ள வேளாண் அறிவியல் மையத்தை (KVK) அணுகவும்."
                elif language_code == "ml":
                    translated_text = f"കർഷക സുഹൃത്തുക്കളെ, നിങ്ങളുടെ വിളയിൽ {localized_disease} ലക്ഷണങ്ങൾ കാണുന്നു. ദയവായി ഇപ്പോൾ രാസവസ്തുക്കൾ തളിക്കരുത്, കൃഷി വിജ്ഞാൻ കേന്ദ്രവുമായി (KVK) ബന്ധപ്പെടുക."
                elif language_code == "mr":
                    translated_text = f"शेतकरी मित्रांनो, तुमच्या पिकात {localized_disease} लक्षणे दिसत आहेत. पिकाच्या सुरक्षेसाठी फवारणी करू नका आणि जवळच्या कृषी विज्ञान केंद्राशी (KVK) संपर्क साधा."
                elif language_code == "bn":
                    translated_text = f"কৃষক ভাইয়েরা, আপনার ফসলে {localized_disease} এর লক্ষণ দেখা গেছে। ফসলের সুরক্ষার জন্য কোনও রাসায়নিক স্প্রে করবেন না এবং নিকটস্থ কৃষি বিজ্ঞান কেন্দ্রের (KVK) সাথে যোগাযোগ করুন।"
                elif language_code == "gu":
                    translated_text = f"ખેડૂત મિત્રો, તમારા પાકમાં {localized_disease} ના લક્ષણો જોવા મળ્યા છે. પાકની સુરક્ષા માટે છંટકાવ ન કરો અને નજીકના કૃષિ વિજ્ઞાન કેન્દ્ર (KVK) નો સંપર્ક કરો."
                elif language_code == "kn":
                    translated_text = f"ರೈತ ಮಿತ್ರರೇ, ನಿಮ್ಮ ಬೆಳೆಯಲ್ಲಿ {localized_disease} ಲಕ್ಷಣಗಳು ಕಂಡುಬಂದಿವೆ. ಯಾವುದೇ ರಾಸಾಯನಿಕ ಸಿಂಪಡಿಸಬೇಡಿ ಮತ್ತು ಹತ್ತಿರದ ಕೃಷಿ ವಿಜ್ಞಾನ ಕೇಂದ್ರವನ್ನು (KVK) ಸಂಪರ್ಕಿಸಿ."
                elif language_code == "od":
                    translated_text = f"କୃଷକ ଭାଇମାନେ, ଆପଣଙ୍କ ଫସଲରେ {localized_disease} ର ଲକ୍ଷଣ ଦେଖାଯାଇଛି। କୌଣସି ରାସାୟନିକ ସ୍ପ୍ରେ କରନ୍ତୁ ନାହିଁ ଏବଂ ନିକଟସ୍ଥ କୃଷି ବିଜ୍ଞାନ କେନ୍ଦ୍ର ସହିତ ଯୋଗାଯୋଗ କରନ୍ତୁ।"
                elif language_code == "en":
                    translated_text = english_text
                else:
                    # Default Hindi
                    translated_text = f"किसान भाई, आपकी फसल में {localized_disease} के लक्षण दिखे हैं। फसल की सुरक्षा के लिए किसी अप्रमाणित रसायन का छिड़काव न करें और नजदीकी कृषि विज्ञान केंद्र (KVK) से संपर्क करें।"
            else:
                # Safe Case: Prescribe verified ICAR treatment with weather context
                if language_code == "pa":
                    translated_text = (
                        f"ਕਿਸਾਨ ਵੀਰੋ, ਤੁਹਾਡੇ ਖੇਤ ਵਿੱਚ ਤਾਪਮਾਨ {temperature}°C ਅਤੇ ਨਮੀ {humidity}% ਹੈ। ਫਸਲ ਵਿੱਚ {localized_disease} ਦੇ ਪੱਕੇ ਇਲਾਜ ਲਈ "
                        f"{proposed_chemical} ਦਾ {safe_dosage} ਪ੍ਰਤੀ ਏਕੜ 200 ਲੀਟਰ ਸਾਫ਼ ਪਾਣੀ ਵਿੱਚ ਘੋਲ ਕੇ ਛਿੜਕਾਅ ਕਰੋ। ਛਿੜਕਾਅ ਸਵੇਰੇ ਜਾਂ ਸ਼ਾਮ ਦੇ ਸਮੇਂ ਸੁੱਕੇ ਪੱਤਿਆਂ 'ਤੇ ਕਰੋ।"
                    )
                elif language_code == "te":
                    translated_text = (
                        f"రైతు సోదరులారా, మీ ప్రాంతంలో ఉష్ణోగ్రత {temperature}°C మరియు తేమ {humidity}% గా ఉంది. పంటలో {localized_disease} నివారణకు "
                        f"ఎకరానికి {safe_dosage} మోతాదులో {proposed_chemical} మందును 200 లీటర్ల నీటిలో కలిపి పిచికారీ చేయండి."
                    )
                elif language_code == "ta":
                    translated_text = (
                        f"விவசாய சகோதரர்களே, உங்கள் பகுதியில் வெப்பநிலை {temperature}°C மற்றும் ஈரப்பதம் {humidity}%. {localized_disease} நோயைக் கட்டுப்படுத்த "
                        f"ஒரு ஏக்கருக்கு {safe_dosage} அளவில் {proposed_chemical} மருந்தை 200 லிட்டர் தண்ணீரில் கலந்து தெளிக்கவும்."
                    )
                elif language_code == "ml":
                    translated_text = (
                        f"കർഷക സുഹൃത്തുക്കളെ, നിങ്ങളുടെ പ്രദേശത്തെ താപനില {temperature}°C, ഈർപ്പം {humidity}% ആണ്. {localized_disease} നിയന്ത്രണത്തിനായി "
                        f"ഏക്കറിന് {safe_dosage} തോതിൽ {proposed_chemical} 200 ലിറ്റർ വെള്ളത്തിൽ കലക്കി തളിക്കുക."
                    )
                elif language_code == "mr":
                    translated_text = (
                        f"शेतकरी मित्रांनो, तुमच्या शेतात तापमान {temperature}°C आणि आर्द्रता {humidity}% आहे. पिकातील {localized_disease} च्या नियंत्रणासाठी "
                        f"प्रति एकर {safe_dosage} प्रमाणात {proposed_chemical} २०० लिटर पाण्यात मिसळून फवारणी करा."
                    )
                elif language_code == "bn":
                    translated_text = (
                        f"কৃষক ভাইয়েরা, আপনার এলাকায় তাপমাত্রা {temperature}°C এবং আর্দ্রতা {humidity}%। ফসলের {localized_disease} এর জন্য "
                        f"একর প্রতি {safe_dosage} মাত্রায় {proposed_chemical} ২০০ লিটার জলে গুলে স্প্রে করুন।"
                    )
                elif language_code == "gu":
                    translated_text = (
                        f"ખેડૂત મિત્રો, તમારા વિસ્તારમાં તાપમાન {temperature}°C અને ભેજ {humidity}% છે. પાકમાં {localized_disease} ના નિયંત્રણ માટે "
                        f"એકર દીઠ {safe_dosage} પ્રમાણમાં {proposed_chemical} 200 લિટર પાણીમાં ભેળવીને છંટકાવ કરો."
                    )
                elif language_code == "kn":
                    translated_text = (
                        f"ರೈತ ಮಿತ್ರರೇ, ನಿಮ್ಮ ಪ್ರದೇಶದಲ್ಲಿ ತಾಪಮಾನ {temperature}°C ಮತ್ತು ತೇವಾಂಶ {humidity}% ಇದೆ. {localized_disease} ನಿಯಂತ್ರಣಕ್ಕಾಗಿ "
                        f"ಎಕರೆಗೆ {safe_dosage} ಪ್ರಮಾಣದಲ್ಲಿ {proposed_chemical} ಅನ್ನು 200 ಲೀಟರ್ ನೀರಿನಲ್ಲಿ ಬೆರೆಸಿ ಸಿಂಪಡಿಸಿ."
                    )
                elif language_code == "od":
                    translated_text = (
                        f"କୃଷକ ଭାଇମାନେ, ଆପଣଙ୍କ ଅଞ୍ଚଳରେ ତାପମାତ୍ରା {temperature}°C ଏବଂ ଆର୍ଦ୍ରତା {humidity}% ଅଛି। {localized_disease} ର ନିରାକରଣ ପାଇଁ "
                        f"ଏକର ପିଛା {safe_dosage} ମାତ୍ରାରେ {proposed_chemical} ୨୦୦ ଲିଟର ପାଣିରେ ମିଶାଇ ସ୍ପ୍ରେ କରନ୍ତୁ।"
                    )
                elif language_code == "en":
                    translated_text = english_text
                else:
                    # Default Hindi
                    translated_text = (
                        f"किसान भाई, आपके क्षेत्र में वर्तमान तापमान {temperature}°C और नमी {humidity}% है। फसल में {localized_disease} के प्रमाणित उपचार के लिए "
                        f"{proposed_chemical} का {safe_dosage} प्रति एकड़ 200 लीटर साफ पानी में मिलाकर छिड़काव करें। छिड़काव सुबह या शाम के समय करें।"
                    )

        # Generate authentic high-fidelity Indic TTS audio via Sarvam AI
        audio_url = await tts_client.generate_audio(translated_text, language_code)

        return {
            "translated_text": translated_text,
            "vernacular_audio_url": audio_url
        }

    except Exception as e:
        return {
            "errors": [f"Voice Agent Error: {str(e)}"],
            "translated_text": english_text,
            "vernacular_audio_url": None
        }
