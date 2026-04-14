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

// Static routes MUST come before /:id to avoid "tasks" being cast as ObjectId
router.get("/stats", getProjectStats);

// Standalone task routes (before /:id wildcard)
router.post("/tasks",       validateTask, createTask);
router.patch("/tasks/:id",  updateTask);
router.delete("/tasks/:id", deleteTask);

router.route("/:id")
  .get(getProject)
  .patch(updateProject)
  .delete(deleteProject);

// Tasks nested under project
router.get("/:id/tasks",          getTasksByProject);
router.post("/:id/tasks/reorder", reorderTasks);
router.get("/:id/ai-tasks",       aiSuggestTasks);

module.exports = router;
