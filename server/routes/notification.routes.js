const router = require("express").Router();
const {
  getNotifications, getUnreadCount, markRead, markAllRead, deleteNotification,
} = require("../controllers/notification.controller");
const { protect } = require("../middlewares/auth.middleware");

router.use(protect);

router.get("/",           getNotifications);
router.get("/unread",     getUnreadCount);
router.patch("/read-all", markAllRead);
router.patch("/:id/read", markRead);
router.delete("/:id",     deleteNotification);

module.exports = router;
