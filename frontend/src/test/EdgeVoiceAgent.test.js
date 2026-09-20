import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    synthesizeSarvamSpeech,
    speakVernacularOffline,
    runEdgeVoiceAgent,
    resetSarvamQuotaStatus,
    isSarvamQuotaExhaustedStatus,
    generateLocalizedSpeechText
} from '../services/edgeVoiceAgent';

describe('EdgeVoiceAgent & Sarvam Quota Failover Suite', () => {
    let speakMock;
    let cancelMock;
    let resumeMock;

    beforeEach(() => {
        resetSarvamQuotaStatus();
        vi.restoreAllMocks();

        speakMock = vi.fn();
        cancelMock = vi.fn();
        resumeMock = vi.fn();

        window.speechSynthesis = {
            speak: speakMock,
            cancel: cancelMock,
            resume: resumeMock,
            paused: false,
            getVoices: vi.fn(() => [
                { lang: 'hi-IN', name: 'Google हिन्दी' },
                { lang: 'pa-IN', name: 'Google ਪੰਜਾਬੀ' },
                { lang: 'te-IN', name: 'Google తెలుగు' },
                { lang: 'ta-IN', name: 'Google தமிழ்' },
                { lang: 'en-IN', name: 'Google English' }
            ])
        };

        // Default online navigator
        Object.defineProperty(navigator, 'onLine', {
            configurable: true,
            value: true
        });
    });

    it('generates localized agronomic text for Hindi, Punjabi, and Telugu', () => {
        const state = {
            vision_diagnosis: 'Tomato Late blight',
            is_safe: true,
            proposed_chemical: 'Metalaxyl 8% + Mancozeb 64% WP',
            safe_dosage_ml_per_acre: 500,
            dosage_unit: 'g',
            current_temperature: 25.0,
            current_humidity: 60.0,
            rain_risk_6h_percent: 10,
            wind_speed_kmh: 8.0,
            is_live_weather: true
        };

        const hindiText = generateLocalizedSpeechText(state, 'hi');
        expect(hindiText).toContain('टमाटर का पछेती झुलसा रोग');
        expect(hindiText).toContain('Metalaxyl 8% + Mancozeb 64% WP');

        const punjabiText = generateLocalizedSpeechText(state, 'pa');
        expect(punjabiText).toContain('ਟਮਾਟਰ ਦਾ ਪਛੇਤਾ ਝੁਲਸਾ ਰੋਗ');

        const teluguText = generateLocalizedSpeechText(state, 'te');
        expect(teluguText).toContain('టమాటా లేట్ బ్లైట్ తెగులు');
    });

    it('immediately flags quota exhaustion and returns null when Sarvam AI returns HTTP 429', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 429,
            statusText: 'Too Many Requests',
            text: async () => 'Rate limit exceeded: Daily free tier quota reached'
        });

        expect(isSarvamQuotaExhaustedStatus()).toBe(false);

        const result = await synthesizeSarvamSpeech('Test agronomic advice', 'hi');
        expect(result).toBeNull();
        expect(isSarvamQuotaExhaustedStatus()).toBe(true);
    });

    it('instantly fast-paths subsequent calls when Sarvam quota is exhausted without issuing network fetch', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 429,
            statusText: 'Too Many Requests'
        });

        await synthesizeSarvamSpeech('First request', 'hi');
        expect(global.fetch).toHaveBeenCalledTimes(1);

        // Second call should bypass fetch completely
        const secondResult = await synthesizeSarvamSpeech('Second request', 'hi');
        expect(secondResult).toBeNull();
        expect(global.fetch).toHaveBeenCalledTimes(1); // Still 1 call!
    });

    it('automatically falls back to mobile internal speech synthesis when Sarvam quota is reached', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 429,
            statusText: 'Too Many Requests'
        });

        const state = {
            vision_diagnosis: 'Tomato Late blight',
            is_safe: true,
            proposed_chemical: 'Metalaxyl',
            safe_dosage_ml_per_acre: 500,
            dosage_unit: 'g',
            language_code: 'hi'
        };

        const agentOutput = await runEdgeVoiceAgent(state);

        expect(agentOutput.vernacular_audio_url).toBeNull();
        expect(agentOutput.language_code).toBe('hi');
        expect(agentOutput.translated_text).toBeTruthy();

        // Verifies mobile internal speech was invoked
        expect(speakMock).toHaveBeenCalledTimes(1);
        const utterance = speakMock.mock.calls[0][0];
        expect(utterance.lang).toBe('hi-IN');
    });

    it('speakVernacularOffline speaks on device even if online when allowOnlineFallback is true', () => {
        // Connected online
        expect(navigator.onLine).toBe(true);

        // Standard offline call is suppressed when online without flag
        speakVernacularOffline('Should not speak', 'hi', false);
        expect(speakMock).not.toHaveBeenCalled();

        // Explicit fallback allows mobile speech synthesis when Sarvam is exhausted
        speakVernacularOffline('Emergency fallback speech', 'pa', true);
        expect(speakMock).toHaveBeenCalledTimes(1);
        const utterance = speakMock.mock.calls[0][0];
        expect(utterance.lang).toBe('pa-IN');
        expect(utterance.text).toBe('Emergency fallback speech');
    });
});
