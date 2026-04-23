import * as Joi from "joi";

export const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "production")
    .default("development"),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  CORS_ORIGIN: Joi.string().required(),
  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default("15m"),
});
