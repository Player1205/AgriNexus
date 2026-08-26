import os
import asyncio
import edge_tts
import time

class TTSClient:
    def __init__(self):
        # We'll save files in a public static directory for the frontend to access
        self.output_dir = os.path.join(os.path.dirname(__file__), "..", "..", "static", "audio")
        os.makedirs(self.output_dir, exist_ok=True)

    async def generate_audio(self, text: str, language_code: str = "hi") -> str:
        """
        Generates TTS audio using edge-tts. 
        language_code maps to specific voices. Default is Hindi.
        """
        # Map generic language code to edge-tts voice
        voice_map = {
            "hi": "hi-IN-MadhurNeural",
            "pa": "pa-IN-OjasNeural",
            "en": "en-IN-PrabhatNeural"
        }
        
        voice = voice_map.get(language_code, "hi-IN-MadhurNeural")
        
        filename = f"treatment_{int(time.time())}.mp3"
        filepath = os.path.join(self.output_dir, filename)
        
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(filepath)
        
        # Return the URL path that the FastAPI server will expose
        return f"/static/audio/{filename}"

tts_client = TTSClient()
