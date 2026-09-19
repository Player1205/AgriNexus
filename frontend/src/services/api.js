import { runOfflineSwarmPipeline } from "./swarmOrchestrator";

export const getBaseApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, "");
  }
  if (
    typeof window !== "undefined" &&
    window.location &&
    window.location.hostname
  ) {
    const host = window.location.hostname;
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.startsWith("192.168.") ||
      host.startsWith("10.") ||
      host.startsWith("172.")
    ) {
      return `http://${host}:8000`;
    }
  }
  return "";
};

let cachedCoordinates = null;

// Pre-warm location cache immediately on load
if (typeof window !== "undefined" && "geolocation" in navigator) {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      cachedCoordinates = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
    },
    () => {},
    { timeout: 6000, maximumAge: 300000, enableHighAccuracy: false },
  );
}

// Pre-warm Render cloud server on page load to eliminate cold-start latency
if (
  typeof window !== "undefined" &&
  typeof navigator !== "undefined" &&
  navigator.onLine
) {
  const serverUrl = getBaseApiUrl();
  if (serverUrl) {
    fetch(`${serverUrl}/health`, { mode: "cors" }).catch(() => {});
  }
}

export const getClientLocation = () => {
  return new Promise((resolve) => {
    if (cachedCoordinates) {
      resolve(cachedCoordinates);
      return;
    }

    if (typeof navigator === "undefined" || !navigator.geolocation) {
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
      { timeout: 6000, maximumAge: 300000, enableHighAccuracy: false },
    );
  });
};

/**
 * Unified Edge-to-Cloud Analysis Dispatcher.
 * Automatically runs 100% On-Device when offline or if server is unreachable.
 * Each upload generates a unique session_id to scope telemetry events.
 */
export const uploadImage = async (file, language = "hi", locOverride = null) => {
  let loc = locOverride;
  if (!loc) {
      try {
        loc = await getClientLocation();
      } catch {
        // Fallback safely
      }
  }

  // Generate a unique session ID for this specific upload
  const sessionId = Math.random().toString(36).substring(2, 10);
  if (typeof window !== 'undefined') {
      window.__agrinexus_active_session = sessionId;
  }

  // 1. If device is explicitly offline, immediately run On-Device Swarm
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    console.log(
      "[AGRINEXUS OFFLINE] Network is disconnected. Executing 100% On-Device Multi-Agent Swarm...",
    );
    return await runOfflineSwarmPipeline(file, language, loc, null, sessionId);
  }

  // 2. Online Mode: Attempt Cloud Swarm with automated On-Device Fallback
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("language", language);
    formData.append("session_id", sessionId);

    if (loc) {
      formData.append("latitude", loc.latitude.toString());
      formData.append("longitude", loc.longitude.toString());
    }

    const baseUrl = getBaseApiUrl();
    const endpoint = baseUrl ? `${baseUrl}/api/v1/analyze` : '/api/v1/analyze';
    const token =
      typeof localStorage !== "undefined"
        ? localStorage.getItem("agrinexus_auth_token")
        : null;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000); // 35s timeout to handle Render cold-start wakeups

    const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
    }

    const result = await response.json();
    // Update the active session to the one the server generated
    if (result.session_id && typeof window !== 'undefined') {
        window.__agrinexus_active_session = result.session_id;
    }
    return result;
  } catch (err) {
    console.warn(`[AGRINEXUS HYBRID] Cloud server unreachable (${err.message}). Seamlessly engaging On-Device Multi-Agent Swarm...`);
    // Seamlessly fallback to 100% On-Device Swarm
    return await runOfflineSwarmPipeline(file, language, loc, null, sessionId);
  }
};

export const createTelemetrySocket = (onMessage, listenerId = "default") => {
  // Register local telemetry callback for on-device swarm
  if (typeof window !== "undefined") {
    if (!window.__agrinexus_telemetry_listeners) {
      window.__agrinexus_telemetry_listeners = {};
    }
    // Overwrite previous listener with the same ID to prevent React Strict Mode duplication
    window.__agrinexus_telemetry_listeners[listenerId] = onMessage;
  }

  const unregisterLocal = () => {
    if (typeof window !== "undefined" && window.__agrinexus_telemetry_listeners) {
      delete window.__agrinexus_telemetry_listeners[listenerId];
    }
  };

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    // Return a mock WebSocket-like object that supports onclose property binding
    const mock = {
      close: unregisterLocal,
      onclose: null,
      onmessage: null,
      onerror: null
    };
    return mock;
  }

  let wsUrl;
  const apiUrl = getBaseApiUrl();

  if (apiUrl) {
    const wsProtocol = apiUrl.startsWith("https") ? "wss:" : "ws:";
    const host = apiUrl.replace(/^https?:\/\//, "");
    wsUrl = `${wsProtocol}//${host}/ws/telemetry`;
  } else {
    const protocol = typeof window !== "undefined" && window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = typeof window !== "undefined" ? window.location.host : "localhost:8000";
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

    const originalClose = ws.close.bind(ws);
    ws.close = () => {
      unregisterLocal();
      originalClose();
    };

    return ws;
  } catch {
    const mock = {
      close: unregisterLocal,
      onclose: null,
      onmessage: null,
      onerror: null
    };
    // If an onclose handler gets attached later, we trigger it asynchronously to simulate failure
    setTimeout(() => {
      if (typeof mock.onclose === 'function') mock.onclose();
    }, 100);
    return mock;
  }
};

export const getUserScans = async () => {
  const baseUrl = getBaseApiUrl();
  const token =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("agrinexus_auth_token")
      : null;
  if (!token) return { scans: [], count: 0 };

  const response = await fetch(`${baseUrl}/api/v1/user/scans`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to load scans: ${response.status}`);
  }
  return await response.json();
};

export const deleteUserScan = async (scanId) => {
  const baseUrl = getBaseApiUrl();
  const token =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("agrinexus_auth_token")
      : null;
  if (!token) return false;

  const response = await fetch(`${baseUrl}/api/v1/user/scans/${scanId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to delete scan: ${response.status}`);
  }
  return await response.json();
};
