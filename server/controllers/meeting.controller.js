const asyncHandler = require("../utils/asyncHandler");
const ApiResponse  = require("../utils/ApiResponse");
const ApiError     = require("../utils/ApiError");
const Meeting      = require("../models/Meeting");
const CallLog      = require("../models/CallLog");
const notify       = require("../utils/notify");

const scheduleMeeting = asyncHandler(async (req, res) => {
  const { title, description, projectId, scheduledAt, durationMins, roomLink, participants } = req.body;
  if (!title || !projectId || !scheduledAt || !roomLink) {
    throw ApiError.badRequest("Title, project, date, and link required");
  }

  const meeting = await Meeting.create({
    title,
    description: description || "",
    projectId,
    organizer: req.user._id,
    participants: participants || [],
    scheduledAt: new Date(scheduledAt),
    durationMins: durationMins || 30,
    roomLink,
  });

  await meeting.populate("organizer participants", "name email avatar");

  const allRecipients = [req.user._id, ...(participants || [])];
  for (const rId of allRecipients) {
    await notify({
      recipient: rId,
      type: "system",
      title: `📅 Meeting Scheduled: ${title}`,
      message: `Meeting set for ${new Date(scheduledAt).toLocaleString()}`,
      link: roomLink,
      refModel: "Project",
      refId: projectId,
    });
  }

  ApiResponse.success(res, "Meeting scheduled", { meeting });
});

const getProjectMeetings = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const meetings = await Meeting.find({ projectId, status: { $ne: "cancelled" } })
    .populate("organizer participants", "name email avatar")
    .sort({ scheduledAt: 1 });

  ApiResponse.success(res, "Meetings fetched", { meetings });
});

const getCallHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const calls = await CallLog.find({
    $or: [{ caller: userId }, { receiver: userId }],
  })
    .populate("caller receiver", "name avatar role")
    .populate("projectId", "title")
    .sort({ createdAt: -1 })
    .limit(50);

  ApiResponse.success(res, "Call history fetched", { calls });
});

module.exports = { scheduleMeeting, getProjectMeetings, getCallHistory };
