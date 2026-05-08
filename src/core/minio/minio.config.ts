import { Client } from "minio";

export function createMinioClient(): Client {
  const endpoint = process.env.MINIO_ENDPOINT;
  const portRaw = process.env.MINIO_PORT;
  const useSslRaw = process.env.MINIO_USE_SSL;
  const accessKey = process.env.MINIO_ROOT_USER;
  const secretKey = process.env.MINIO_ROOT_PASSWORD;

  if (!endpoint || !portRaw || !useSslRaw || !accessKey || !secretKey) {
    throw new Error("MinIO env vars are not configured correctly");
  }

  const port = Number(portRaw);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("MINIO_PORT must be a positive integer");
  }

  return new Client({
    endPoint: endpoint,
    port,
    useSSL: useSslRaw === "true",
    accessKey,
    secretKey,
  });
}
