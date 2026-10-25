import os
import asyncio
import time
import base64
import wave
import io
import httpx
import edge_tts
from dotenv import load_dotenv

# Ensure environment variables are loaded
load_dotenv()

def split_text_into_chunks(text: str, max_chars: int = 450) -> list[str]:
    """
    Splits long Indic / multilingual advisory text into natural sentence or phrase chunks
    strictly under max_chars (Sarvam AI limit is 500 chars), preventing cut-offs.
    """
    text = text.strip()
    if not text:
        return []
    if len(text) <= max_chars:
        return [text]

    chunks = []
    delimiters = ['।', '.', '?', '!', '\n', ';', ',']
    current = text

    while len(current) > max_chars:
        best_split = -1
        for delim in delimiters:
            pos = current[:max_chars].rfind(delim)
            if pos > best_split:
                best_split = pos

        # If no punctuation delimiter in window, fall back to whitespace
        if best_split <= 50:
            best_split = current[:max_chars].rfind(' ')

        # If still no suitable split point, hard break at max_chars
        if best_split <= 0:
            best_split = max_chars
        else:
            best_split += 1  # include delimiter

        chunk = current[:best_split].strip()
        if chunk:
            chunks.append(chunk)
        current = current[best_split:].strip()

    if current:
        chunks.append(current)

    return chunks

def concatenate_wav_bytes(wav_bytes_list: list[bytes]) -> bytes:
    """
    Merges multiple PCM WAV audio byte buffers into a single continuous WAV file
    using Python's standard library wave and io modules.
    """
    if not wav_bytes_list:
        return b""
    valid_wavs = [b for b in wav_bytes_list if b and len(b) >= 44]
    if not valid_wavs:
        return b""
    if len(valid_wavs) == 1:
        return valid_wavs[0]

    output_io = io.BytesIO()
    try:
        with wave.open(io.BytesIO(valid_wavs[0]), 'rb') as first_wav:
            params = first_wav.getparams()
            frames = [first_wav.readframes(first_wav.getnframes())]

        for wb in valid_wavs[1:]:
            with wave.open(io.BytesIO(wb), 'rb') as next_wav:
                frames.append(next_wav.readframes(next_wav.getnframes()))

        with wave.open(output_io, 'wb') as out_wav:
            out_wav.setparams(params)
            for f in frames:
                out_wav.writeframes(f)

        return output_io.getvalue()
    except Exception as e:
        print(f"[WAV CONCAT ERROR] {e}. Falling back to first audio chunk...")
        return valid_wavs[0]

