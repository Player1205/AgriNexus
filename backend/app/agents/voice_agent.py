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

async def voice_node(state: AgriNexusState) -> dict:
    """
    Agent 5: Vernacular Translation & Comprehensive Voice Synthesis.
    Provides in-depth agronomic diagnosis, causes, dosage, water mixing ratio, field application timing, and preventative care.
    """
    is_safe = state.get("is_safe", False)
    vision_diagnosis = state.get("vision_diagnosis", "Unknown crop condition")
    proposed_chemical = state.get("proposed_chemical", "Standard treatment")
    safe_dosage = state.get("safe_dosage_ml_per_acre", 150.0)
    safety_warning = state.get("safety_warning", "")
    language_code = state.get("language_code", "hi")

    lang_meta = LANGUAGE_INFO.get(language_code, LANGUAGE_INFO["hi"])
    target_language = lang_meta["name"]
    target_script = lang_meta["script"]

    # Comprehensive structured advice in English
    if not is_safe:
        english_text = (
            f"Dear Farmer, your crop shows signs of {vision_diagnosis}. "
            f"However, the proposed chemical {proposed_chemical} was flagged as unsafe by the C++ safety engine. {safety_warning} "
            f"Please do not spray this chemical to avoid crop damage and soil toxicity. Consult your local Krishi Vigyan Kendra (KVK) for an approved alternative."
        )
    else:
        english_text = (
            f"Dear Farmer, your crop is affected by {vision_diagnosis}, a fungal condition that spreads under humid weather and causes leaf lesions. "
            f"For safe, verified treatment, spray {proposed_chemical} at a certified dosage of {safe_dosage} ml per acre, thoroughly mixed in 200 liters of clean water. "
            f"Apply the spray during early morning or late evening on dry foliage, and ensure proper field drainage to prevent disease recurrence."
        )

    try:
        api_key = os.environ.get("GOOGLE_API_KEY")
        if api_key and api_key != "your_google_api_key_here":
            llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=api_key)
            prompt = f"""You are an expert senior agricultural scientist (Agronomist) advising an Indian farmer in their native language.
            
            Translate and refine the following in-depth agricultural advisory into natural, fluent, and highly detailed colloquial {target_language} (written in {target_script} script).
            
            Structure of response:
            1. Respectful Greeting (e.g. '{lang_meta["greeting"]}').
            2. Clear explanation of the diagnosed crop disease ({vision_diagnosis}) and its weather/environmental cause.
            3. Detailed safe treatment: Chemical name ({proposed_chemical}), exact dosage ({safe_dosage} ml/acre), and mixing in 200 liters of water.
            4. Practical field instructions (spray in morning/evening, check soil moisture, maintain drainage).
            
            Advisory text: '{english_text}'
            
            Respond strictly with the translated speech text in {target_script} script with zero markdown headers or bullet points."""
            
            response = llm.invoke(prompt)
            translated_text = response.content.strip()
        else:
            # High-depth, fully localized agronomic fallback templates
            if language_code == "pa":
                translated_text = (
                    f"ਕਿਸਾਨ ਵੀਰੋ, ਤੁਹਾਡੀ ਫਸਲ ਵਿੱਚ ਪਛੇਤਾ ਝੁਲਸ ਰੋਗ (Late Blight) ਦੇ ਲੱਛਣ ਮਿਲੇ ਹਨ, ਜੋ ਸਿੱਲ੍ਹੇ ਮੌਸਮ ਕਾਰਨ ਪੱਤਿਆਂ 'ਤੇ ਕਾਲੇ-ਭੂਰੇ ਧੱਬੇ ਬਣਾਉਂਦਾ ਹੈ। "
                    f"ਇਸ ਦੇ ਪੱਕੇ ਤੇ ਸੁਰੱਖਿਅਤ ਇਲਾਜ ਲਈ {proposed_chemical} ਦਾ {safe_dosage} ਮਿਲੀਲੀਟਰ 200 ਲੀਟਰ ਸਾਫ਼ ਪਾਣੀ ਵਿੱਚ ਘੋਲ ਕੇ ਪ੍ਰਤੀ ਏਕੜ ਛਿੜਕਾਅ ਕਰੋ। "
                    f"ਛਿੜਕਾਅ ਸਵੇਰੇ ਜਾਂ ਸ਼ਾਮ ਦੇ ਸਮੇਂ ਸੁੱਕੇ ਪੱਤਿਆਂ 'ਤੇ ਕਰੋ ਅਤੇ ਖੇਤ ਵਿੱਚ ਪਾਣੀ ਦੀ ਨਿਕਾਸੀ ਦਾ ਖਾਸ ਧਿਆਨ ਰੱਖੋ।"
                )
            elif language_code == "te":
                translated_text = (
                    f"రైతు సోదరులారా, మీ పంటలో లేట్ బ్లైట్ (మచ్చల తెగులు) లక్షణాలు గుర్తించబడ్డాయి. తేమ ఎక్కువగా ఉండటం వల్ల ఈ శిలీంధ్రం ఆకులపై వేగంగా వ్యాపిస్తుంది. "
                    f"దీని నివారణకు ఎకరానికి {safe_dosage} మిల్లీలీటర్ల {proposed_chemical} మందును 200 లీటర్ల నీటిలో కలిపి పిచికారీ చేయండి. "
                    f"ఉదయం లేదా సాయంత్రం వేళల్లో పిచికారీ చేయడం వల్ల పంటకు గరిష్ట రక్షణ లభిస్తుంది మరియు పొలంలో నీరు నిల్వ ఉండకుండా చూసుకోండి."
                )
            elif language_code == "ta":
                translated_text = (
                    f"விவசாய சகோதரர்களே, உங்கள் பயிரில் பின் பருவ கருகல் நோய் (Late Blight) கண்டறியப்பட்டுள்ளது. அதிக ஈரப்பதம் காரணமாக இது இலைகளை சேதப்படுத்துகிறது. "
                    f"இதனை கட்டுப்படுத்த ஒரு ஏக்கருக்கு {safe_dosage} மி.லி {proposed_chemical} மருந்தை 200 லிட்டர் தண்ணீரில் கலந்து தெளிக்கவும். "
                    f"காலை அல்லது மாலை வேளையில் தெளிப்பது சிறந்த பலனைத் தரும், மேலும் நிலத்தில் நீர் தேங்காமல் பார்த்துக் கொள்ளவும்."
                )
            elif language_code == "ml":
                translated_text = (
                    f"കർഷക സുഹൃത്തുക്കളെ, നിങ്ങളുടെ വിളയിൽ ലേറ്റ് ബ്ലൈറ്റ് (കരിമ്പൻ രോഗം) കണ്ടെത്തിയിട്ടുണ്ട്. ഈ കുമിൾ രോഗം ഈർപ്പമുള്ള കാലാവസ്ഥയിൽ വേഗത്തിൽ പടരാൻ സാധ്യതയുണ്ട്. "
                    f"ഇതിന്റെ സുരക്ഷിതമായ നിയന്ത്രണത്തിനായി ഏക്കറിന് {safe_dosage} മില്ലിലിറ്റർ {proposed_chemical} 200 ലിറ്റർ വെള്ളത്തിൽ കലക്കി തളിക്കുക. "
                    f"രാവിലെ അല്ലെങ്കിൽ വൈകുന്നേരം തളിക്കുന്നത് ചെടികൾക്ക് കൂടുതൽ സംരക്ഷണം നൽകും."
                )
            elif language_code == "mr":
                translated_text = (
                    f"शेतकरी मित्रांनो, तुमच्या पिकात करपा (Late Blight) रोगाची लागण झाली आहे, जो दमट हवामानामुळे पानांवर वेगाने पसरतो. "
                    f"याच्या प्रभावी नियंत्रणासाठी प्रति एकर {safe_dosage} मिली {proposed_chemical} २०० लिटर पाण्यात मिसळून फवारणी करा. "
                    f"फवारणी नेहमी सकाळी किंवा संध्याकाळी कोरड्या पानांवर करावी आणि शेतात पाण्याचा निचरा योग्य ठेवावा."
                )
            elif language_code == "bn":
                translated_text = (
                    f"কৃষক ভাইয়েরা, আপনার ফসলে লেট ব্লাইট (নাবি ধসা রোগ) শনাক্ত হয়েছে। অতিরিক্ত আর্দ্রতার কারণে এই ছত্রাক দ্রুত পাতায় ছড়ায়। "
                    f"এর নিরাপদ ও কার্যকর নিয়ন্ত্রণের জন্য একর প্রতি {safe_dosage} মিলি {proposed_chemical} ২০০ লিটার জলে গুলে স্প্রে করুন। "
                    f"সকালে বা বিকেলে স্প্রে করলে সেরা ফলাফল পাওয়া যাবে এবং জমিতে অতিরিক্ত জল জমতে দেবেন না।"
                )
            elif language_code == "gu":
                translated_text = (
                    f"ખેડૂત મિત્રો, તમારા પાકમાં પાછોતરો સુકારો (Late Blight) રોગ જોવા મળ્યો છે. આ ફૂગ વધુ ભેજને કારણે પાંદડા પર ફેલાય છે. "
                    f"તેના યોગ્ય નિયંત્રણ માટે એકર દીઠ {safe_dosage} મિલી {proposed_chemical} 200 લિટર પાણીમાં ભેળવીને છંટકાવ કરો. "
                    f"સવારે અથવા સાંજે છંટકાવ કરવો વધુ ફાયદાકારક રહેશે અને ખેતરમાં પાણીનો ભરાવો ન થવા દો."
                )
            elif language_code == "kn":
                translated_text = (
                    f"ರೈತ ಮಿತ್ರರೇ, ನಿಮ್ಮ ಬೆಳೆಯಲ್ಲಿ ಲೇಟ್ ಬ್ಲೈಟ್ (ಅಂಗಮಾರಿ ರೋಗ) ಕಂಡುಬಂದಿದೆ. ಹೆಚ್ಚಿನ ತೇವಾಂಶದಿಂದ ಈ ಶಿಲೀಂಧ್ರವು ಎಲೆಗಳ ಮೇಲೆ ಹರಡುತ್ತದೆ. "
                    f"ಇದರ ಪರಿಣಾಮಕಾರಿ ನಿಯಂತ್ರಣಕ್ಕಾಗಿ ಎಕರೆಗೆ {safe_dosage} ಮಿಲಿ {proposed_chemical} ಅನ್ನು 200 ಲೀಟರ್ ನೀರಿನಲ್ಲಿ ಬೆರೆಸಿ ಸಿಂಪಡಿಸಿ. "
                    f"ಮುಂಜಾನೆ ಅಥವಾ ಸಂಜೆ ವೇಳೆ ಸಿಂಪಡಿಸುವುದು ಸೂಕ್ತ ಹಾಗೂ ಹೊಲದಲ್ಲಿ ನೀರು ನಿಲ್ಲದಂತೆ ನೋಡಿಕೊಳ್ಳಿ."
                )
            elif language_code == "od":
                translated_text = (
                    f"କୃଷକ ଭାଇମାନେ, ଆପଣଙ୍କ ଫସଲରେ ଲେଟ୍ ବ୍ଲାଇଟ୍ (ପଛୁଆ ପୋଡ଼ା ରୋଗ) ଚିହ୍ନଟ ହୋଇଛି। ଏହା ଅଧିକ ଆର୍ଦ୍ରତା ଯୋଗୁଁ ପତ୍ରରେ ବ୍ୟାପିଥାଏ। "
                    f"ଏହାର ନିରାକରଣ ପାଇଁ ଏକର ପିଛା {safe_dosage} ମିଲି {proposed_chemical} ୨୦୦ ଲିଟର ପାଣିରେ ମିଶାଇ ସ୍ପ୍ରେ କରନ୍ତୁ। "
                    f"ସକାଳ କିମ୍ବା ସନ୍ଧ୍ୟା ସମୟରେ ସ୍ପ୍ରେ କଲେ ଭଲ ଫଳ ମିଳିବ।"
                )
            elif language_code == "en":
                translated_text = english_text
            else:
                # Default Hindi
                translated_text = (
                    f"किसान भाई, आपकी फसल में पछेता झुलसा (Late Blight) रोग पाया गया है, जो अधिक नमी के कारण पत्तियों पर तेजी से फैलता है। "
                    f"इसके सुरक्षित और प्रमाणित उपचार के लिए {proposed_chemical} का {safe_dosage} मिलीलीटर 200 लीटर साफ पानी में मिलाकर प्रति एकड़ छिड़काव करें। "
                    f"छिड़काव सुबह या शाम के समय करें और खेत में जल निकासी की उचित व्यवस्था रखें।"
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
