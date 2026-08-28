from app.state import AgriNexusState
from app.services.tts_client import tts_client
import os
from langchain_google_genai import ChatGoogleGenerativeAI

async def voice_node(state: AgriNexusState) -> dict:
    """
    Agent 5: Vernacular Translation & Voice Synthesis.
    """
    is_safe = state.get("is_safe", False)
    vision_diagnosis = state.get("vision_diagnosis", "Unknown crop condition")
    proposed_chemical = state.get("proposed_chemical", "Standard treatment")
    safe_dosage = state.get("safe_dosage_ml_per_acre", 0.0)
    safety_warning = state.get("safety_warning", "")

    if not is_safe:
        english_text = f"Warning: The detected issue is {vision_diagnosis}, but the proposed treatment {proposed_chemical} is unsafe. {safety_warning}"
    else:
        english_text = f"Your crop has {vision_diagnosis}. The safe treatment is {proposed_chemical} at {safe_dosage} ml per acre. {safety_warning}"

    try:
        api_key = os.environ.get("GOOGLE_API_KEY")
        if api_key and api_key != "your_google_api_key_here":
            llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=api_key)
            prompt = f"""Translate the following agricultural advice into pure, natural, and highly fluent colloquial Hindi suitable for a farmer. 
            Do NOT mix English words like 'detected' in the Hindi output. 
            Translate disease names to their common Hindi agricultural terms where possible (e.g., Stripe Rust -> पीला रतुआ).
            Make it sound like a friendly human agronomist speaking naturally.
            Text: '{english_text}'"""
            response = llm.invoke(prompt)
            hindi_text = response.content.strip()
        else:
            # Fallback mock translation with clean Hindi grammar
            clean_diagnosis = vision_diagnosis.replace("detected.", "").replace("detected", "").strip()
            hindi_text = f"किसान भाई, आपकी फसल में {clean_diagnosis} की पुष्टि हुई है। आपकी फसल की सुरक्षा के लिए {proposed_chemical} का {safe_dosage} मिलीलीटर प्रति एकड़ की दर से छिड़काव करना सबसे सुरक्षित रहेगा।"

        # Generate TTS audio
        audio_url = await tts_client.generate_audio(hindi_text, "hi")

        return {
            "translated_text": hindi_text,
            "vernacular_audio_url": audio_url
        }

    except Exception as e:
        return {
            "errors": [f"Voice Agent Error: {str(e)}"],
            "translated_text": english_text,
            "vernacular_audio_url": None
        }
