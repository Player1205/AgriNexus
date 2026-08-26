export const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

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
    // In production, use wss:// and correct domain
    const ws = new WebSocket(`ws://${window.location.host}/ws/telemetry`);
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        onMessage(data);
    };

    return ws;
};
