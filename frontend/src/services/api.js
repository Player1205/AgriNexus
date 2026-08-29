const getClientLocation = () => {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve(null);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                resolve({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                });
            },
            () => {
                // Denied or unavailable, resolve null without error
                resolve(null);
            },
            { timeout: 1500, maximumAge: 60000 }
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

    const response = await fetch('/api/v1/analyze', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error('Analysis failed');
    }

    return await response.json();
};

export const createTelemetrySocket = (onMessage) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/telemetry`);
    
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
