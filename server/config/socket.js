const { Server } = require("socket.io");
const jwt        = require("jsonwebtoken");
const logger     = require("../utils/logger");

let io = null;

// Map userId → Set of socket IDs (one user can have multiple tabs)
const userSockets = new Map();

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin:      process.env.CLIENT_URL,
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  // ── Auth middleware ───────────────────────────────────
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(" ")[1];

    if (!token) return next(new Error("Authentication required"));

    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.userId = decoded.id.toString();
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  // ── Connection handler ────────────────────────────────
  io.on("connection", async (socket) => {
    const { userId } = socket;
    logger.info(`Socket connected: ${socket.id} (user: ${userId})`);

    // Track socket
    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId).add(socket.id);

    // Join personal room
    socket.join(`user:${userId}`);

    // Join role-based rooms for broadcast targeting
    try {
      const User = require("../models/User");
      const user = await User.findById(userId).select("role").lean();
      if (user?.role === "admin")  socket.join("role:admin");
      if (user?.role === "client") socket.join("role:client");
    } catch { /* non-fatal */ }

    socket.on("disconnect", () => {
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) userSockets.delete(userId);
      }
      logger.info(`Socket disconnected: ${socket.id}`);
    });

    // Ping/pong for connection health
    socket.on("ping", () => socket.emit("pong"));
  });

  logger.info("Socket.io initialized");
  return io;
};

/**
 * Emit a real-time event to a specific user (all their tabs).
 */
const emitToUser = (userId, event, data) => {
  if (!io) return;
  io.to(`user:${userId.toString()}`).emit(event, data);
};

/**
 * Emit a notification to a user.
 */
const emitNotification = (userId, notification) => {
  emitToUser(userId, "notification", notification);
};

/**
 * Broadcast to all connected clients (admin use).
 */
const broadcast = (event, data) => {
  if (!io) return;
  io.emit(event, data);
};

const getIO = () => io;

module.exports = { initSocket, emitToUser, emitNotification, broadcast, getIO };
