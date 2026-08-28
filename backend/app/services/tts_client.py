import os
import asyncio
import time
import base64
import httpx
import edge_tts
from dotenv import load_dotenv

# Ensure environment variables are loaded
load_dotenv()

class TTSClient:
    def __init__(self):
        # We'll save files in a public static directory for the frontend to access
        self.output_dir = os.path.join(os.path.dirname(__file__), "..", "..", "static", "audio")
        os.makedirs(self.output_dir, exist_ok=True)
        self.sarvam_url = "https://api.sarvam.ai/text-to-speech"

    async def generate_audio(self, text: str, language_code: str = "hi") -> str:
        """
        Generates authentic Indic TTS audio using Sarvam AI (Bulbul:v3).
        Automatically falls back to Edge-TTS if Sarvam API is unreachable or key is missing.
        """
        sarvam_key = os.environ.get("SARVAM_API_KEY")

        # Map generic language code to Sarvam Bhashini / Indic language codes
        sarvam_lang_map = {
            "hi": "hi-IN",
            "pa": "pa-IN",
            "ta": "ta-IN",
            "te": "te-IN",
            "bn": "bn-IN",
            "mr": "mr-IN",
            "gu": "gu-IN",
            "kn": "kn-IN",
            "en": "en-IN"
        }

        # ---------------------------------------------------------------------
        # PRIMARY: SARVAM AI (BULBUL V3 INDIC SPEECH ENGINE)
        # ---------------------------------------------------------------------
        if sarvam_key and sarvam_key.strip():
            try:
                print(f"[SARVAM AI] Synthesizing voice via Bulbul:v3 ({language_code})...")
                target_lang = sarvam_lang_map.get(language_code, "hi-IN")
                
                headers = {
                    "api-subscription-key": sarvam_key.strip(),
                    "Content-Type": "application/json"
                }

                payload = {
                    "inputs": [text],
                    "target_language_code": target_lang,
                    "speaker": "shubh",
                    "pace": 1.0,
                    "enable_preprocessing": True,
                    "model": "bulbul:v3"
                }

                async with httpx.AsyncClient(timeout=15.0) as client:
                    response = await client.post(self.sarvam_url, headers=headers, json=payload)
                    
                    if response.status_code == 200:
                        data = response.json()
                        audios = data.get("audios", [])
                        if audios:
                            audio_bytes = base64.b64decode(audios[0])
                            filename = f"treatment_sarvam_{int(time.time())}.wav"
                            filepath = os.path.join(self.output_dir, filename)
                            
                            with open(filepath, "wb") as f:
                                f.write(audio_bytes)
                                
                            print(f"[SARVAM AI] Success: {len(audio_bytes)} audio bytes written to {filename}")
                            return f"/static/audio/{filename}"
                    else:
                        print(f"[SARVAM AI] Warning (Status {response.status_code}): {response.text}")
            except Exception as e:
                print(f"[SARVAM AI] Error: {str(e)}. Falling back to Edge-TTS...")

        # ---------------------------------------------------------------------
        # SECONDARY / FALLBACK: MICROSOFT EDGE NEURAL TTS
        # ---------------------------------------------------------------------
        print("[EDGE-TTS] Fallback Triggered...")
        edge_voice_map = {
            "hi": "hi-IN-MadhurNeural",
            "pa": "pa-IN-OjasNeural",
            "en": "en-IN-PrabhatNeural"
        }
        
        voice = edge_voice_map.get(language_code, "hi-IN-MadhurNeural")
        filename = f"treatment_edge_{int(time.time())}.mp3"
        filepath = os.path.join(self.output_dir, filename)
        
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(filepath)
        
        return f"/static/audio/{filename}"

tts_client = TTSClient()
