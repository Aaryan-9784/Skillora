const asyncHandler   = require("../utils/asyncHandler");
const ApiResponse    = require("../utils/ApiResponse");
const ApiError       = require("../utils/ApiError");
const Conversation   = require("../models/Conversation");
const Message        = require("../models/Message");
const Project        = require("../models/Project");
const logger       = require("../utils/logger");
const { cloudinary } = require("../middlewares/upload");
const notify         = require("../utils/notify");
const { getIO } = require("../config/socket");

const uploadToCloudinary = (fileBuffer, originalname, mimetype) => {
  return new Promise((resolve, reject) => {
    let resource_type = "raw";
    if (mimetype.startsWith("image/")) {
      resource_type = "image";
    } else if (mimetype.startsWith("audio/") || mimetype.startsWith("video/") || originalname.match(/\.(webm|wav|mp3|ogg|m4a|mp4)$/i)) {
      resource_type = "video";
    }

    const cleanFilename = originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "skillora/chat",
        resource_type,
        public_id: `${Date.now()}_${cleanFilename}`,
      },
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

  const [messages, total] = await Promise.all([
    Message.find({ conversationId })
      .populate("sender", "name avatar role")
      .sort("-createdAt")
      .skip(skip)
      .limit(limit)
      .lean(),
    Message.countDocuments({ conversationId }),
  ]);

  ApiResponse.success(res, "Messages fetched", {
    data:       messages.reverse(),
    pagination: { total, page, pages: Math.ceil(total / limit) },
  });
});

// Send Message (Text, Voice Note, or File Attachments)
const sendMessage = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { content, attachments, type } = req.body;
  const senderId = req.user._id;

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw ApiError.notFound("Conversation not found");

  const message = await Message.create({
    conversationId,
    sender: senderId,
    type: type || (attachments?.length ? (attachments[0].fileType === "audio" ? "voice_note" : "media") : "text"),
    content: content || "",
    attachments: attachments || [],
    readBy: [{ user: senderId }],
  });

  await message.populate("sender", "name avatar role");

  // Update conversation last message & increment unread counts
  conversation.lastMessage = {
    text: content || (type === "voice_note" ? "🎙 Voice Note" : "📎 Attachment"),
    sender: senderId,
    createdAt: message.createdAt,
  };

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
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    try {
      const cloudResult = await uploadToCloudinary(req.file.buffer, originalname, mimetype);
      fileUrl = cloudResult.secure_url;
    } catch (err) {
      logger.error(`Cloudinary upload failed: ${err.message}`);
      throw ApiError.internal("Failed to upload file to Cloudinary: " + err.message);
    }
  } else {
    fileUrl = req.file.path || `/uploads/${req.file.filename}`;
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

module.exports = { getProjectConversation, getMessages, sendMessage, uploadAttachment };
