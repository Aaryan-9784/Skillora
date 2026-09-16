const asyncHandler   = require("../utils/asyncHandler");
const ApiResponse    = require("../utils/ApiResponse");
const ApiError       = require("../utils/ApiError");
const Conversation   = require("../models/Conversation");
const Message        = require("../models/Message");
const Project        = require("../models/Project");
const User           = require("../models/User");
const Client         = require("../models/Client");
const logger         = require("../utils/logger");
const { cloudinary } = require("../middlewares/upload");
const notify         = require("../utils/notify");
const { getIO }      = require("../config/socket");

const uploadToCloudinary = (fileBuffer, originalname, mimetype) => {
  return new Promise((resolve, reject) => {
    let ext = "webm";
    if (originalname && originalname.includes(".")) {
      ext = originalname.substring(originalname.lastIndexOf(".") + 1).toLowerCase();
    } else if (mimetype.includes("mp3")) {
      ext = "mp3";
    } else if (mimetype.includes("wav")) {
      ext = "wav";
    } else if (mimetype.includes("ogg")) {
      ext = "ogg";
    } else if (mimetype.includes("pdf")) {
      ext = "pdf";
    }

    let baseName = originalname || "file";
    if (baseName.includes(".")) {
      baseName = baseName.substring(0, baseName.lastIndexOf("."));
    }
    const cleanFilename = baseName.replace(/[^a-zA-Z0-9_-]/g, "_");

    let resource_type = "raw";
    const isAudioOrVideo = mimetype.startsWith("audio/") || mimetype.startsWith("video/") || originalname.match(/\.(webm|wav|mp3|ogg|m4a|aac|flac|mp4)$/i);
    if (mimetype.startsWith("image/")) {
      resource_type = "image";
    } else if (isAudioOrVideo) {
      resource_type = "video";
    }

    const uploadOptions = {
      folder: "skillora/chat",
      resource_type,
      public_id: resource_type === "raw" ? `${Date.now()}_${cleanFilename}.${ext}` : `${Date.now()}_${cleanFilename}`,
      format: isAudioOrVideo ? ext : undefined,
    };

    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

// Get or Create single project conversation
const getProjectConversation = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  let project = null;

  if (projectId && projectId !== "active" && projectId.match(/^[0-9a-fA-F]{24}$/)) {
    project = await Project.findById(projectId).populate("clientId owner");
  }

  // Fallback to active project if specific ID not provided or not found
  if (!project) {
    if (req.user.role === "client" || req.user.clientRef) {
      project = await Project.findOne({
        $or: [{ owner: req.user._id }, { clientUser: req.user._id }, { clientId: req.user.clientRef }],
        isDeleted: { $ne: true }
      }).sort({ updatedAt: -1 }).populate("clientId owner assignedFreelancer clientUser");
    } else {
      project = await Project.findOne({
        $or: [{ owner: req.user._id }, { assignedFreelancer: req.user._id }],
        isDeleted: { $ne: true }
      }).sort({ updatedAt: -1 }).populate("clientId owner assignedFreelancer clientUser");
    }
  }

  // If project has a clientId but clientUser is not linked, attempt to link it now
  if (project?.clientId && !project.clientUser) {
    try {
      const clientDoc = await Client.findById(project.clientId._id || project.clientId).lean();
      if (clientDoc) {
        const clientUser = await User.findOne({
          $or: [
            { clientRef: clientDoc._id },
            { email: clientDoc.email?.toLowerCase() }
          ]
        }).select("_id");
        if (clientUser) {
          project.clientUser = clientUser._id;
          await Project.findByIdAndUpdate(project._id, { clientUser: clientUser._id });
        }
      }
    } catch (e) {
      logger.warn(`Could not link clientUser for project: ${e.message}`);
    }
  }

  // Fallback to general workspace conversation if no project exists yet
  const targetProjectId = project ? project._id : null;
  let conversation = targetProjectId ? await Conversation.findOne({ projectId: targetProjectId }) : null;

  if (!conversation) {
    const participants = [req.user._id];
    if (project?.assignedFreelancer) {
      const freelancerId = project.assignedFreelancer._id || project.assignedFreelancer;
      if (freelancerId.toString() !== req.user._id.toString()) {
        participants.push(freelancerId);
      }
    }
    if (project?.clientUser) {
      const clientId = project.clientUser._id || project.clientUser;
      if (clientId.toString() !== req.user._id.toString()) {
        participants.push(clientId);
      }
    }
    if (project?.owner && project.owner._id.toString() !== req.user._id.toString()) {
      if (!participants.some(p => p.toString() === project.owner._id.toString())) {
        participants.push(project.owner._id);
      }
    }

    conversation = await Conversation.create({
      type: project ? "project" : "direct",
      projectId: targetProjectId,
      participants: Array.from(new Set(participants.map(p => p.toString()))),
    });
  } else {
    // Ensure both client and freelancer are participants in existing conversation
    let modified = false;
    const existing = conversation.participants.map(p => p.toString());
    
    if (project?.assignedFreelancer) {
      const fId = (project.assignedFreelancer._id || project.assignedFreelancer).toString();
      if (!existing.includes(fId)) {
        conversation.participants.push(fId);
        modified = true;
      }
    }
    if (project?.clientUser) {
      const cId = (project.clientUser._id || project.clientUser).toString();
      if (!existing.includes(cId)) {
        conversation.participants.push(cId);
        modified = true;
      }
    }
    if (modified) {
      await conversation.save();
    }
  }

  await conversation.populate("participants", "name avatar role isOnline lastSeen email");
  ApiResponse.success(res, "Conversation fetched", { conversation });
});

// Fetch paginated messages
const getMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const page  = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 30);
  const skip  = (page - 1) * limit;

  // RBAC Participant Check
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw ApiError.notFound("Conversation not found");

  const isParticipant = conversation.participants.some((p) => p.toString() === req.user._id.toString());
  if (!isParticipant && req.user.role !== "admin") {
    throw ApiError.forbidden("Access denied: You can only view your own conversations");
  }

  const query = { conversationId, deletedFor: { $ne: req.user._id } };

  const [messages, total] = await Promise.all([
    Message.find(query)
      .populate("sender", "name avatar role")
      .sort("-createdAt")
      .skip(skip)
      .limit(limit)
      .lean(),
    Message.countDocuments(query),
  ]);

  ApiResponse.success(res, "Messages fetched", {
    data:       messages.reverse(),
    pagination: { total, page, pages: Math.ceil(total / limit) },
  });
});

