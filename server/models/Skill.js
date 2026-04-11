const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const skillSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },

    name:     { type: String, required: true, trim: true, maxlength: 100 },
    category: {
      type: String,
      enum: ["development", "design", "marketing", "writing", "video", "audio", "business", "other"],
      default: "other",
    },

    // Proficiency level 1–100
    level: { type: Number, required: true, min: 1, max: 100, default: 50 },

    // Derived label from level
    levelLabel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", "expert"],
    },

    yearsOfExperience: { type: Number, default: 0, min: 0 },
    description:       { type: String, default: "", maxlength: 500 },
    isPublic:          { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────
skillSchema.index({ owner: 1, category: 1 });
skillSchema.index({ owner: 1, name: 1 }, { unique: true }); // no duplicate skill names per user
skillSchema.index({ name: "text" });

// ── Pre-save: derive levelLabel from level ────────────────
skillSchema.pre("save", function (next) {
  if (this.isModified("level")) {
    if      (this.level <= 25)  this.levelLabel = "beginner";
    else if (this.level <= 50)  this.levelLabel = "intermediate";
    else if (this.level <= 75)  this.levelLabel = "advanced";
    else                        this.levelLabel = "expert";
  }
  next();
});

module.exports = model("Skill", skillSchema);
