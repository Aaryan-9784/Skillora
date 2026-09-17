const asyncHandler    = require("../utils/asyncHandler");
const ApiResponse     = require("../utils/ApiResponse");
const projectService  = require("../services/project.service");
const aiService       = require("../services/ai.service");
const { emitToUser }  = require("../config/socket");

/**
 * Broadcast event to all project stakeholders (owner, assigned freelancer, clientUser).
 */
const broadcastProjectEvent = async (projectId, event, data, alsoRefreshDashboard = false) => {
  if (!projectId) return;
  try {
    const Project = require("../models/Project");
    const proj = await Project.findById(projectId).select("owner clientUser assignedFreelancer").lean();
    if (!proj) return;
    const recipients = new Set([
      proj.owner?.toString(),
      proj.clientUser?.toString(),
      proj.assignedFreelancer?.toString(),
    ]);
    recipients.delete(undefined);
    recipients.forEach((userId) => {
      emitToUser(userId, event, data);
      if (alsoRefreshDashboard) {
        emitToUser(userId, "dashboard:refresh", {});
      }
    });
  } catch (e) {}
};

// ── Projects ──────────────────────────────────────────────
const createProject = asyncHandler(async (req, res) => {
  const project = await projectService.createProject(req.user._id, req.body);
  try {
    emitToUser(req.user._id, "project:updated", { projectId: project._id });
    emitToUser(req.user._id, "dashboard:refresh", {});
  } catch (e) {}
  ApiResponse.created(res, "Project created", { project });
});

const getProjects = asyncHandler(async (req, res) => {
  const result = await projectService.getProjects(req.user._id, req.query);
  ApiResponse.success(res, "Projects fetched", result);
});

const getProject = asyncHandler(async (req, res) => {
  const project = await projectService.getProjectById(req.params.id, req.user._id);
  ApiResponse.success(res, "Project fetched", { project });
});

const updateProject = asyncHandler(async (req, res) => {
  const project = await projectService.updateProject(req.params.id, req.user._id, req.body);
  broadcastProjectEvent(project._id, "project:updated", { projectId: project._id, status: project.status }, true);
  ApiResponse.success(res, "Project updated", { project });
});

const deleteProject = asyncHandler(async (req, res) => {
  await projectService.deleteProject(req.params.id, req.user._id);
  try {
    emitToUser(req.user._id, "project:updated", { projectId: req.params.id, deleted: true });
    emitToUser(req.user._id, "dashboard:refresh", {});
  } catch (e) {}
  ApiResponse.success(res, "Project deleted");
});

const getProjectStats = asyncHandler(async (req, res) => {
  const stats = await projectService.getProjectStats(req.user._id);
  ApiResponse.success(res, "Project stats", { stats });
});

// ── Tasks ─────────────────────────────────────────────────
const createTask = asyncHandler(async (req, res) => {
  const task = await projectService.createTask(req.user._id, req.body);
  const pId = task.projectId ? task.projectId.toString() : req.body.projectId;
  broadcastProjectEvent(pId, "task:updated", { projectId: pId, taskId: task._id }, true);
  ApiResponse.created(res, "Task created", { task });
});

const getTasksByProject = asyncHandler(async (req, res) => {
  const result = await projectService.getTasksByProject(req.params.id, req.user, req.query);
  ApiResponse.success(res, "Tasks fetched", result);
});

const updateTask = asyncHandler(async (req, res) => {
  const task = await projectService.updateTask(req.params.id, req.user._id, req.body);
  const pId = task?.projectId ? task.projectId.toString() : null;
  broadcastProjectEvent(pId, "task:updated", { projectId: pId, taskId: task?._id || req.params.id }, false);
  ApiResponse.success(res, "Task updated", { task });
});

const reorderTasks = asyncHandler(async (req, res) => {
  await projectService.reorderTasks(req.user._id, req.params.id, req.body.orderedIds);
  broadcastProjectEvent(req.params.id, "task:updated", { projectId: req.params.id }, false);
  ApiResponse.success(res, "Tasks reordered");
});

const deleteTask = asyncHandler(async (req, res) => {
  const result = await projectService.deleteTask(req.params.id, req.user._id);
  const pId = result?.projectId ? result.projectId.toString() : null;
  broadcastProjectEvent(pId, "task:updated", { taskId: req.params.id, projectId: pId }, false);
  ApiResponse.success(res, "Task deleted");
});

// ── AI assist ─────────────────────────────────────────────
const aiSuggestTasks = asyncHandler(async (req, res) => {
  const project = await projectService.getProjectById(req.params.id, req.user._id);
  const tasks   = await aiService.suggestTasks(project.title, project.description);
  ApiResponse.success(res, "AI task suggestions", { tasks });
});

module.exports = {
  createProject, getProjects, getProject, updateProject, deleteProject, getProjectStats,
  createTask, getTasksByProject, updateTask, reorderTasks, deleteTask,
  aiSuggestTasks,
};
