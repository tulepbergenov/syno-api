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
  MINIO_ENDPOINT: Joi.string().hostname().required(),
  MINIO_PORT: Joi.number().integer().min(1).max(65535).required(),
  MINIO_USE_SSL: Joi.boolean().required(),
  MINIO_ROOT_USER: Joi.string().required(),
  MINIO_ROOT_PASSWORD: Joi.string().required(),
});
