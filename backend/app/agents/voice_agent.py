from app.state import AgriNexusState
from app.services.tts_client import tts_client
import os
from langchain_google_genai import ChatGoogleGenerativeAI

async def voice_node(state: AgriNexusState) -> AgriNexusState:
    """
    Agent 5: Vernacular Translation & Voice Synthesis.
    """
    if not state.is_safe:
        english_text = f"Warning: The detected issue is {state.vision_diagnosis}, but the proposed treatment {state.proposed_chemical} is unsafe. {state.safety_warning}"
    else:
        english_text = f"Your crop has {state.vision_diagnosis}. The safe treatment is {state.proposed_chemical} at {state.safe_dosage_ml_per_acre} ml per acre. {state.safety_warning}"

    try:
        api_key = os.environ.get("GOOGLE_API_KEY")
        if api_key and api_key != "your_google_api_key_here":
            llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=api_key)
            prompt = f"Translate the following agricultural advice into simple, colloquial Hindi suitable for a farmer. Text: '{english_text}'"
            response = llm.invoke(prompt)
            hindi_text = response.content.strip()
        else:
            # Fallback mock translation
            hindi_text = f"किसान भाई, आपकी फसल में {state.vision_diagnosis} है। कृपया {state.proposed_chemical} का प्रयोग करें।"

        state.translated_text = hindi_text
        
        # Generate TTS audio
        audio_url = await tts_client.generate_audio(hindi_text, "hi")
        state.vernacular_audio_url = audio_url

    except Exception as e:
        state.errors.append(f"Voice Agent Error: {str(e)}")
        state.translated_text = english_text
        state.vernacular_audio_url = None

    return state
