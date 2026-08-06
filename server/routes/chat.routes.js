const express     = require("express");
const router      = express.Router();
const { protect } = require("../middlewares/auth.middleware");
const multer      = require("multer");
const upload      = multer({ dest: "uploads/", limits: { fileSize: 25 * 1024 * 1024 } });
const {
  getProjectConversation,
  getMessages,
  sendMessage,
  uploadAttachment,
} = require("../controllers/chat.controller");

router.use(protect);

router.get("/project", getProjectConversation);
router.get("/project/:projectId", getProjectConversation);
router.get("/conversations/:conversationId/messages", getMessages);
router.post("/conversations/:conversationId/messages", sendMessage);
router.post("/upload", upload.single("file"), uploadAttachment);

module.exports = router;
