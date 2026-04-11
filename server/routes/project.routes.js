const router = require("express").Router();
const {
  createProject, getProjects, getProject, updateProject, deleteProject, getProjectStats,
  createTask, getTasksByProject, updateTask, reorderTasks, deleteTask,
  aiSuggestTasks,
} = require("../controllers/project.controller");
const { protect }    = require("../middlewares/auth.middleware");
const { validateProject, validateTask } = require("../validators/project.validator");
const { checkLimit } = require("../middlewares/planGate");

router.use(protect);

// Projects
router.route("/")
  .get(getProjects)
  .post(checkLimit("projects"), validateProject, createProject);

router.get("/stats", getProjectStats);

router.route("/:id")
  .get(getProject)
  .patch(updateProject)
  .delete(deleteProject);

// Tasks nested under project
router.get("/:id/tasks",          getTasksByProject);
router.post("/:id/tasks/reorder", reorderTasks);
router.get("/:id/ai-tasks",       aiSuggestTasks);

// Standalone task routes
router.post("/tasks",       validateTask, createTask);
router.patch("/tasks/:id",  updateTask);
router.delete("/tasks/:id", deleteTask);

module.exports = router;
