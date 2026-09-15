const { Server } = require("socket.io");
const jwt        = require("jsonwebtoken");
const User       = require("../models/User");
const Message    = require("../models/Message");
const Conversation = require("../models/Conversation");
const logger     = require("../utils/logger");

let io = null;
const userSockets = new Map(); // Map<userId, Set<socketId>>
const activeCalls = new Map(); // Map<callKey, { caller, receiver, type, projectId, startedAt }>

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin:      (origin, callback) => callback(null, true),
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout:  20000,
    transports:   ["websocket", "polling"],
  });

  // 🔒 Auth middleware
  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers?.cookie || "";
      const parsedCookies = cookieHeader.split(";").reduce((res, item) => {
        const [k, v] = item.trim().split("=");
        if (k && v) res[k] = decodeURIComponent(v);
        return res;
      }, {});

      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(" ")[1] ||
        parsedCookies.accessToken ||
        parsedCookies.token;

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
      activeCalls.set(`${userId}:${targetUserId}`, {
        caller: userId,
        receiver: targetUserId,
        type: callType || "video",
        projectId: projectId || undefined,
        startedAt: new Date(),
      });
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

    socket.on("call:reject", async ({ callerId }) => {
      if (callerId) {
        io.to(`user:${callerId}`).emit("call:rejected", { userId });
        try {
          const CallLog = require("../models/CallLog");
          await CallLog.create({
            caller: callerId,
            receiver: userId,
            type: "voice",
            status: "rejected",
            startedAt: new Date(),
            endedAt: new Date(),
            durationSeconds: 0,
          });
          activeCalls.delete(`${callerId}:${userId}`);
        } catch (e) {
          logger.warn(`Failed to log rejected call: ${e.message}`);
        }
      }
    });

    socket.on("call:end", async ({ targetUserId, durationSeconds }) => {
      if (targetUserId) {
        io.to(`user:${targetUserId}`).emit("call:ended");
        try {
          const CallLog = require("../models/CallLog");
          const callData = activeCalls.get(`${userId}:${targetUserId}`) || activeCalls.get(`${targetUserId}:${userId}`);
          const duration = Number(durationSeconds) || (callData ? Math.max(0, Math.round((Date.now() - callData.startedAt.getTime()) / 1000)) : 0);
          await CallLog.create({
            caller: callData?.caller || userId,
            receiver: callData?.receiver || targetUserId,
            projectId: callData?.projectId || undefined,
            type: callData?.type || "video",
            status: "answered",
            startedAt: callData?.startedAt || new Date(),
            endedAt: new Date(),
            durationSeconds: duration,
          });
          activeCalls.delete(`${userId}:${targetUserId}`);
          activeCalls.delete(`${targetUserId}:${userId}`);
        } catch (e) {
          logger.warn(`Failed to log ended call: ${e.message}`);
        }
      }
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
