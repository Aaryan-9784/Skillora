const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const checklistItemSchema = new Schema({
  text:      { type: String, required: true, trim: true },
  completed: { type: Boolean, default: false },
}, { _id: true });

const taskSchema = new Schema(
  {
    projectId:  { type: Schema.Types.ObjectId, ref: "Project", required: true },
    owner:      { type: Schema.Types.ObjectId, ref: "User",    required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User",    default: null },

    title:       { type: String, required: true, trim: true, maxlength: 300 },
    description: { type: String, default: "", maxlength: 5000 },

    status: {
      type:    String,
      enum:    ["todo", "in_progress", "review", "done"],
      default: "todo",
    },
    priority: {
      type:    String,
      enum:    ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    // Kanban ordering — lower = higher on board
    order: { type: Number, default: 0 },

    dueDate:        { type: Date },
    estimatedHours: { type: Number, default: 0, min: 0 },
    loggedHours:    { type: Number, default: 0, min: 0 },

    checklist: [checklistItemSchema],
    tags:      [{ type: String, trim: true }],

    // Soft delete
    isDeleted: { type: Boolean, default: false, select: false },
    deletedAt: { type: Date, select: false },
  },
  {
    timestamps: true,
    toJSON:  { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ───────────────────────────────────────────────
taskSchema.index({ projectId: 1, status: 1 });
taskSchema.index({ projectId: 1, order: 1 });
taskSchema.index({ owner: 1, status: 1 });
taskSchema.index({ assignedTo: 1, status: 1 }, { sparse: true });
taskSchema.index({ dueDate: 1 }, { sparse: true });
taskSchema.index({ title: "text", description: "text" });
taskSchema.index({ projectId: 1, isDeleted: 1 });

// ── Soft delete middleware ────────────────────────────────
taskSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeSoftDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

// ── Virtual: completion percentage of checklist ───────────
taskSchema.virtual("checklistProgress").get(function () {
  if (!this.checklist?.length) return 0;
  const done = this.checklist.filter((i) => i.completed).length;
  return Math.round((done / this.checklist.length) * 100);
});

// ── Post-save: update parent project taskStats + progress ─
taskSchema.post("save", async function () {
  await syncProjectTaskStats(this.projectId);
});

taskSchema.post("findOneAndUpdate", async function (doc) {
  if (doc) await syncProjectTaskStats(doc.projectId);
});

taskSchema.post("findOneAndDelete", async function (doc) {
  if (doc) await syncProjectTaskStats(doc.projectId);
});

/**
 * Aggregate task counts for a project and update its taskStats + progress.
 * Uses a single aggregation pipeline — one DB round-trip.
 */
async function syncProjectTaskStats(projectId) {
  if (!projectId) return;
  const Project = mongoose.model("Project");

  const [result] = await mongoose.model("Task").aggregate([
    { $match: { projectId: new mongoose.Types.ObjectId(projectId), isDeleted: { $ne: true } } },
    {
      $group: {
        _id:         null,
        total:       { $sum: 1 },
        todo:        { $sum: { $cond: [{ $eq: ["$status", "todo"] },        1, 0] } },
        in_progress: { $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] } },
        review:      { $sum: { $cond: [{ $eq: ["$status", "review"] },      1, 0] } },
        done:        { $sum: { $cond: [{ $eq: ["$status", "done"] },        1, 0] } },
      },
    },
  ]);

  const stats    = result || { total: 0, todo: 0, in_progress: 0, review: 0, done: 0 };
  const progress = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  await Project.findByIdAndUpdate(projectId, {
    taskStats: stats,
    progress,
  });
}

taskSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save({ validateBeforeSave: false });
};

module.exports = model("Task", taskSchema);
