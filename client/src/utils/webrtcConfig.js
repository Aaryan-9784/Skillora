import api from "../services/api";

export const RTC_CONFIG = {
  iceServers: [
    // 100% Free Global STUN Servers (Google & Cloudflare) - Zero Cost Forever
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    { urls: "stun:stun.cloudflare.com:3478" },
    { urls: "stun:stun.relay.metered.ca:80" },
    // Metered TURN Relay Endpoints
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
  iceCandidatePoolSize: 10,
};

let cachedConfig = null;
let lastFetchTime = 0;

export const getResolvedRTCConfig = async () => {
  const now = Date.now();
  if (cachedConfig && now - lastFetchTime < 1000 * 60 * 15) return cachedConfig;
  try {
    const { data } = await api.get("/chat/ice-servers");
    if (data?.data?.iceServers && Array.isArray(data.data.iceServers) && data.data.iceServers.length > 0) {
      cachedConfig = {
        ...RTC_CONFIG,
        iceServers: data.data.iceServers,
      };
      lastFetchTime = now;
      return cachedConfig;
    }
  } catch {
    // Graceful fallback to static RTC_CONFIG
  }
  return RTC_CONFIG;
};
