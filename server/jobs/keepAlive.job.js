const logger = require("../utils/logger");

/**
 * Self-ping job for Render free tier.
 * Render free web services spin down after 15 minutes of inactivity.
 * Pinging /health every 10 minutes keeps the service warm and responsive.
 */
const startKeepAlive = () => {
  const url =
    process.env.RENDER_EXTERNAL_URL ||
    process.env.SERVER_URL ||
    (process.env.NODE_ENV === "production" ? "https://skillora-hyf8.onrender.com" : null);

  if (!url) return;

  const target = `${url.replace(/\/$/, "")}/health`;

  // Ping every 10 minutes (600,000 ms)
  const INTERVAL = 10 * 60 * 1000;

  const ping = async () => {
    try {
      const res = await fetch(target);
      if (res.ok) {
        logger.info(`[KeepAlive] Pinged ${target} (status ${res.status})`);
      }
    } catch (err) {
      logger.warn(`[KeepAlive] Ping failed: ${err.message}`);
    }
  };

  setInterval(ping, INTERVAL);
  logger.info(`[KeepAlive] Scheduled keep-alive ping for ${target} every 10 minutes`);
};

module.exports = { startKeepAlive };
