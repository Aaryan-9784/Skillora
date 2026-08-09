const express     = require("express");
const router      = express.Router();
const multer      = require("multer");
const { protect } = require("../middlewares/auth.middleware");
const upload      = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });
const {
  getProjectConversation,
  getMessages,
  sendMessage,
  uploadAttachment,
  deleteMessage,
  toggleReaction,
} = require("../controllers/chat.controller");

router.use(protect);

router.get("/project", getProjectConversation);
router.get("/project/:projectId", getProjectConversation);
router.get("/conversations/:conversationId/messages", getMessages);
router.post("/conversations/:conversationId/messages", sendMessage);
router.delete("/messages/:messageId", deleteMessage);
router.post("/messages/:messageId/react", toggleReaction);
router.post("/upload", upload.single("file"), uploadAttachment);

module.exports = router;
