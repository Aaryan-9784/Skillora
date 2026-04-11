const Joi    = require("joi");
const ApiError = require("../utils/ApiError");

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const errors = error.details.map((d) => d.message.replace(/['"]/g, ""));
    return next(ApiError.badRequest("Validation failed", errors));
  }
  next();
};

// Password must have at least one letter and one number
const passwordSchema = Joi.string()
  .min(8)
  .max(64)
  .pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)
  .required()
  .messages({
    "string.pattern.base": "Password must contain at least one letter and one number",
    "string.min": "Password must be at least 8 characters",
  });

const registerSchema = Joi.object({
  name:     Joi.string().min(2).max(100).trim().required(),
  email:    Joi.string().email().lowercase().trim().required(),
  password: passwordSchema,
});

const loginSchema = Joi.object({
  email:      Joi.string().email().lowercase().trim().required(),
  password:   Joi.string().required(),
  rememberMe: Joi.boolean().default(false),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
});

const resetPasswordSchema = Joi.object({
  password: passwordSchema,
});

module.exports = {
  validateRegister:      validate(registerSchema),
  validateLogin:         validate(loginSchema),
  validateForgotPassword: validate(forgotPasswordSchema),
  validateResetPassword:  validate(resetPasswordSchema),
};