// Delete Message (WhatsApp style: Delete for Me or Delete for Everyone)
const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { mode } = req.body; // "everyone" | "me"
  const userId = req.user._id;

  const message = await Message.findById(messageId);
  if (!message) throw ApiError.notFound("Message not found");

  if (mode === "everyone") {
    if (message.sender.toString() !== userId.toString() && req.user.role !== "admin") {
      throw ApiError.forbidden("You can only delete your own messages for everyone");
    }

    message.isDeleted = true;
    message.content = "This message was deleted";
    message.attachments = [];
    await message.save();

    const io = getIO();
    if (io) {
      io.to(`conversation:${message.conversationId}`).emit("chat:message_deleted", {
        messageId: message._id,
        conversationId: message.conversationId,
        isDeleted: true,
      });
    }
  } else {
    if (!message.deletedFor.some((id) => id.toString() === userId.toString())) {
      message.deletedFor.push(userId);
      await message.save();
    }
  }

  ApiResponse.success(res, "Message deleted successfully", { messageId, mode });
});

// Toggle Emoji Reaction on a message
const toggleReaction = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  const userId = req.user._id;

  const message = await Message.findById(messageId);
  if (!message) throw ApiError.notFound("Message not found");

  const existingIdx = message.reactions.findIndex((r) => r.user.toString() === userId.toString());
  if (existingIdx > -1) {
    if (message.reactions[existingIdx].emoji === emoji) {
      message.reactions.splice(existingIdx, 1);
    } else {
      message.reactions[existingIdx].emoji = emoji;
    }
  } else {
    message.reactions.push({ user: userId, emoji });
  }

  await message.save();

  const io = getIO();
  if (io) {
    io.to(`conversation:${message.conversationId}`).emit("chat:message_reaction", {
      messageId: message._id,
      conversationId: message.conversationId,
      reactions: message.reactions,
    });
  }

  ApiResponse.success(res, "Reaction updated", { messageId, reactions: message.reactions });
});

