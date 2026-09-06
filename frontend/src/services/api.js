import { runOfflineSwarmPipeline } from './swarmOrchestrator';

export const getBaseApiUrl = () => {
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL.replace(/\/$/, '');
    }
    // Auto-detect production hosting (e.g. Vercel) and route to Render backend
    if (typeof window !== 'undefined' && window.location.hostname && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
        return 'https://agrinexus-backend.onrender.com';
    }
    return '';
};

let cachedCoordinates = null;

// Pre-warm location cache immediately on load
if (typeof window !== 'undefined' && 'geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            cachedCoordinates = {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
            };
        },
        () => {},
        { timeout: 6000, maximumAge: 300000, enableHighAccuracy: false }
    );
}

// Pre-warm Render cloud server on page load to eliminate cold-start latency
if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && navigator.onLine) {
    const serverUrl = getBaseApiUrl();
    if (serverUrl) {
        fetch(`${serverUrl}/health`, { mode: 'cors' }).catch(() => {});
    }
}

export const getClientLocation = () => {
    return new Promise((resolve) => {
        if (cachedCoordinates) {
            resolve(cachedCoordinates);
            return;
        }

        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            resolve(null);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                cachedCoordinates = {
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                };
                resolve(cachedCoordinates);
            },
            () => {
                // Denied or unavailable, resolve null without error
                resolve(null);
            },
            { timeout: 6000, maximumAge: 300000, enableHighAccuracy: false }
        );
    });
};

/**
 * Unified Edge-to-Cloud Analysis Dispatcher.
 * Automatically runs 100% On-Device when offline or if server is unreachable.
 */
export const uploadImage = async (file, language = 'hi') => {
    let loc = null;
    try {
        loc = await getClientLocation();
    } catch {
        // Fallback safely
    }

    // 1. If device is explicitly offline, immediately run On-Device Swarm
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        console.log("[AGRINEXUS OFFLINE] Network is disconnected. Executing 100% On-Device Multi-Agent Swarm...");
        return await runOfflineSwarmPipeline(file, language, loc);
    }

    // 2. Online Mode: Attempt Cloud Swarm with automated On-Device Fallback
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('language', language);

        if (loc) {
            formData.append('latitude', loc.latitude.toString());
            formData.append('longitude', loc.longitude.toString());
        }

        const baseUrl = getBaseApiUrl();
        const endpoint = baseUrl ? `${baseUrl}/api/v1/analyze` : '/api/v1/analyze';

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 35000); // 35s timeout to handle Render cold-start wakeups

        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Server returned status ${response.status}`);
        }

        return await response.json();
    } catch (err) {
        console.warn(`[AGRINEXUS HYBRID] Cloud server unreachable (${err.message}). Seamlessly engaging On-Device Multi-Agent Swarm...`);
        // Seamlessly fallback to 100% On-Device Swarm
        return await runOfflineSwarmPipeline(file, language, loc);
    }
};

export const createTelemetrySocket = (onMessage) => {
    // Register local telemetry callback for on-device swarm
    if (typeof window !== 'undefined') {
        window.__agrinexus_telemetry_listener = onMessage;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return { close: () => {} };
    }

    let wsUrl;
    const apiUrl = getBaseApiUrl();

    if (apiUrl) {
        const wsProtocol = apiUrl.startsWith('https') ? 'wss:' : 'ws:';
        const host = apiUrl.replace(/^https?:\/\//, '');
        wsUrl = `${wsProtocol}//${host}/ws/telemetry`;
    } else {
        const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = typeof window !== 'undefined' ? window.location.host : 'localhost:8000';
        wsUrl = `${protocol}//${host}/ws/telemetry`;
    }

    try {
        const ws = new WebSocket(wsUrl);
        
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                onMessage(data);
            } catch (err) {
                console.error("Telemetry WebSocket message parse error:", err);
            }
        };

        ws.onerror = (err) => {
            console.warn("Telemetry WebSocket offline/unreachable:", err);
        };

        return ws;
    } catch {
        return { close: () => {} };
    }
};
