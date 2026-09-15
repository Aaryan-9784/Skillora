const Notification = require("../models/Notification");
const logger       = require("./logger");

/**
 * Create a notification and emit it via Socket.io in real-time.
 * Fire-and-forget — never throws.
 */
const notify = async (opts) => {
  try {
    const payload = { ...opts };
    if (!payload.recipient && payload.recipientId) {
      payload.recipient = payload.recipientId;
    }
    const notification = await Notification.create(payload);

    // Lazy-require to avoid circular deps
    const { emitNotification } = require("../config/socket");
    emitNotification(payload.recipient, notification);
  } catch (err) {
    logger.error(`Failed to create notification: ${err.message}`);
  }
};

module.exports = notify;