// Send Message (Text, Voice Note, or File Attachments)
const sendMessage = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { content, attachments, type, replyTo } = req.body;
  const senderId = req.user._id;

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw ApiError.notFound("Conversation not found");

  const isParticipant = conversation.participants.some((p) => p.toString() === senderId.toString());
  if (!isParticipant && req.user.role !== "admin") {
    throw ApiError.forbidden("Access denied: You can only send messages in your own conversations");
  }

  const message = await Message.create({
    conversationId,
    sender: senderId,
    type: type || (attachments?.length ? (attachments[0].fileType === "audio" ? "voice_note" : "media") : "text"),
    content: content || "",
    attachments: attachments || [],
    replyTo: replyTo || undefined,
    readBy: [{ user: senderId }],
  });

  await message.populate("sender", "name avatar role");

  // Update conversation last message & increment unread counts
  conversation.lastMessage = {
    text: content || (type === "voice_note" ? "🎙 Voice Note" : "📎 Attachment"),
    sender: senderId,
    createdAt: message.createdAt,
  };

  if (!conversation.unreadCounts || typeof conversation.unreadCounts.get !== "function") {
    conversation.unreadCounts = new Map();
  }

  conversation.participants.forEach((pId) => {
    if (pId.toString() !== senderId.toString()) {
      const cur = conversation.unreadCounts.get(pId.toString()) || 0;
      conversation.unreadCounts.set(pId.toString(), cur + 1);
    }
  });

  await conversation.save();

  // Socket & Notifications
  const io = getIO();
  if (io) {
    io.to(`conversation:${conversationId}`).emit("chat:message_new", { message });
  }

  conversation.participants.forEach((pId) => {
    if (pId.toString() !== senderId.toString()) {
      notify({
        recipient: pId,
        type: "system",
        title: `Message from ${req.user.name}`,
        message: content ? content.slice(0, 80) : "Sent an attachment",
        link: `/messages`,
      });
    }
  });

  ApiResponse.success(res, "Message sent", { message });
});

// Upload Attachment File (Voice Notes, Media & Documents to Cloudinary)
const uploadAttachment = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest("File required");

  const mimetype = req.file.mimetype || "";
  const originalname = req.file.originalname || "attachment";

  let fileType = "document";
  if (mimetype.startsWith("image/")) {
    fileType = "image";
  } else if (mimetype.startsWith("audio/") || originalname.match(/\.(webm|wav|mp3|ogg|m4a|aac|flac)$/i)) {
    fileType = "audio";
  } else if (mimetype.includes("pdf") || originalname.toLowerCase().endsWith(".pdf")) {
    fileType = "pdf";
  } else if (mimetype.includes("zip") || originalname.match(/\.(zip|rar|7z|gz|tar)$/i)) {
    fileType = "zip";
  }

  let fileUrl = "";
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    try {
      const cloudResult = await uploadToCloudinary(req.file.buffer, originalname, mimetype);
      fileUrl = cloudResult.secure_url;
    } catch (err) {
      logger.warn(`Cloudinary upload failed, falling back to local storage: ${err.message}`);
    }
  }

  // Local disk fallback if Cloudinary is unconfigured or failed
  if (!fileUrl) {
    if (req.file.path) {
      fileUrl = req.file.path;
    } else if (req.file.filename) {
      fileUrl = `/uploads/${req.file.filename}`;
    } else if (req.file.buffer) {
      const fs = require("fs");
      const path = require("path");
      const uploadsDir = path.join(__dirname, "../uploads");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      let ext = "";
      if (originalname && originalname.includes(".")) {
        ext = originalname.substring(originalname.lastIndexOf(".")).toLowerCase();
      } else if (mimetype.includes("webm")) {
        ext = ".webm";
      } else if (mimetype.includes("mp3")) {
        ext = ".mp3";
      } else if (mimetype.includes("wav")) {
        ext = ".wav";
      } else if (mimetype.includes("ogg")) {
        ext = ".ogg";
      } else if (mimetype.includes("pdf")) {
        ext = ".pdf";
      } else if (mimetype.includes("zip")) {
        ext = ".zip";
      } else if (mimetype.startsWith("image/")) {
        ext = mimetype.includes("png") ? ".png" : ".jpg";
      } else {
        ext = ".bin";
      }

      let baseName = originalname || "attachment";
      if (baseName.includes(".")) {
        baseName = baseName.substring(0, baseName.lastIndexOf("."));
      }
      const cleanName = baseName.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);
      const safeFilename = `${Date.now()}_${cleanName}${ext}`;
      fs.writeFileSync(path.join(uploadsDir, safeFilename), req.file.buffer);
      fileUrl = `/uploads/${safeFilename}`;
    }
  }

  const attachment = {
    url:       fileUrl,
    fileName:  originalname,
    filename:  originalname,
    fileType,
    sizeBytes: req.file.size || 0,
  };

  ApiResponse.success(res, "File uploaded successfully", { attachment });
});

