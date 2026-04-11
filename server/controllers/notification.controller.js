const asyncHandler          = require("../utils/asyncHandler");
const ApiResponse           = require("../utils/ApiResponse");
const notificationService   = require("../services/notification.service");

const getNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getNotifications(req.user._id, req.query);
  ApiResponse.success(res, "Notifications fetched", result);
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await notificationService.getUnreadCount(req.user._id);
  ApiResponse.success(res, "Unread count", { count });
});

const markRead = asyncHandler(async (req, res) => {
  await notificationService.markRead(req.params.id, req.user._id);
  ApiResponse.success(res, "Notification marked as read");
});

const markAllRead = asyncHandler(async (req, res) => {
  await notificationService.markAllRead(req.user._id);
  ApiResponse.success(res, "All notifications marked as read");
});

const deleteNotification = asyncHandler(async (req, res) => {
  await notificationService.deleteNotification(req.params.id, req.user._id);
  ApiResponse.success(res, "Notification deleted");
});

module.exports = { getNotifications, getUnreadCount, markRead, markAllRead, deleteNotification };
