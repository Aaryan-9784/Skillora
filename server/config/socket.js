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

  const getOnlineIdentifiers = async () => {
    try {
      const onlineUserIds = Array.from(userSockets.keys());
      if (!onlineUserIds.length) return [];
      const users = await User.find({ _id: { $in: onlineUserIds } }).select("_id clientRef email").lean();
      const ids = [];
      users.forEach((u) => {
        ids.push(u._id.toString());
        if (u.clientRef) ids.push(u.clientRef.toString());
        if (u.email) ids.push(u.email.toLowerCase());
      });
      return Array.from(new Set(ids));
    } catch (e) {
      logger.warn(`Failed getting online identifiers: ${e.message}`);
      return Array.from(userSockets.keys());
    }
  };

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
      const user = await User.findById(userId).select("role clientRef email").lean();
      if (user?.role === "admin")  socket.join("role:admin");
      if (user?.role === "client") socket.join("role:client");

      await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });
      io.emit("presence:update", {
        userId,
        clientRef: user?.clientRef ? user.clientRef.toString() : null,
        email: user?.email ? user.email.toLowerCase() : null,
        isOnline: true,
      });

      // Send initial snapshot of all currently online users to this socket
      const onlineUserIds = await getOnlineIdentifiers();
      socket.emit("presence:sync", { onlineUserIds });
    } catch (e) {
      logger.error(`Failed presence update: ${e.message}`);
    }

    // 📡 Client query for real-time presence snapshot
    socket.on("presence:query", async () => {
      const onlineUserIds = await getOnlineIdentifiers();
      socket.emit("presence:sync", { onlineUserIds });
    });

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

    // Helper to resolve a target ID (User ID or Client ID) to the connected User ID
    const resolveUserId = async (id) => {
      if (!id) return null;
      const strId = id.toString();
      if (userSockets.has(strId)) return strId;
      try {
        if (strId.match(/^[0-9a-fA-F]{24}$/)) {
          const u = await User.findOne({
            $or: [{ _id: strId }, { clientRef: strId }]
          }).select("_id").lean();
          if (u) return u._id.toString();
        }
      } catch (err) {}
      return strId;
    };

    // 📞 WebRTC Call Signaling (Voice & Video)
    socket.on("call:initiate", async ({ targetUserId, offer, callType, projectId, callerName, callerAvatar }) => {
      if (!targetUserId || !offer) return;
      const resolvedTargetId = await resolveUserId(targetUserId);
      activeCalls.set(`${userId}:${resolvedTargetId}`, {
        caller: userId,
        receiver: resolvedTargetId,
        type: callType || "video",
        projectId: projectId || undefined,
        startedAt: new Date(),
      });

      let name = callerName;
      let avatar = callerAvatar;
      if (!name) {
        try {
          const callerUser = await User.findById(userId).select("name avatar").lean();
          name = callerUser?.name || "User";
          avatar = callerUser?.avatar || "";
        } catch (e) {}
      }

      io.to(`user:${resolvedTargetId}`).emit("call:incoming", {
        callerId: userId,
        callerName: name || "User",
        callerAvatar: avatar || "",
        offer,
        callType: callType || "video",
        projectId,
      });
    });

    socket.on("call:answer", async ({ callerId, answer }) => {
      if (!callerId || !answer) return;
      const resolvedCallerId = await resolveUserId(callerId);
      io.to(`user:${resolvedCallerId}`).emit("call:answered", { answer });
    });

    socket.on("call:ice_candidate", async ({ targetUserId, candidate }) => {
      if (!targetUserId || !candidate) return;
      const resolvedTargetId = await resolveUserId(targetUserId);
      io.to(`user:${resolvedTargetId}`).emit("call:ice_candidate", { candidate });
    });

    socket.on("call:reject", async ({ callerId }) => {
      if (callerId) {
        const resolvedCallerId = await resolveUserId(callerId);
        io.to(`user:${resolvedCallerId}`).emit("call:rejected", { userId });
        try {
          const CallLog = require("../models/CallLog");
          await CallLog.create({
            caller: resolvedCallerId,
            receiver: userId,
            type: "voice",
            status: "rejected",
            startedAt: new Date(),
            endedAt: new Date(),
            durationSeconds: 0,
          });
          activeCalls.delete(`${resolvedCallerId}:${userId}`);
          activeCalls.delete(`${userId}:${resolvedCallerId}`);
        } catch (e) {
          logger.warn(`Failed to log rejected call: ${e.message}`);
        }
      }
    });

    socket.on("call:end", async ({ targetUserId, durationSeconds }) => {
      if (targetUserId) {
        const resolvedTargetId = await resolveUserId(targetUserId);
        io.to(`user:${resolvedTargetId}`).emit("call:ended");
        try {
          const CallLog = require("../models/CallLog");
          const callData = activeCalls.get(`${userId}:${resolvedTargetId}`) || activeCalls.get(`${resolvedTargetId}:${userId}`);
          const duration = Number(durationSeconds) || (callData ? Math.max(0, Math.round((Date.now() - callData.startedAt.getTime()) / 1000)) : 0);
          await CallLog.create({
            caller: callData?.caller || userId,
            receiver: callData?.receiver || resolvedTargetId,
            projectId: callData?.projectId || undefined,
            type: callData?.type || "video",
            status: "answered",
            startedAt: callData?.startedAt || new Date(),
            endedAt: new Date(),
            durationSeconds: duration,
          });
          activeCalls.delete(`${userId}:${resolvedTargetId}`);
          activeCalls.delete(`${resolvedTargetId}:${userId}`);
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
          let clientRef = null;
          let email = null;
          try {
            const user = await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen }).select("clientRef email").lean();
            if (user?.clientRef) clientRef = user.clientRef.toString();
            if (user?.email) email = user.email.toLowerCase();
          } catch (e) {
            logger.error(`Failed presence disconnect update: ${e.message}`);
          }
          io.emit("presence:update", {
            userId,
            clientRef,
            email,
            isOnline: false,
            lastSeen,
          });
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

const isUserOnline = (userId) => {
  if (!userId) return false;
  const sockets = userSockets.get(userId.toString());
  return Boolean(sockets && sockets.size > 0);
};

const getOnlineUserIds = () => Array.from(userSockets.keys());

module.exports = {
  initSocket,
  emitToUser,
  emitNotification,
  broadcast,
  getIO,
  isUserOnline,
  getOnlineUserIds,
};
