const asyncHandler   = require("../utils/asyncHandler");
const ApiResponse    = require("../utils/ApiResponse");
const ApiError       = require("../utils/ApiError");
const Conversation   = require("../models/Conversation");
const Message        = require("../models/Message");
const Project        = require("../models/Project");
const notify         = require("../utils/notify");
const { emitToUser, getIO } = require("../config/socket");

// Get or Create single project conversation
const getProjectConversation = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  let project = null;

  if (projectId && projectId !== "active" && projectId.match(/^[0-9a-fA-F]{24}$/)) {
    project = await Project.findById(projectId).populate("clientId owner");
  }

  // Fallback to active project if specific ID not provided or not found
  if (!project) {
    if (req.user.clientRef) {
      project = await Project.findOne({ clientId: req.user.clientRef, isDeleted: { $ne: true } }).populate("clientId owner");
    } else {
      project = await Project.findOne({ owner: req.user._id, isDeleted: { $ne: true } }).populate("clientId owner");
    }
  }

  // Fallback to general workspace conversation if no project exists yet
  const targetProjectId = project ? project._id : null;
  let conversation = targetProjectId ? await Conversation.findOne({ projectId: targetProjectId }) : null;

  if (!conversation) {
    const participants = [req.user._id];
    if (project?.owner && project.owner._id.toString() !== req.user._id.toString()) {
      participants.push(project.owner._id);
    }
    if (project?.clientId?.userRef && project.clientId.userRef.toString() !== req.user._id.toString()) {
      participants.push(project.clientId.userRef);
    }

    conversation = await Conversation.create({
      type: project ? "project" : "direct",
      projectId: targetProjectId,
      participants,
    });
  }

  await conversation.populate("participants", "name avatar role isOnline lastSeen");
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

// Upload Attachment File
const uploadAttachment = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest("File required");

  let fileType = "document";
  if (req.file.mimetype.startsWith("image/")) fileType = "image";
  else if (req.file.mimetype.startsWith("audio/")) fileType = "audio";
  else if (req.file.mimetype.includes("pdf")) fileType = "pdf";
  else if (req.file.mimetype.includes("zip")) fileType = "zip";

  const attachment = {
    url:       req.file.path || `/uploads/${req.file.filename}`,
    fileName:  req.file.originalname,
    fileType,
    sizeBytes: req.file.size,
  };

  ApiResponse.success(res, "File uploaded", { attachment });
});

module.exports = { getProjectConversation, getMessages, sendMessage, uploadAttachment };
