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
    console.log("[OFFLINE SWARM] Initiating On-Device Multi-Agent Swarm Execution...");

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : false;
    let currentTemp = 28.0;
    let currentHumidity = 75.0;
    let rainRisk = 15.0;
    let windSpeed = 5.0;
    let isLiveWeather = isOnline;
    let locationSource = location ? "DEVICE_LIVE_GPS" : "REGIONAL_BASELINE";
    const lat = location ? location.latitude : 30.9010;
    const lng = location ? location.longitude : 75.8573;

    // Fetch live satellite weather if phone has internet
    if (isOnline) {
        // Cascade 1: Open-Meteo
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 6000);
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&hourly=precipitation_probability&forecast_hours=6`, { signal: controller.signal });
            clearTimeout(timer);
            if (res.ok) {
                const data = await res.json();
                const curr = data.current || {};
                const hourly = data.hourly || {};
                const maxRain = hourly.precipitation_probability ? Math.max(...hourly.precipitation_probability) : 0;
                currentTemp = Math.round((curr.temperature_2m ?? 28.0) * 10) / 10;
                currentHumidity = Math.round((curr.relative_humidity_2m ?? 75.0) * 10) / 10;
                rainRisk = Math.round(maxRain);
                windSpeed = Math.round((curr.wind_speed_10m ?? 5.0) * 10) / 10;
                isLiveWeather = true;
                locationSource = location ? "DEVICE_LIVE_GPS" : "REGIONAL_LIVE_WEATHER";
            } else {
                throw new Error("Open-Meteo failed");
            }
        } catch (e) {
            console.warn("[SWARM WEATHER] Open-Meteo failed, trying Met.no...", e);
            // Cascade 2: Met.no (Norwegian Meteorological Institute)
            try {
                const controller2 = new AbortController();
                const timer2 = setTimeout(() => controller2.abort(), 6000);
                const res2 = await fetch(`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lng}`, {
                    headers: { "User-Agent": "AgriNexus-App/1.0" },
                    signal: controller2.signal
                });
                clearTimeout(timer2);
                if (res2.ok) {
                    const data2 = await res2.json();
                    const current = data2.properties.timeseries[0].data.instant.details;
                    const next6h = data2.properties.timeseries[0].data.next_1_hours?.details || {};
                    
                    currentTemp = Math.round((current.air_temperature ?? 28.0) * 10) / 10;
                    currentHumidity = Math.round((current.relative_humidity ?? 75.0) * 10) / 10;
                    windSpeed = Math.round(((current.wind_speed ?? 1.67) * 3.6) * 10) / 10; // m/s to km/h
                    rainRisk = Math.round(next6h.probability_of_precipitation || 0.0);
                    isLiveWeather = true;
                    locationSource = location ? "DEVICE_LIVE_GPS" : "REGIONAL_LIVE_WEATHER";
                } else {
                    throw new Error("Met.no failed");
                }
            } catch (e2) {
                console.warn("[SWARM WEATHER] Met.no failed, trying WTTR.in...", e2);
                // Cascade 3: WTTR.in
                try {
                    const controller3 = new AbortController();
                    const timer3 = setTimeout(() => controller3.abort(), 6000);
                    const res3 = await fetch(`https://wttr.in/${lat},${lng}?format=j1`, { signal: controller3.signal });
                    clearTimeout(timer3);
                    if (res3.ok) {
                        const data3 = await res3.json();
                        const current = data3.current_condition[0];
                        currentTemp = parseFloat(current.temp_C ?? 28.0);
                        currentHumidity = parseFloat(current.humidity ?? 75.0);
                        windSpeed = parseFloat(current.windspeedKmph ?? 6.0);
                        
                        const hourly = data3.weather[0]?.hourly || [];
                        const rainProbs = hourly.slice(0, 2).map(h => parseFloat(h.chanceofrain || 0));
                        rainRisk = Math.round(Math.max(...rainProbs, 0.0));
                        isLiveWeather = true;
                        locationSource = location ? "DEVICE_LIVE_GPS" : "REGIONAL_LIVE_WEATHER";
                    } else {
                        throw new Error("WTTR.in failed");
                    }
                } catch (e3) {
                    console.warn("[SWARM WEATHER] All API Cascades failed. Falling back to offline baseline.", e3);
                    isLiveWeather = false;
                    locationSource = "OFFLINE_FALLBACK";
                }
            }
        }
    }

    const initialState = {
        image_path: file ? file.name : 'offline_capture.jpg',
        language_code: language,
        current_temperature: currentTemp,
        current_humidity: currentHumidity,
        rain_risk_6h_percent: rainRisk,
        wind_speed_kmh: windSpeed,
        is_spray_safe: (windSpeed <= 15.0) && (rainRisk < 35.0) && (currentTemp <= 36.0),
        location_source: locationSource,
        is_live_weather: isLiveWeather,
        client_latitude: lat,
        client_longitude: lng,
        errors: []
    };

    let currentState = { ...initialState };

    const broadcastLocal = (nodeName, stateUpdate) => {
        currentState = { ...currentState, ...stateUpdate };
        if (typeof onTelemetryUpdate === 'function') {
            onTelemetryUpdate({ node: nodeName, state: currentState });
        }
        // Also trigger any global window telemetry subscribers
        if (typeof window !== 'undefined' && window.__agrinexus_telemetry_listeners) {
            Object.values(window.__agrinexus_telemetry_listeners).forEach(listener => {
                try {
                    listener({ node: nodeName, state: currentState });
                } catch (e) {
                    console.error(e);
                }
            });
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
