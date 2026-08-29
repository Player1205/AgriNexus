export const uploadImage = async (file, language = 'hi') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', language);

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
