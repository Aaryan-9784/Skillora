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
    // 100% Free Public OpenRelay TURN Servers (Metered Community - Zero Cost)
    {
      urls: "stun:openrelay.metered.ca:80",
    },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
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

export const getResolvedRTCConfig = async () => {
  if (cachedConfig) return cachedConfig;
  try {
    const { data } = await api.get("/chat/ice-servers");
    if (data?.data?.iceServers && Array.isArray(data.data.iceServers) && data.data.iceServers.length > 0) {
      cachedConfig = {
        ...RTC_CONFIG,
        iceServers: data.data.iceServers,
      };
      return cachedConfig;
    }
  } catch {
    // Graceful fallback to static RTC_CONFIG
  }
  return RTC_CONFIG;
};
