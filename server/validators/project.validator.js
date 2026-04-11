const Joi = require("joi");
const ApiError = require("../utils/ApiError");

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map((d) => d.message);
    return next(ApiError.badRequest("Validation failed", errors));
  }
  next();
};

const projectSchema = Joi.object({
  title: Joi.string().min(2).max(200).required(),
  description: Joi.string().max(2000).allow(""),
  clientId: Joi.string().hex().length(24).allow(null, ""),
  status: Joi.string().valid("planning", "active", "on_hold", "completed", "cancelled"),
  budget: Joi.number().min(0),
  currency: Joi.string().length(3),
  deadline: Joi.date().iso().allow(null),
  tags: Joi.array().items(Joi.string()),
});

const taskSchema = Joi.object({
  title: Joi.string().min(2).max(300).required(),
  description: Joi.string().max(2000).allow(""),
  status: Joi.string().valid("todo", "in_progress", "review", "done"),
  priority: Joi.string().valid("low", "medium", "high", "urgent"),
  projectId: Joi.string().hex().length(24).required(),
  dueDate: Joi.date().iso().allow(null),
  estimatedHours: Joi.number().min(0),
});

module.exports = {
  validateProject: validate(projectSchema),
  validateTask: validate(taskSchema),
};
