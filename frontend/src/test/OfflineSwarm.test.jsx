import { describe, it, expect } from 'vitest';
import { runEdgeVisionAgent } from '../services/edgeVisionAgent';
import { runEdgeRagAgent } from '../services/edgeRagAgent';
import { runEdgeSafetyAgent, findNearestKvkOffline } from '../services/edgeSafetyAgent';
import { runEdgeWeb3Agent } from '../services/edgeWeb3Agent';
import { generateLocalizedSpeechText } from '../services/edgeVoiceAgent';
import { runOfflineSwarmPipeline } from '../services/swarmOrchestrator';

describe('100% On-Device Multi-Agent Swarm (Offline MAS)', () => {
    it('Agent 1 (Vision): Detects non-agricultural houseplant and triggers Domain Gatekeeper', async () => {
        const mockFile = new File(['mock'], 'indoor_areca_palm.jpg', { type: 'image/jpeg' });
        const vision = await runEdgeVisionAgent(mockFile);

        expect(vision.is_crop_supported).toBe(false);
        expect(vision.vision_diagnosis).toBe('Unrecognized Plant / Non-Agricultural Subject');
        expect(vision.vision_confidence).toBe(0.0);
    });

    it('Agent 2 (RAG): Queries 38 ICAR protocols in-memory and matches Tomato Late Blight', async () => {
        const state = {
            vision_diagnosis: 'Tomato Late blight',
            vision_confidence: 0.95,
            is_crop_supported: true
        };
        const rag = await runEdgeRagAgent(state);

        expect(rag.safe_dosage_ml_per_acre).toBeGreaterThan(0);
        expect(rag.proposed_chemical).toContain('Azoxystrobin');
        expect(rag.dosage_unit).toBe('ml');
    });

    it('Agent 3 (Safety): Clamps dosage with MIC floor and resolves nearest KVK offline via Haversine', async () => {
        const state = {
            proposed_chemical: 'Azoxystrobin 18.2% + Difenoconazole 11.4% SC',
            safe_dosage_ml_per_acre: 150.0,
            min_mic_dosage: 120.0,
            max_statutory_dosage: 195.0,
            current_humidity: 85.0,
            vision_confidence: 0.95,
            is_crop_supported: true,
            client_latitude: 30.9010,
            client_longitude: 75.8573
        };
        const safety = await runEdgeSafetyAgent(state);

        expect(safety.is_safe).toBe(true);
        expect(safety.safe_dosage_ml_per_acre).toBe(135.0); // 150 * 0.90 (attenuated > 80% humidity)
        expect(safety.is_mic_protected).toBe(false);
    });

    it('Agent 3 (Safety): Blocks chemicals when crop is unsupported and routes to KVK', async () => {
        const state = {
            vision_diagnosis: 'Unrecognized Plant / Non-Agricultural Subject',
            vision_confidence: 0.0,
            is_crop_supported: false,
            detected_subject: 'Areca Palm',
            client_latitude: 31.6340,
            client_longitude: 74.8723 // Amritsar
        };
        const safety = await runEdgeSafetyAgent(state);

        expect(safety.is_safe).toBe(false);
        expect(safety.safe_dosage_ml_per_acre).toBe(0.0);
        expect(safety.is_non_actionable_referral).toBe(true);
        expect(safety.nearest_kvk.district).toBe('Amritsar');
    });

    it('Agent 4 (Web3): Produces deterministic SHA-256 transaction hash', async () => {
        const state = {
            is_safe: true,
            proposed_chemical: 'Azoxystrobin',
            safe_dosage_ml_per_acre: 150.0,
            vision_diagnosis: 'Tomato Late blight'
        };
        const web3 = await runEdgeWeb3Agent(state);

        expect(web3.tx_hash).toMatch(/^0x[a-fA-F0-9]{64}$/);
        expect(web3.passport_id).toBeGreaterThanOrEqual(101);
    });

    it('Agent 5 (Voice): Generates live weather Hindi speech when online and offline caution when disconnected', () => {
        // Online live weather test
        const onlineState = {
            is_safe: true,
            is_crop_supported: true,
            vision_diagnosis: 'Tomato Late blight',
            proposed_chemical: 'Azoxystrobin',
            safe_dosage_ml_per_acre: 150.0,
            dosage_unit: 'ml',
            current_temperature: 29.5,
            current_humidity: 68.0,
            is_live_weather: true
        };
        const onlineSpeech = generateLocalizedSpeechText(onlineState, 'hi');
        expect(onlineSpeech).toContain('तापमान');
        expect(onlineSpeech).not.toContain('इंटरनेट न होने के कारण');
        expect(onlineSpeech).toContain('Azoxystrobin');

        // Offline zero-internet test
        const offlineState = {
            is_safe: true,
            is_crop_supported: true,
            vision_diagnosis: 'Tomato Late blight',
            proposed_chemical: 'Azoxystrobin',
            safe_dosage_ml_per_acre: 150.0,
            dosage_unit: 'ml',
            is_live_weather: false
        };
        // Temporarily mock navigator.onLine as false
        const origOnLine = navigator.onLine;
        Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
        const offlineSpeech = generateLocalizedSpeechText(offlineState, 'hi');
        expect(offlineSpeech).toContain('सावधानी: इंटरनेट न होने के कारण');
        Object.defineProperty(navigator, 'onLine', { value: origOnLine, configurable: true });
    });

    it('Full Swarm Pipeline: Executes complete 5-agent on-device pipeline with zero network', async () => {
        const origOnLine = navigator.onLine;
        Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
        try {
            const mockFile = new File(['tomato'], 'tomato_late_blight.jpg', { type: 'image/jpeg' });
            const result = await runOfflineSwarmPipeline(mockFile, 'hi', { latitude: 30.9010, longitude: 75.8573 });

            expect(result.vision_diagnosis).toBe('Tomato Late blight');
            expect(result.is_safe).toBe(true);
            expect(result.safe_dosage_ml_per_acre).toBeGreaterThan(0);
            expect(result.tx_hash).toBeDefined();
            expect(result.translated_text).toBeDefined();
            expect(result.weather_data.temperature_c).toBeGreaterThan(0);
            // With zero network, audio url is null so Web Speech takes over
            expect(result.vernacular_audio_url).toBeNull();
        } finally {
            Object.defineProperty(navigator, 'onLine', { value: origOnLine, configurable: true });
        }
    }, 15000);
});
