const router = require("express").Router();
const { protect } = require("../middlewares/auth.middleware");
const {
  createReview,
  getReviewsForUser,
  getProjectReviews,
} = require("../controllers/review.controller");

router.get("/user/:userId", getReviewsForUser);
router.get("/project/:projectId", getProjectReviews);

router.use(protect);
router.post("/", createReview);

module.exports = router;