class TTSClient:
    def __init__(self):
        # Public static directory for audio files
        self.output_dir = os.path.join(os.path.dirname(__file__), "..", "..", "static", "audio")
        os.makedirs(self.output_dir, exist_ok=True)
        self.sarvam_url = "https://api.sarvam.ai/text-to-speech"

    async def generate_audio(self, text: str, language_code: str = "hi") -> str | None:
        """
        Generates authentic Indic TTS audio using Sarvam AI (Bulbul:v3).
        Supports 11 regional languages: Hindi, Punjabi, Telugu, Tamil, Malayalam, Kannada, Bengali, Marathi, Gujarati, Odia, English.
        Automatically falls back to Microsoft Edge Neural TTS if Sarvam API is unreachable or key is missing.
        Gracefully returns None if completely offline so on-device client Web Speech API takes over.
        """
        sarvam_key = os.environ.get("SARVAM_API_KEY")

        # Map generic language code to Sarvam Bhashini / Indic language codes
        sarvam_lang_map = {
            "hi": "hi-IN",
            "pa": "pa-IN",
            "te": "te-IN",
            "ta": "ta-IN",
            "ml": "ml-IN",
            "kn": "kn-IN",
            "bn": "bn-IN",
            "mr": "mr-IN",
            "gu": "gu-IN",
            "od": "od-IN",
            "en": "en-IN"
        }

        # ---------------------------------------------------------------------
        # PRIMARY: SARVAM AI (BULBUL V3 INDIC SPEECH ENGINE - MULTI-CHUNK)
        # ---------------------------------------------------------------------
        if sarvam_key and sarvam_key.strip():
            try:
                target_lang = sarvam_lang_map.get(language_code, "hi-IN")
                print(f"[SARVAM AI] Synthesizing voice via Bulbul:v3 for {target_lang}...")
                
                headers = {
                    "api-subscription-key": sarvam_key.strip(),
                    "Content-Type": "application/json"
                }

                # Split entire text into natural phrase chunks under Sarvam's 500-char limit
                chunks = split_text_into_chunks(text, max_chars=450)
                if not chunks:
                    chunks = [text]

                collected_wav_bytes = []
                async with httpx.AsyncClient(timeout=15.0) as client:
                    # Attempt batch input first
                    payload = {
                        "inputs": chunks,
                        "target_language_code": target_lang,
                        "speaker": "shubh",
                        "pace": 1.0,
                        "enable_preprocessing": True,
                        "model": "bulbul:v3"
                    }
                    response = await client.post(self.sarvam_url, headers=headers, json=payload)
                    
                    if response.status_code == 200:
                        data = response.json()
                        audios = data.get("audios", [])
                        for a in audios:
                            if a:
                                collected_wav_bytes.append(base64.b64decode(a))
                    else:
                        print(f"[SARVAM AI] Batch failed ({response.status_code}). Attempting chunk-by-chunk synthesis...")
                        for chunk in chunks:
                            chunk_payload = {
                                "inputs": [chunk],
                                "target_language_code": target_lang,
                                "speaker": "shubh",
                                "pace": 1.0,
                                "enable_preprocessing": True,
                                "model": "bulbul:v3"
                            }
                            c_res = await client.post(self.sarvam_url, headers=headers, json=chunk_payload)
                            if c_res.status_code == 200:
                                c_data = c_res.json()
                                c_audios = c_data.get("audios", [])
                                if c_audios and c_audios[0]:
                                    collected_wav_bytes.append(base64.b64decode(c_audios[0]))

                if collected_wav_bytes:
                    merged_audio = concatenate_wav_bytes(collected_wav_bytes)
                    filename = f"treatment_sarvam_{language_code}_{int(time.time())}.wav"
                    filepath = os.path.join(self.output_dir, filename)
                    
                    with open(filepath, "wb") as f:
                        f.write(merged_audio)
                        
                    print(f"[SARVAM AI] Success: {len(chunks)} chunks synthesized ({len(merged_audio)} bytes, {filename})")
                    return f"/static/audio/{filename}"
                else:
                    print("[SARVAM AI] Warning: No audio received from Sarvam API. Falling back to Edge-TTS...")
            except Exception as e:
                print(f"[SARVAM AI] Error: {str(e)}. Falling back to Edge-TTS...")

        # ---------------------------------------------------------------------
        # SECONDARY / FALLBACK: MICROSOFT EDGE NEURAL TTS
        # ---------------------------------------------------------------------
        try:
            print(f"[EDGE-TTS] Fallback Triggered for language '{language_code}'...")
            edge_voice_map = {
                "hi": "hi-IN-MadhurNeural",
                "pa": "pa-IN-OjasNeural",
                "te": "te-IN-MohanNeural",
                "ta": "ta-IN-ValluvarNeural",
                "ml": "ml-IN-MidhunNeural",
                "kn": "kn-IN-GaganNeural",
                "bn": "bn-IN-BashkarNeural",
                "mr": "mr-IN-AarohiNeural",
                "gu": "gu-IN-DhwaniNeural",
                "od": "hi-IN-MadhurNeural", # Odia fallback
                "en": "en-IN-PrabhatNeural"
            }
            
            voice = edge_voice_map.get(language_code, "hi-IN-MadhurNeural")
            filename = f"treatment_edge_{language_code}_{int(time.time())}.mp3"
            filepath = os.path.join(self.output_dir, filename)
            
            communicate = edge_tts.Communicate(text, voice)
            await communicate.save(filepath)
            
            return f"/static/audio/{filename}"
        except Exception as err:
            print(f"[EDGE-TTS Offline] Cloud TTS unavailable: {err}. On-device Web Speech API will handle acoustic playback.")
            return None

    # Alias for backwards compatibility
    synthesize_speech = generate_audio

tts_client = TTSClient()
