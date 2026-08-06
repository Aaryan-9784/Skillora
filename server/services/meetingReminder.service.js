const cron     = require("node-cron");
const Meeting  = require("../models/Meeting");
const notify   = require("../utils/notify");
const logger   = require("../utils/logger");

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
        const recipients = [meeting.organizer._id, ...(meeting.participants || []).map((p) => p._id)];
        
        for (const rId of recipients) {
          await notify({
            recipient: rId,
            type: "system",
            title: `⏰ Meeting Starting Soon: ${meeting.title}`,
            message: `Your scheduled meeting starts in 15 minutes. Join room: ${meeting.roomLink}`,
            link: meeting.roomLink,
          });
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
