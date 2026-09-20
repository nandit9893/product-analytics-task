const Joi = require("joi");
const config = require("../config/env");
const eta = require("../lib/eta");

const signupSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(100).required().messages({
    "string.min": "Full name must be at least 2 characters",
    "string.empty": "Full name is required",
    "any.required": "Full name is required",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Please enter a valid email address",
    "string.empty": "Email is required",
    "any.required": "Email is required",
  }),
  password: Joi.string().min(8).required().messages({
    "string.min": "Password must be at least 8 characters",
    "string.empty": "Password is required",
    "any.required": "Password is required",
  }),
  confirmPassword: Joi.string().required().valid(Joi.ref('password')).messages({
    'any.only': 'Passwords do not match',
    'string.empty': 'Confirm password is required',
    'any.required': 'Confirm password is required',
  }),
});

const signinSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please enter a valid email address",
    "string.empty": "Email is required",
    "any.required": "Email is required",
  }),
  password: Joi.string().required().messages({
    "string.empty": "Password is required",
    "any.required": "Password is required",
  }),
});

function validateSignup(schema = signupSchema) {
  return async (c, next) => {
    const body = await c.req.parseBody();
    const { error, value } = schema.validate(body, {
      abortEarly: true,
      allowUnknown: true,
    });

    if (error) {
      return c.html(
        eta.render("signup", {
          error: error.details[0].message,
          turnstileSiteKey: config.turnstileSiteKey,
          fullName: body.fullName || "",
          email: body.email || "",
        }),
      );
    }

    c.set("validated", value);
    await next();
  };
}

function validateSignin(schema = signinSchema) {
  return async (c, next) => {
    const body = await c.req.parseBody();
    const { error, value } = schema.validate(body, {
      abortEarly: true,
      allowUnknown: true,
    });

    if (error) {
      return c.html(
        eta.render("signin", {
          error: error.details[0].message,
          turnstileSiteKey: config.turnstileSiteKey,
          email: body.email || "",
        }),
      );
    }

    c.set("validated", value);
    await next();
  };
}

module.exports = {
  signupSchema,
  signinSchema,
  validateSignup,
  validateSignin,
};
