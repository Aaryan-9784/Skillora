const router = require("express").Router();
const { protect } = require("../middlewares/auth.middleware");
const {
  createSubmission,
  requestRevision,
  approveSubmission,
  getProjectSubmissions,
} = require("../controllers/submission.controller");

router.use(protect);

router.post("/", createSubmission);
router.patch("/:submissionId/revision", requestRevision);
router.patch("/:submissionId/approve", approveSubmission);
router.get("/project/:projectId", getProjectSubmissions);

module.exports = router;
