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
    pingInterval: 15000,
    pingTimeout:  10000,
    transports:   ["websocket", "polling"],
    allowUpgrades: true,
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
        const isObjectId = Boolean(strId.match(/^[0-9a-fA-F]{24}$/));
        const orConditions = [];
        if (isObjectId) {
          orConditions.push({ _id: strId });
          orConditions.push({ clientRef: strId });
        }
        if (strId.includes("@")) {
          orConditions.push({ email: strId.toLowerCase() });
        }
        if (orConditions.length > 0) {
          const u = await User.findOne({ $or: orConditions }).select("_id").lean();
          if (u) return u._id.toString();
        }
      } catch (err) {}
      return strId;
    };

    // Helper to clean up active calls for user
    const removeActiveCalls = (uId, otherId = null) => {
      if (!uId) return;
      const sUId = uId.toString();
      const sOtherId = otherId ? otherId.toString() : null;

      for (const [key, call] of activeCalls.entries()) {
        if (sOtherId) {
          if (
            (call.caller === sUId && call.receiver === sOtherId) ||
            (call.caller === sOtherId && call.receiver === sUId)
          ) {
            activeCalls.delete(key);
          }
        } else {
          if (call.caller === sUId || call.receiver === sUId) {
            activeCalls.delete(key);
          }
        }
      }
    };

    // Prune stale/dead calls (where users are no longer online or call hung)
    const pruneStaleCalls = () => {
      const now = Date.now();
      for (const [key, call] of activeCalls.entries()) {
        const callerOnline = userSockets.has(call.caller) && userSockets.get(call.caller).size > 0;
        const receiverOnline = userSockets.has(call.receiver) && userSockets.get(call.receiver).size > 0;

        // If either party is no longer connected, call is defunct
        if (!callerOnline || !receiverOnline) {
          activeCalls.delete(key);
          continue;
        }

        // If unanswered call is older than 60s, clear it
        if (!call.isAnswered && call.startedAt && now - new Date(call.startedAt).getTime() > 60000) {
          activeCalls.delete(key);
        }
      }
    };

    // 📞 WebRTC Call Signaling (Voice & Video)
    socket.on("call:initiate", async ({ targetUserId, offer, callType, projectId, callerName, callerAvatar }) => {
      if (!targetUserId || !offer) return;
      const resolvedTargetId = await resolveUserId(targetUserId);

      // Check if target user has any connected sockets
      const targetSockets = userSockets.get(resolvedTargetId);
      if (!targetSockets || targetSockets.size === 0) {
        socket.emit("call:unavailable", {
          targetUserId: resolvedTargetId,
          message: "User is currently offline or unavailable.",
        });
        return;
      }

      // 1. Prune dead or stale calls first
      pruneStaleCalls();

      // 2. Clear any prior call records between the SAME caller and receiver
      removeActiveCalls(userId, resolvedTargetId);

      // 3. Only mark busy if target is in an answered, ongoing call with a DIFFERENT user
      let isBusyWithOther = false;
      for (const call of activeCalls.values()) {
        if (
          (call.caller === resolvedTargetId || call.receiver === resolvedTargetId) &&
          call.caller !== userId &&
          call.receiver !== userId &&
          call.isAnswered
        ) {
          const cOnline = userSockets.get(call.caller)?.size > 0;
          const rOnline = userSockets.get(call.receiver)?.size > 0;
          if (cOnline && rOnline) {
            isBusyWithOther = true;
            break;
          }
        }
      }

      if (isBusyWithOther) {
        socket.emit("call:busy", {
          targetUserId: resolvedTargetId,
          message: "User is currently on another call.",
        });
        return;
      }

      activeCalls.set(`${userId}:${resolvedTargetId}`, {
        caller: userId,
        receiver: resolvedTargetId,
        type: callType || "video",
        projectId: projectId || undefined,
        startedAt: new Date(),
        isAnswered: false,
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

      // Mark call as answered in activeCalls
      const call =
        activeCalls.get(`${resolvedCallerId}:${userId}`) ||
        activeCalls.get(`${userId}:${resolvedCallerId}`);
      if (call) {
        call.isAnswered = true;
      }

      io.to(`user:${resolvedCallerId}`).emit("call:answered", { answer });
    });

    socket.on("call:ice_candidate", async ({ targetUserId, candidate }) => {
      if (!targetUserId || !candidate) return;
      const resolvedTargetId = await resolveUserId(targetUserId);
      io.to(`user:${resolvedTargetId}`).emit("call:ice_candidate", { candidate });
    });

    socket.on("call:screen_share", async ({ targetUserId, isSharing, presenterName }) => {
      if (!targetUserId) return;
      const resolvedTargetId = await resolveUserId(targetUserId);
      io.to(`user:${resolvedTargetId}`).emit("call:screen_share", {
        isSharing,
        presenterId: userId,
        presenterName,
      });
    });

    socket.on("call:renegotiate", async ({ targetUserId, offer, callType }) => {
      if (!targetUserId || !offer) return;
      const resolvedTargetId = await resolveUserId(targetUserId);
      io.to(`user:${resolvedTargetId}`).emit("call:renegotiate", {
        senderId: userId,
        offer,
        callType,
      });
    });

    socket.on("call:renegotiate_answer", async ({ targetUserId, answer, callType }) => {
      if (!targetUserId || !answer) return;
      const resolvedTargetId = await resolveUserId(targetUserId);
      io.to(`user:${resolvedTargetId}`).emit("call:renegotiate_answer", {
        senderId: userId,
        answer,
        callType,
      });
    });

    socket.on("call:reject", async ({ callerId }) => {
      const resolvedCallerId = callerId ? await resolveUserId(callerId) : null;
      if (resolvedCallerId) {
        io.to(`user:${resolvedCallerId}`).emit("call:rejected", { userId });
      }

      removeActiveCalls(userId, resolvedCallerId);

      try {
        if (resolvedCallerId) {
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
        }
      } catch (e) {
        logger.warn(`Failed to log rejected call: ${e.message}`);
      }
    });

    socket.on("call:end", async ({ targetUserId, durationSeconds }) => {
      const resolvedTargetId = targetUserId ? await resolveUserId(targetUserId) : null;
      if (resolvedTargetId) {
        io.to(`user:${resolvedTargetId}`).emit("call:ended");
      }

      const callData =
        (resolvedTargetId ? activeCalls.get(`${userId}:${resolvedTargetId}`) || activeCalls.get(`${resolvedTargetId}:${userId}`) : null) ||
        null;

      // Always remove from memory first to prevent stuck busy state
      removeActiveCalls(userId, resolvedTargetId);

      try {
        if (resolvedTargetId) {
          const CallLog = require("../models/CallLog");
          const duration =
            Number(durationSeconds) ||
            (callData?.startedAt
              ? Math.max(0, Math.round((Date.now() - new Date(callData.startedAt).getTime()) / 1000))
              : 0);

          await CallLog.create({
            caller: callData?.caller || userId,
            receiver: callData?.receiver || resolvedTargetId,
            projectId: callData?.projectId || undefined,
            type: callData?.type || "video",
            status: callData?.isAnswered ? "answered" : "missed",
            startedAt: callData?.startedAt || new Date(),
            endedAt: new Date(),
            durationSeconds: duration,
          });
        }
      } catch (e) {
        logger.warn(`Failed to log ended call: ${e.message}`);
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

          // Clean up all active calls involving this user and inform remote peers
          for (const [key, call] of activeCalls.entries()) {
            if (call.caller === userId || call.receiver === userId) {
              const otherUserId = call.caller === userId ? call.receiver : call.caller;
              io.to(`user:${otherUserId}`).emit("call:ended", { reason: "Partner disconnected" });
              activeCalls.delete(key);
            }
          }

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
