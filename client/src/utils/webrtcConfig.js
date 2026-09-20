import api from "../services/api";

export const RTC_CONFIG = {
  iceServers: [
    // High-availability global STUN servers
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    { urls: "stun:stun.cloudflare.com:3478" },
    { urls: "stun:stun.relay.metered.ca:80" },
    // Public fallback TURN servers (OpenRelay / Metered)
    {
      urls: "turn:standard.relay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:standard.relay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:standard.relay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    ...(import.meta.env.VITE_TURN_SERVER_URL
      ? [
          {
            urls: import.meta.env.VITE_TURN_SERVER_URL,
            username: import.meta.env.VITE_TURN_USERNAME || "",
            credential: import.meta.env.VITE_TURN_PASSWORD || "",
          },
        ]
      : []),
  ],
  bundlePolicy: "max-bundle",
  rtcpMuxPolicy: "require",
  iceTransportPolicy: "all",
  iceCandidatePoolSize: 10,
};

let cachedConfig = null;
let lastFetchTime = 0;

export const getResolvedRTCConfig = async () => {
  const now = Date.now();
  if (cachedConfig && now - lastFetchTime < 1000 * 60 * 15) return cachedConfig;

  // 1. Try server endpoint first
  try {
    const { data } = await api.get("/chat/ice-servers");
    if (data?.data?.iceServers && Array.isArray(data.data.iceServers) && data.data.iceServers.length > 0) {
      cachedConfig = {
        ...RTC_CONFIG,
        iceServers: [
          ...RTC_CONFIG.iceServers.filter((s) => typeof s.urls === "string" && s.urls.startsWith("stun:")),
          ...data.data.iceServers,
        ],
        iceCandidatePoolSize: 10,
      };
      lastFetchTime = now;
      return cachedConfig;
    }
  } catch (err) {
    console.warn("[WebRTC] Backend ICE config fetch warning:", err?.message);
  }

  // 2. Direct fetch from Metered TURN API (CORS enabled, highly resilient fallback)
  try {
    const res = await fetch(
      "https://skillora.metered.live/api/v1/turn/credentials?apiKey=f1609f77d3601710203890700dc0914b2422"
    );
    if (res.ok) {
      const meteredServers = await res.json();
      if (Array.isArray(meteredServers) && meteredServers.length > 0) {
        cachedConfig = {
          ...RTC_CONFIG,
          iceServers: [
            ...RTC_CONFIG.iceServers.filter((s) => typeof s.urls === "string" && s.urls.startsWith("stun:")),
            ...meteredServers,
          ],
          iceCandidatePoolSize: 10,
        };
        lastFetchTime = now;
        console.log("[WebRTC] Loaded active Metered TURN relay endpoints successfully");
        return cachedConfig;
      }
    }
  } catch (err) {
    console.warn("[WebRTC] Direct Metered TURN fetch warning:", err?.message);
  }

  return RTC_CONFIG;
};

