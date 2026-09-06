import { runEdgeVisionAgent } from './edgeVisionAgent';
import { runEdgeRagAgent } from './edgeRagAgent';
import { runEdgeSafetyAgent } from './edgeSafetyAgent';
import { runEdgeWeb3Agent } from './edgeWeb3Agent';
import { runEdgeVoiceAgent } from './edgeVoiceAgent';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Executes the complete 5-Agent Multi-Agent Swarm (MAS) directly inside the mobile browser.
 * Emits real-time telemetry updates to notify visual laser paths and telemetry ledgers.
 */
export const runOfflineSwarmPipeline = async (file, language = 'hi', location = null, onTelemetryUpdate = null) => {
    console.log("[OFFLINE SWARM] Initiating 100% On-Device Multi-Agent Swarm Execution...");

    const initialState = {
        image_path: file ? file.name : 'offline_capture.jpg',
        language_code: language,
        current_temperature: 28.0,
        current_humidity: 75.0,
        rain_risk_6h_percent: 15.0,
        wind_speed_kmh: 5.0,
        is_spray_safe: true,
        location_source: location ? "DEVICE_LIVE_GPS" : "REGIONAL_BASELINE",
        client_latitude: location ? location.latitude : 30.9010,
        client_longitude: location ? location.longitude : 75.8573,
        errors: []
    };

    let currentState = { ...initialState };

    const broadcastLocal = (nodeName, stateUpdate) => {
        currentState = { ...currentState, ...stateUpdate };
        if (typeof onTelemetryUpdate === 'function') {
            onTelemetryUpdate({ node: nodeName, state: currentState });
        }
        // Also trigger any global window telemetry subscribers
        if (typeof window !== 'undefined' && window.__agrinexus_telemetry_listener) {
            window.__agrinexus_telemetry_listener({ node: nodeName, state: currentState });
        }
    };

    // -------------------------------------------------------------------------
    // AGENT 1: In-Browser Vision Pathology & Domain Gatekeeper
    // -------------------------------------------------------------------------
    console.log("[AGENT 1 - VISION] Running On-Device Foliar Feature Extraction...");
    const visionOutput = await runEdgeVisionAgent(file);
    broadcastLocal('vision', visionOutput);
    await delay(700);

    // -------------------------------------------------------------------------
    // AGENT 2: In-Memory ICAR Agronomy RAG
    // -------------------------------------------------------------------------
    console.log("[AGENT 2 - RAG] Querying In-Memory Certified ICAR Database...");
    const ragOutput = await runEdgeRagAgent(currentState);
    broadcastLocal('rag', ragOutput);
    await delay(700);

    // -------------------------------------------------------------------------
    // AGENT 3: Deterministic Mathematical Safety Core & KVK Resolver
    // -------------------------------------------------------------------------
    console.log("[AGENT 3 - SAFETY] Clamping MIC Floor & Resolving Nearest KVK...");
    const safetyOutput = await runEdgeSafetyAgent(currentState);
    broadcastLocal('safety', safetyOutput);
    await delay(700);

    // -------------------------------------------------------------------------
    // AGENT 4: On-Device Cryptographic Web3 Passport Relayer
    // -------------------------------------------------------------------------
    console.log("[AGENT 4 - WEB3] Generating On-Device Cryptographic Passport...");
    const web3Output = await runEdgeWeb3Agent(currentState);
    broadcastLocal('web3', web3Output);
    await delay(700);

    // -------------------------------------------------------------------------
    // AGENT 5: Vernacular Acoustic & Speech Synthesis
    // -------------------------------------------------------------------------
    console.log("[AGENT 5 - VOICE] Synthesizing Vernacular Spoken Advisory...");
    const voiceOutput = await runEdgeVoiceAgent(currentState);
    broadcastLocal('voice', voiceOutput);

    console.log("[OFFLINE SWARM] Completed 5-Agent Execution 100% On-Device!");

    return {
        ...currentState,
        weather_data: {
            temperature_c: currentState.current_temperature,
            relative_humidity: currentState.current_humidity,
            rain_risk_6h_percent: currentState.rain_risk_6h_percent,
            wind_speed_kmh: currentState.wind_speed_kmh,
            is_spray_safe: currentState.is_spray_safe,
            location_source: currentState.location_source,
            latitude: currentState.client_latitude,
            longitude: currentState.client_longitude
        }
    };
};
