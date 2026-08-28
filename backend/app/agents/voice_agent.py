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
    Agent 5: Vernacular Translation & Multilingual Voice Synthesis.
    Translates treatment plans into farmer's native tongue and synthesizes voice via Sarvam AI.
    """
    is_safe = state.get("is_safe", False)
    vision_diagnosis = state.get("vision_diagnosis", "Unknown crop condition")
    proposed_chemical = state.get("proposed_chemical", "Standard treatment")
    safe_dosage = state.get("safe_dosage_ml_per_acre", 0.0)
    safety_warning = state.get("safety_warning", "")
    language_code = state.get("language_code", "hi")

    lang_meta = LANGUAGE_INFO.get(language_code, LANGUAGE_INFO["hi"])
    target_language = lang_meta["name"]
    target_script = lang_meta["script"]

    if not is_safe:
        english_text = f"Warning: The detected issue is {vision_diagnosis}, but the proposed treatment {proposed_chemical} is unsafe. {safety_warning}"
    else:
        english_text = f"Your crop has {vision_diagnosis}. The safe treatment is {proposed_chemical} at {safe_dosage} ml per acre. {safety_warning}"

    try:
        api_key = os.environ.get("GOOGLE_API_KEY")
        if api_key and api_key != "your_google_api_key_here":
            llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=api_key)
            prompt = f"""Translate the following agricultural advisory into natural, highly fluent, colloquial {target_language} (in {target_script} script) suitable for an Indian farmer.
            
            Guidelines:
            1. Use native vernacular agricultural terms and natural phrasing.
            2. Do NOT leave English words like 'detected' or 'warning' untranslated unless it is a standard chemical brand name.
            3. Address the farmer respectfully (like '{lang_meta["greeting"]}').
            4. Keep the output strictly in {target_language} script.
            
            Text to translate: '{english_text}'"""
            
            response = llm.invoke(prompt)
            translated_text = response.content.strip()
        else:
            # Native fallback templates
            clean_diagnosis = vision_diagnosis.replace("detected.", "").replace("detected", "").strip()
            if language_code == "pa":
                translated_text = f"ਕਿਸਾਨ ਵੀਰੋ, ਤੁਹਾਡੀ ਫਸਲ ਵਿੱਚ {clean_diagnosis} ਪਾਇਆ ਗਿਆ ਹੈ। ਫਸਲ ਦੀ ਸੁਰੱਖਿਆ ਲਈ {proposed_chemical} ਦਾ {safe_dosage} ਮਿਲੀਲੀਟਰ ਪ੍ਰਤੀ ਏਕੜ ਛਿੜਕਾਅ ਕਰੋ।"
            elif language_code == "te":
                translated_text = f"రైతు సోదరులారా, మీ పంటలో {clean_diagnosis} గుర్తించబడింది. సురక్షిత చికిత్స కోసం {proposed_chemical} {safe_dosage} మిల్లీలీటర్లు ఎకరానికి పిచికారీ చేయండి."
            elif language_code == "ta":
                translated_text = f"விவசாய சகோதரர்களே, உங்கள் பயிரில் {clean_diagnosis} கண்டறியப்பட்டுள்ளது. பாதுகாப்பான சிகிச்சைக்கு {proposed_chemical} {safe_dosage} மிலி தெளிக்கவும்."
            elif language_code == "ml":
                translated_text = f"കർഷക സുഹൃത്തുക്കളെ, നിങ്ങളുടെ വിളയിൽ {clean_diagnosis} സ്ഥിരീകരിച്ചു. സുരക്ഷിതമായ ചികിത്സക്കായി {proposed_chemical} {safe_dosage} മില്ലിലിറ്റർ തളിക്കുക."
            elif language_code == "mr":
                translated_text = f"शेतकरी मित्रांनो, तुमच्या पिकात {clean_diagnosis} आढळून आले आहे. सुरक्षित उपचारासाठी {proposed_chemical} {safe_dosage} मिली प्रति एकर फवारणी करा."
            elif language_code == "bn":
                translated_text = f"কৃষক ভাইয়েরা, আপনার ফসলে {clean_diagnosis} শনাক্ত হয়েছে। নিরাপদ চিকিৎসার জন্য {proposed_chemical} {safe_dosage} মিলি স্প্রে করুন।"
            elif language_code == "gu":
                translated_text = f"ખેડૂત મિત્રો, તમારા પાકમાં {clean_diagnosis} જોવા મળેલ છે. યોગ્ય ઉપચાર માટે {proposed_chemical} નો {safe_dosage} મિલી છંટકાવ કરો."
            elif language_code == "kn":
                translated_text = f"ರೈತ ಮಿತ್ರರೇ, ನಿಮ್ಮ ಬೆಳೆಯಲ್ಲಿ {clean_diagnosis} ಕಂಡುಬಂದಿದೆ. ಸುರಕ್ಷಿತ ಚಿಕಿತ್ಸೆಗಾಗಿ {proposed_chemical} {safe_dosage} ಮಿಲಿ ಸಿಂಪಡಿಸಿ."
            elif language_code == "od":
                translated_text = f"କୃଷକ ଭାଇମାନେ, ଆପଣଙ୍କ ଫସଲରେ {clean_diagnosis} ଚିହ୍ନଟ ହୋଇଛି। ସୁରକ୍ଷିତ ଉପଚାର ପାଇଁ {proposed_chemical} {safe_dosage} ମିଲି ସ୍ପ୍ରେ କରନ୍ତୁ।"
            elif language_code == "en":
                translated_text = english_text
            else:
                # Default Hindi
                translated_text = f"किसान भाई, आपकी फसल में {clean_diagnosis} की पुष्टि हुई है। आपकी फसल की सुरक्षा के लिए {proposed_chemical} का {safe_dosage} मिलीलीटर प्रति एकड़ की दर से छिड़काव करना सबसे सुरक्षित रहेगा।"

        # Generate TTS audio via Sarvam AI (or Edge-TTS fallback) in the requested language
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
