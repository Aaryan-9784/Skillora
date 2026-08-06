const express     = require("express");
const router      = express.Router();
const { protect } = require("../middlewares/auth.middleware");
const {
  scheduleMeeting,
  getProjectMeetings,
  getCallHistory,
} = require("../controllers/meeting.controller");

router.use(protect);

router.post("/schedule", scheduleMeeting);
router.get("/project/:projectId", getProjectMeetings);
router.get("/calls/history", getCallHistory);

module.exports = router;
