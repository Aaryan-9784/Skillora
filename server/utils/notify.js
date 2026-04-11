const Notification = require("../models/Notification");
const logger       = require("./logger");

/**
 * Create a notification and emit it via Socket.io in real-time.
 * Fire-and-forget — never throws.
 */
const notify = async (opts) => {
  try {
    const notification = await Notification.create(opts);

    // Lazy-require to avoid circular deps
    const { emitNotification } = require("../config/socket");
    emitNotification(opts.recipient, notification);
  } catch (err) {
    logger.error(`Failed to create notification: ${err.message}`);
  }
};

module.exports = notify;
