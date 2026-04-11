const asyncHandler    = require("../utils/asyncHandler");
const ApiResponse     = require("../utils/ApiResponse");
const projectService  = require("../services/project.service");
const aiService       = require("../services/ai.service");

// ── Projects ──────────────────────────────────────────────
const createProject = asyncHandler(async (req, res) => {
  const project = await projectService.createProject(req.user._id, req.body);
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
  ApiResponse.success(res, "Project updated", { project });
});

const deleteProject = asyncHandler(async (req, res) => {
  await projectService.deleteProject(req.params.id, req.user._id);
  ApiResponse.success(res, "Project deleted");
});

const getProjectStats = asyncHandler(async (req, res) => {
  const stats = await projectService.getProjectStats(req.user._id);
  ApiResponse.success(res, "Project stats", { stats });
});

// ── Tasks ─────────────────────────────────────────────────
const createTask = asyncHandler(async (req, res) => {
  const task = await projectService.createTask(req.user._id, req.body);
  ApiResponse.created(res, "Task created", { task });
});

const getTasksByProject = asyncHandler(async (req, res) => {
  const result = await projectService.getTasksByProject(req.params.id, req.user._id, req.query);
  ApiResponse.success(res, "Tasks fetched", result);
});

const updateTask = asyncHandler(async (req, res) => {
  const task = await projectService.updateTask(req.params.id, req.user._id, req.body);
  ApiResponse.success(res, "Task updated", { task });
});

const reorderTasks = asyncHandler(async (req, res) => {
  await projectService.reorderTasks(req.user._id, req.params.id, req.body.orderedIds);
  ApiResponse.success(res, "Tasks reordered");
});

const deleteTask = asyncHandler(async (req, res) => {
  await projectService.deleteTask(req.params.id, req.user._id);
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
