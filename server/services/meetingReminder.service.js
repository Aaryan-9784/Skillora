const cron     = require("node-cron");
const Meeting  = require("../models/Meeting");
const User     = require("../models/User");
const notify   = require("../utils/notify");
const logger   = require("../utils/logger");
const { sendMeetingReminder } = require("./email.service");

const startMeetingCron = () => {
  // Runs every 5 minutes to check for upcoming meeting reminders
  cron.schedule("*/5 * * * *", async () => {
    try {
      const now = new Date();
      const in15Mins = new Date(now.getTime() + 15 * 60 * 1000);

      const upcoming = await Meeting.find({
        status: "scheduled",
        reminderSent: { $ne: true },
        scheduledAt: { $gte: now, $lte: in15Mins },
      }).populate("participants organizer");

      for (const meeting of upcoming) {
        const organizerId = meeting.organizer?._id || meeting.organizer;
        const participantIds = (meeting.participants || [])
          .map((p) => p?._id || p)
          .filter(Boolean);
        const recipientIds = Array.from(new Set([organizerId, ...participantIds].filter(Boolean)));
        
        for (const rId of recipientIds) {
          await notify({
            recipient: rId,
            type: "system",
            title: `⏰ Meeting Starting Soon: ${meeting.title}`,
            message: `Your scheduled meeting starts in 15 minutes. Join room: ${meeting.roomLink}`,
            link: meeting.roomLink,
          });

          // Fetch user details & dispatch Meeting Email Card
          try {
            const recipientUser = await User.findById(rId).select("name email");
            if (recipientUser?.email) {
              sendMeetingReminder(recipientUser.email, recipientUser.name, meeting).catch(() => {});
            }
          } catch (e) {
            logger.warn(`Meeting email dispatch warning: ${e.message}`);
          }
        }

        meeting.reminderSent = true;
        await meeting.save();
      }
    } catch (err) {
      logger.error(`Meeting Cron Error: ${err.message}`);
    }
  });

  logger.info("📅 Meeting Reminder Cron Service initialized");
};

module.exports = startMeetingCron;
