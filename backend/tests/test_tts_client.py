try:
    import pytest
except ImportError:
    pytest = None
import io
import wave
from app.services.tts_client import split_text_into_chunks, concatenate_wav_bytes

def make_test_wav(num_samples: int = 1600, sample_rate: int = 16000) -> bytes:
    """Creates a valid 16-bit mono PCM WAV file in memory."""
    buf = io.BytesIO()
    with wave.open(buf, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sample_rate)
        w.writeframes(b'\x05\x00' * num_samples)
    return buf.getvalue()

def test_split_text_into_chunks_short_text():
    """Short text under max_chars must remain a single chunk."""
    text = "नमस्ते किसान भाई। आपकी टमाटर की फसल स्वस्थ है।"
    chunks = split_text_into_chunks(text, max_chars=450)
    assert len(chunks) == 1
    assert chunks[0] == text

def test_split_text_into_chunks_long_hindi_advisory():
    """
    Long multi-sentence text must be split into chunks all <= max_chars
    without losing content or truncating prematurely.
    """
    text = (
        "नमस्ते किसान भाई। आपकी फसल की जांच की गई है और आपकी टमाटर की फसल में अर्ली ब्लाइट रोग का पता चला है। "
        "आपकी वर्तमान खेत की मौसम की स्थिति इसके लिए पूरी तरह अनुकूल है, जहाँ तापमान 29.3°C, आर्द्रता 22.0%, हवा की गति 11.5 किमी/घंटा "
        "और वायु गुणवत्ता सूचकांक AQI 3 - मध्यम है, इसलिए इस समय दवा का छिड़काव करना बिल्कुल सुरक्षित है। "
        "फसल की सुरक्षित और प्रमाणित देखभाल के लिए, आप 150.0 मिलीलीटर एक्सीोस्ट्रोबिन 18.2% + डिफेनोकोनाज़ोल 11.4% एससी दवा को प्रति एकड़ के हिसाब से लें "
        "और इसे 200 लीटर साफ पानी में अच्छी तरह मिलाकर सुबह-सुबह या देर शाम को छिड़काव करें। "
        "यदि आपको फसल से जुड़ी कोई भी अन्य समस्या या अधिक मार्गदर्शन चाहिए, तो कृपया आईसीएआर-कृषि विज्ञान केंद्र समराला से संपर्क करें।"
    )
    chunks = split_text_into_chunks(text, max_chars=450)
    assert len(chunks) >= 2
    for chunk in chunks:
        assert len(chunk) <= 450
        assert len(chunk.strip()) > 0
    
    # Verify no characters were discarded at the critical cutoff point
    reconstructed = " ".join(chunks)
    assert "150.0 मिलीलीटर" in reconstructed
    assert "एक्सीोस्ट्रोबिन" in reconstructed
    assert "समराला" in reconstructed

def test_concatenate_wav_bytes_single():
    """Single WAV returns unchanged."""
    w1 = make_test_wav(800)
    res = concatenate_wav_bytes([w1])
    assert res == w1

def test_concatenate_wav_bytes_multiple():
    """Multiple WAV clips are merged into a single continuous stream."""
    w1 = make_test_wav(1600)  # 0.1s
    w2 = make_test_wav(2400)  # 0.15s
    merged = concatenate_wav_bytes([w1, w2])
    
    with wave.open(io.BytesIO(merged), 'rb') as r:
        assert r.getnchannels() == 1
        assert r.getsampwidth() == 2
        assert r.getframerate() == 16000
        assert r.getnframes() == 4000  # 1600 + 2400
