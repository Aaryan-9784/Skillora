const Notification = require("../models/Notification");
const QueryBuilder = require("../utils/queryBuilder");

const getNotifications = async (userId, reqQuery = {}) => {
  const baseQuery = Notification.find({ recipient: userId });
  return new QueryBuilder(baseQuery, reqQuery)
    .sort("-createdAt")
    .paginate(20)
    .lean()
    .exec();
};

const getUnreadCount = async (userId) => {
  return Notification.countDocuments({ recipient: userId, read: false });
};

const markRead = async (notificationId, userId) => {
  return Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { read: true, readAt: new Date() },
    { new: true }
  );
};

const markAllRead = async (userId) => {
  return Notification.markAllRead(userId);
};

const deleteNotification = async (notificationId, userId) => {
  return Notification.findOneAndDelete({ _id: notificationId, recipient: userId });
};

module.exports = { getNotifications, getUnreadCount, markRead, markAllRead, deleteNotification };
