const mongoose     = require("mongoose");
const Project      = require("../models/Project");
const Task         = require("../models/Task");
const Client       = require("../models/Client");
const ApiError     = require("../utils/ApiError");
const QueryBuilder = require("../utils/queryBuilder");
const notify       = require("../utils/notify");

/**
 * Helper to check if a user is authorized to access a project
 * (as owner, assigned freelancer, clientUser, or linked client).
 */
const findAccessibleProject = async (projectId, userOrId) => {
  if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) return null;
  const userId = typeof userOrId === "object" && userOrId?._id ? userOrId._id : userOrId;
  const clientRef = typeof userOrId === "object" ? userOrId.clientRef : null;

  const orConditions = [
    { owner: userId },
    { assignedFreelancer: userId },
    { clientUser: userId },
  ];
  if (clientRef) {
    orConditions.push({ clientId: clientRef });
  }

  return Project.findOne({
    _id: projectId,
    $or: orConditions,
    isDeleted: { $ne: true },
  });
};

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

const getProjects = async (userId, reqQuery = {}) => {
  const baseQuery = Project.find({
    $or: [
      { owner: userId },
      { assignedFreelancer: userId },
      { clientUser: userId },
    ],
    isDeleted: { $ne: true },
  });

  return new QueryBuilder(baseQuery, reqQuery)
    .filter()
    .search(["title", "description"])
    .sort("-createdAt")
    .paginate(10)
    .lean()
    .populate("clientId", "name email company avatar")
    .populate("assignedFreelancer", "name email avatar")
    .populate("owner", "name email avatar")
    .exec();
};

const getProjectById = async (projectId, userId) => {
  const project = await Project.findOne({
    _id: projectId,
    $or: [
      { owner: userId },
      { assignedFreelancer: userId },
      { clientUser: userId },
    ],
    isDeleted: { $ne: true },
  })
    .populate("clientId", "name email company phone avatar")
    .populate("assignedFreelancer", "name email avatar")
    .populate("owner", "name email avatar")
    .lean({ virtuals: true });
  if (!project) throw ApiError.notFound("Project not found");
  return project;
};

const updateProject = async (projectId, userId, updates) => {
  const project = await Project.findOneAndUpdate(
    {
      _id: projectId,
      $or: [
        { owner: userId },
        { assignedFreelancer: userId },
        { clientUser: userId },
      ],
      isDeleted: { $ne: true },
    },
    updates,
    { new: true, runValidators: true }
  )
    .populate("clientId", "name email company")
    .populate("assignedFreelancer", "name email avatar")
    .populate("owner", "name email avatar");
  if (!project) throw ApiError.notFound("Project not found");

  if (updates.status === "completed") {
    const notifyId = project.owner?.toString() === userId.toString()
      ? (project.assignedFreelancer || project.clientUser)
      : project.owner;
    if (notifyId) {
      await notify({
        recipient: notifyId,
        type: "project_completed",
        title: "Project completed",
        message: `Project "${project.title}" marked as completed.`,
        link: `/projects/${project._id}`,
        refModel: "Project",
        refId: project._id,
      });
    }
  }
  return project;
};

const deleteProject = async (projectId, userId) => {
  const project = await Project.findOne({
    _id: projectId,
    $or: [
      { owner: userId },
      { clientUser: userId },
      { assignedFreelancer: userId },
    ],
  });
  if (!project) throw ApiError.notFound("Project not found");

  const Proposal = require("../models/Proposal");
  const Escrow   = require("../models/Escrow");

  await Promise.all([
    project.softDelete(),
    Task.updateMany({ projectId }, { isDeleted: true, deletedAt: new Date() }),
    Proposal.deleteMany({ project: projectId }),
    Escrow.updateMany({ project: projectId }, { status: "refunded" }),
  ]);

  if (project.clientId) {
    await Client.findByIdAndUpdate(project.clientId, { $inc: { "stats.totalProjects": -1 } });
  }

  const userIdStr = userId.toString();
  let notifyUserId = null;

  if (project.assignedFreelancer && project.assignedFreelancer.toString() !== userIdStr) {
    notifyUserId = project.assignedFreelancer;
  } else if (project.clientUser && project.clientUser.toString() !== userIdStr) {
    notifyUserId = project.clientUser;
  } else if (project.owner && project.owner.toString() !== userIdStr) {
    notifyUserId = project.owner;
  }

  if (notifyUserId) {
    await notify({
      recipient: notifyUserId,
      type: "project_deleted",
      title: "Project Deleted & Disconnected",
      message: `The project "${project.title}" was deleted and the active client-freelancer connection has ended.`,
      link: "/projects",
      refModel: "Project",
      refId: projectId,
    });
  }

  return true;
};

const getProjectStats = async (userId) => {
  const userObjId = new mongoose.Types.ObjectId(userId);
  const [stats] = await Project.aggregate([
    {
      $match: {
        $or: [
          { owner: userObjId },
          { assignedFreelancer: userObjId },
          { clientUser: userObjId },
        ],
        isDeleted: { $ne: true },
      },
    },
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

const createTask = async (userId, data) => {
  const project = await findAccessibleProject(data.projectId, userId);
  if (!project) throw ApiError.notFound("Project not found");

  const lastTask = await Task.findOne({ projectId: data.projectId, status: data.status || "todo" })
    .sort("-order").lean();
  const order = lastTask ? lastTask.order + 1 : 0;

  const task = await Task.create({ ...data, owner: userId, order });

  if (data.assignedTo && data.assignedTo.toString() !== userId.toString()) {
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

const getTasksByProject = async (projectId, userOrId, reqQuery = {}) => {
  if (!projectId || projectId === "undefined" || !mongoose.Types.ObjectId.isValid(projectId)) {
    return { data: [], total: 0 };
  }

  const project = await findAccessibleProject(projectId, userOrId);
  if (!project) throw ApiError.notFound("Project not found");

  const baseQuery = Task.find({ projectId, isDeleted: { $ne: true } });
  return new QueryBuilder(baseQuery, reqQuery)
    .filter()
    .search(["title", "description"])
    .sort(reqQuery.sort || "order")
    .lean()
    .populate("assignedTo", "name avatar email")
    .exec();
};

const updateTask = async (taskId, userId, updates) => {
  const task = await Task.findById(taskId);
  if (!task) throw ApiError.notFound("Task not found");

  const project = await findAccessibleProject(task.projectId, userId);
  if (!project) throw ApiError.forbidden("You do not have permission to update this task");

  Object.assign(task, updates);
  await task.save({ validateModifiedOnly: true });
  await task.populate("assignedTo", "name avatar");
  return task;
};

const reorderTasks = async (userId, projectId, orderedIds) => {
  const project = await findAccessibleProject(projectId, userId);
  if (!project) throw ApiError.notFound("Project not found");

  const ops = orderedIds.map((id, index) => ({
    updateOne: {
      filter: { _id: id, projectId },
      update: { $set: { order: index } },
    },
  }));
  await Task.bulkWrite(ops);
  return true;
};

const deleteTask = async (taskId, userId) => {
  const task = await Task.findById(taskId);
  if (!task) throw ApiError.notFound("Task not found");

  const project = await findAccessibleProject(task.projectId, userId);
  if (!project) throw ApiError.forbidden("You do not have permission to delete this task");

  const projectId = task.projectId;
  await task.softDelete();
  return { projectId, taskId };
};

module.exports = {
  createProject, getProjects, getProjectById, updateProject, deleteProject, getProjectStats,
  createTask, getTasksByProject, updateTask, reorderTasks, deleteTask, findAccessibleProject,
};
