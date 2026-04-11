const Project      = require("../models/Project");
const Task         = require("../models/Task");
const Client       = require("../models/Client");
const ApiError     = require("../utils/ApiError");
const QueryBuilder = require("../utils/queryBuilder");
const notify       = require("../utils/notify");

// ── Projects ──────────────────────────────────────────────

const createProject = async (ownerId, data) => {
  if (data.clientId) {
    const client = await Client.findOne({ _id: data.clientId, owner: ownerId });
    if (!client) throw ApiError.badRequest("Client not found");
  }

  const project = await Project.create({ ...data, owner: ownerId });

  if (data.clientId) {
    await Client.findByIdAndUpdate(data.clientId, { $inc: { "stats.totalProjects": 1 } });
  }

  await notify({
    recipient: ownerId,
    type: "project_created",
    title: "Project created",
    message: `Project "${project.title}" has been created.`,
    link: `/projects/${project._id}`,
    refModel: "Project",
    refId: project._id,
  });

  return project;
};

const getProjects = async (ownerId, reqQuery = {}) => {
  const baseQuery = Project.find({ owner: ownerId });
  return new QueryBuilder(baseQuery, reqQuery)
    .filter()
    .search(["title", "description"])
    .sort("-createdAt")
    .paginate(10)
    .lean()
    .populate("clientId", "name email company avatar")
    .exec();
};

const getProjectById = async (projectId, ownerId) => {
  const project = await Project.findOne({ _id: projectId, owner: ownerId })
    .populate("clientId", "name email company phone avatar")
    .lean({ virtuals: true });
  if (!project) throw ApiError.notFound("Project not found");
  return project;
};

const updateProject = async (projectId, ownerId, updates) => {
  const project = await Project.findOneAndUpdate(
    { _id: projectId, owner: ownerId },
    updates,
    { new: true, runValidators: true }
  ).populate("clientId", "name email company");
  if (!project) throw ApiError.notFound("Project not found");

  if (updates.status === "completed") {
    await notify({
      recipient: ownerId,
      type: "project_completed",
      title: "Project completed",
      message: `Project "${project.title}" marked as completed.`,
      link: `/projects/${project._id}`,
      refModel: "Project",
      refId: project._id,
    });
  }
  return project;
};

const deleteProject = async (projectId, ownerId) => {
  const project = await Project.findOne({ _id: projectId, owner: ownerId });
  if (!project) throw ApiError.notFound("Project not found");

  await Promise.all([
    project.softDelete(),
    Task.updateMany({ projectId }, { isDeleted: true, deletedAt: new Date() }),
  ]);

  if (project.clientId) {
    await Client.findByIdAndUpdate(project.clientId, { $inc: { "stats.totalProjects": -1 } });
  }
  return true;
};

const getProjectStats = async (ownerId) => {
  const [stats] = await Project.aggregate([
    { $match: { owner: ownerId, isDeleted: { $ne: true } } },
    {
      $group: {
        _id: null,
        total:       { $sum: 1 },
        planning:    { $sum: { $cond: [{ $eq: ["$status", "planning"] },   1, 0] } },
        active:      { $sum: { $cond: [{ $eq: ["$status", "active"] },     1, 0] } },
        on_hold:     { $sum: { $cond: [{ $eq: ["$status", "on_hold"] },    1, 0] } },
        completed:   { $sum: { $cond: [{ $eq: ["$status", "completed"] },  1, 0] } },
        cancelled:   { $sum: { $cond: [{ $eq: ["$status", "cancelled"] },  1, 0] } },
        totalBudget: { $sum: "$budget" },
        avgProgress: { $avg: "$progress" },
      },
    },
  ]);
  return stats || { total: 0, planning: 0, active: 0, on_hold: 0, completed: 0, cancelled: 0, totalBudget: 0, avgProgress: 0 };
};

// ── Tasks ─────────────────────────────────────────────────

const createTask = async (ownerId, data) => {
  const project = await Project.findOne({ _id: data.projectId, owner: ownerId });
  if (!project) throw ApiError.notFound("Project not found");

  const lastTask = await Task.findOne({ projectId: data.projectId, status: data.status || "todo" })
    .sort("-order").lean();
  const order = lastTask ? lastTask.order + 1 : 0;

  const task = await Task.create({ ...data, owner: ownerId, order });

  if (data.assignedTo && data.assignedTo.toString() !== ownerId.toString()) {
    await notify({
      recipient: data.assignedTo,
      type: "task_assigned",
      title: "Task assigned to you",
      message: `You've been assigned: "${task.title}"`,
      link: `/projects/${data.projectId}`,
      refModel: "Task",
      refId: task._id,
    });
  }
  return task;
};

const getTasksByProject = async (projectId, ownerId, reqQuery = {}) => {
  const project = await Project.findOne({ _id: projectId, owner: ownerId }).lean();
  if (!project) throw ApiError.notFound("Project not found");

  const baseQuery = Task.find({ projectId });
  return new QueryBuilder(baseQuery, reqQuery)
    .filter()
    .search(["title", "description"])
    .sort(reqQuery.sort || "order")
    .lean()
    .populate("assignedTo", "name avatar email")
    .exec();
};

const updateTask = async (taskId, ownerId, updates) => {
  const task = await Task.findOneAndUpdate(
    { _id: taskId, owner: ownerId },
    updates,
    { new: true, runValidators: true }
  ).populate("assignedTo", "name avatar");
  if (!task) throw ApiError.notFound("Task not found");
  return task;
};

const reorderTasks = async (ownerId, projectId, orderedIds) => {
  const project = await Project.findOne({ _id: projectId, owner: ownerId });
  if (!project) throw ApiError.notFound("Project not found");

  const ops = orderedIds.map((id, index) => ({
    updateOne: {
      filter: { _id: id, projectId, owner: ownerId },
      update: { $set: { order: index } },
    },
  }));
  await Task.bulkWrite(ops);
  return true;
};

const deleteTask = async (taskId, ownerId) => {
  const task = await Task.findOne({ _id: taskId, owner: ownerId });
  if (!task) throw ApiError.notFound("Task not found");
  await task.softDelete();
  return true;
};

module.exports = {
  createProject, getProjects, getProjectById, updateProject, deleteProject, getProjectStats,
  createTask, getTasksByProject, updateTask, reorderTasks, deleteTask,
};
