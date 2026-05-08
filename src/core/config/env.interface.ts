export interface EnvConfig {
  NODE_ENV: "development" | "production";
  PORT: number;
  DATABASE_URL: string;
  CORS_ORIGIN: string;
  JWT_ACCESS_SECRET: string;
  JWT_ACCESS_EXPIRES_IN: string;
  MINIO_ENDPOINT: string;
  MINIO_PORT: number;
  MINIO_USE_SSL: boolean;
  MINIO_ROOT_USER: string;
  MINIO_ROOT_PASSWORD: string;
}
