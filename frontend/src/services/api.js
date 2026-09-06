export const getBaseApiUrl = () => {
    return import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : '';
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

const getClientLocation = () => {
    return new Promise((resolve) => {
        if (cachedCoordinates) {
            resolve(cachedCoordinates);
            return;
        }

        if (!navigator.geolocation) {
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

export const uploadImage = async (file, language = 'hi') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', language);

    // Capture live device coordinates if permitted
    try {
        const loc = await getClientLocation();
        if (loc) {
            formData.append('latitude', loc.latitude.toString());
            formData.append('longitude', loc.longitude.toString());
        }
    } catch {
        // Continue smoothly on fallback
    }

    const baseUrl = getBaseApiUrl();
    const endpoint = baseUrl ? `${baseUrl}/api/v1/analyze` : '/api/v1/analyze';

    const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error('Analysis failed');
    }

    return await response.json();
};

export const createTelemetrySocket = (onMessage) => {
    let wsUrl;
    const apiUrl = getBaseApiUrl();

    if (apiUrl) {
        const wsProtocol = apiUrl.startsWith('https') ? 'wss:' : 'ws:';
        const host = apiUrl.replace(/^https?:\/\//, '');
        wsUrl = `${wsProtocol}//${host}/ws/telemetry`;
    } else {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${protocol}//${window.location.host}/ws/telemetry`;
    }

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
        console.warn("Telemetry WebSocket error:", err);
    };

    return ws;
};
