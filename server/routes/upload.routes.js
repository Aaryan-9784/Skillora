const router = require("express").Router();
const { uploadAvatar, uploadProjectFile } = require("../controllers/upload.controller");
const { protect }    = require("../middlewares/auth.middleware");
const { uploadAvatar: avatarMiddleware, uploadFile } = require("../middlewares/upload");

router.use(protect);

router.post("/avatar", avatarMiddleware, uploadAvatar);
router.post("/file",   uploadFile,       uploadProjectFile);

module.exports = router;
