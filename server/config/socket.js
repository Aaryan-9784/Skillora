const { Server } = require("socket.io");
const jwt        = require("jsonwebtoken");
const User       = require("../models/User");
const Message    = require("../models/Message");
const Conversation = require("../models/Conversation");
const logger     = require("../utils/logger");

let io = null;
const userSockets = new Map(); // Map<userId, Set<socketId>>

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin:      [process.env.CLIENT_URL, "http://localhost:5173"],
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout:  20000,
    transports:   ["websocket", "polling"],
  });

  // 🔒 Auth middleware
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(" ")[1];

      if (!token) return next(new Error("Authentication token required"));

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.userId = decoded.id.toString();
      next();
    } catch (err) {
      logger.error(`Socket Auth Failed: ${err.message}`);
      next(new Error("Invalid authentication token"));
    }
  });

  // 🔌 Connection handler
  io.on("connection", async (socket) => {
    const { userId } = socket;
    logger.info(`⚡ Socket connected: ${socket.id} (user: ${userId})`);

    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId).add(socket.id);

    // Join user room
    socket.join(`user:${userId}`);

    // Update presence in DB & broadcast to all connected clients
    try {
      const user = await User.findById(userId).select("role").lean();
      if (user?.role === "admin")  socket.join("role:admin");
      if (user?.role === "client") socket.join("role:client");

      await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });
      io.emit("presence:update", { userId, isOnline: true });
    } catch (e) {
      logger.error(`Failed presence update: ${e.message}`);
    }

    // 💬 Conversation Room Joins
    socket.on("chat:join", ({ conversationId }) => {
      if (conversationId) socket.join(`conversation:${conversationId}`);
    });

    socket.on("chat:leave", ({ conversationId }) => {
      if (conversationId) socket.leave(`conversation:${conversationId}`);
    });

    // ✍️ Typing Indicators
    socket.on("chat:typing", ({ conversationId, userName }) => {
      if (conversationId) {
        socket.to(`conversation:${conversationId}`).emit("chat:typing", {
          conversationId,
          userId,
          userName: userName || "Someone",
        });
      }
    });

    socket.on("chat:stop_typing", ({ conversationId }) => {
      if (conversationId) {
        socket.to(`conversation:${conversationId}`).emit("chat:stop_typing", {
          conversationId,
          userId,
        });
      }
    });

    // 👁️ Read Receipts
    socket.on("chat:mark_read", async ({ conversationId }) => {
      try {
        await Message.updateMany(
          { conversationId, "readBy.user": { $ne: userId } },
          { $push: { readBy: { user: userId, readAt: new Date() } } }
        );
        await Conversation.findByIdAndUpdate(conversationId, {
          [`unreadCounts.${userId}`]: 0,
        });
        io.to(`conversation:${conversationId}`).emit("chat:read_ack", {
          conversationId,
          userId,
        });
      } catch (err) {
        logger.error(`mark_read error: ${err.message}`);
      }
    });

    // 📞 WebRTC Call Signaling (Voice & Video)
    socket.on("call:initiate", ({ targetUserId, offer, callType, projectId }) => {
      if (!targetUserId || !offer) return;
      io.to(`user:${targetUserId}`).emit("call:incoming", {
        callerId: userId,
        offer,
        callType: callType || "video",
        projectId,
      });
    });

    socket.on("call:answer", ({ callerId, answer }) => {
      if (!callerId || !answer) return;
      io.to(`user:${callerId}`).emit("call:answered", { answer });
    });

    socket.on("call:ice_candidate", ({ targetUserId, candidate }) => {
      if (!targetUserId || !candidate) return;
      io.to(`user:${targetUserId}`).emit("call:ice_candidate", { candidate });
    });

    socket.on("call:reject", ({ callerId }) => {
      if (callerId) io.to(`user:${callerId}`).emit("call:rejected", { userId });
    });

    socket.on("call:end", ({ targetUserId }) => {
      if (targetUserId) io.to(`user:${targetUserId}`).emit("call:ended");
    });

    // Ping/pong health
    socket.on("ping", () => socket.emit("pong"));

    // 🛑 Disconnect Handler
    socket.on("disconnect", async () => {
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
          const lastSeen = new Date();
          await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen });
          io.emit("presence:update", { userId, isOnline: false, lastSeen });
        }
      }
      logger.info(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  logger.info("Socket.io engine & signaling initialized");
  return io;
};

const emitToUser = (userId, event, data) => {
  if (!io) return;
  io.to(`user:${userId.toString()}`).emit(event, data);
};

const emitNotification = (userId, notification) => {
  emitToUser(userId, "notification", notification);
};

const broadcast = (event, data) => {
  if (!io) return;
  io.emit(event, data);
};

const getIO = () => io;

module.exports = { initSocket, emitToUser, emitNotification, broadcast, getIO };