// Get or Create direct conversation between two users (e.g. Freelancer & CRM Client)
const getOrCreateDirectConversation = asyncHandler(async (req, res) => {
  const recipientId = req.params.recipientId || req.body.recipientId;
  if (!recipientId) throw ApiError.badRequest("Recipient ID is required");

  const currentUserId = req.user._id;

  // 1. Resolve target user
  let targetUser = null;
  if (recipientId.toString().match(/^[0-9a-fA-F]{24}$/)) {
    targetUser = await User.findById(recipientId).select("name email avatar role isOnline lastSeen clientRef");
  }

  // If not found directly in User collection, check Client collection
  if (!targetUser && recipientId.toString().match(/^[0-9a-fA-F]{24}$/)) {
    const clientDoc = await Client.findById(recipientId);
    if (clientDoc) {
      targetUser = await User.findOne({
        $or: [
          { clientRef: clientDoc._id },
          { email: (clientDoc.email || "").toLowerCase() }
        ]
      }).select("name email avatar role isOnline lastSeen clientRef");

      // If still no User account exists for this CRM client, create one so direct chat & WebRTC calls work
      if (!targetUser) {
        const crypto = require("crypto");
        targetUser = await User.create({
          name: clientDoc.name || "Client",
          email: (clientDoc.email || `client_${Date.now()}@skillora.local`).toLowerCase(),
          role: "client",
          clientRef: clientDoc._id,
          avatar: clientDoc.avatar || "",
          password: crypto.randomBytes(24).toString("hex"),
          isOnboarded: true,
          isEmailVerified: true,
        });
      }
    }
  }

  if (!targetUser) {
    throw ApiError.notFound("User or client contact not found");
  }

  if (targetUser._id.toString() === currentUserId.toString()) {
    throw ApiError.badRequest("Cannot start a conversation with yourself");
  }

  // 2. Find or create direct conversation
  let conversation = await Conversation.findOne({
    type: "direct",
    participants: { $all: [currentUserId, targetUser._id] },
  });

  if (!conversation) {
    conversation = await Conversation.create({
      type: "direct",
      participants: [currentUserId, targetUser._id],
    });
  }

  await conversation.populate("participants", "name avatar role isOnline lastSeen email");
  ApiResponse.success(res, "Direct conversation ready", { conversation, partner: targetUser });
});

// Provide production-ready high-availability ICE servers (STUN + TURN)
const getIceServersConfig = asyncHandler(async (req, res) => {
  const defaultIceServers = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    { urls: "stun:stun.cloudflare.com:3478" },
    { urls: "stun:openrelay.metered.ca:80" },
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
  ];

  if (process.env.TURN_SERVER_URL) {
    defaultIceServers.unshift({
      urls: process.env.TURN_SERVER_URL,
      username: process.env.TURN_USERNAME || "",
      credential: process.env.TURN_PASSWORD || "",
    });
  }

  ApiResponse.success(res, "ICE servers fetched", { iceServers: defaultIceServers });
});

module.exports = {
  getProjectConversation,
  getOrCreateDirectConversation,
  getIceServersConfig,
  getMessages,
  sendMessage,
  uploadAttachment,
  deleteMessage,
  toggleReaction,
};
