import type { StorageProviderName } from "@/lib/storage/types";

function readProvider(): StorageProviderName {
  const value = process.env.STORAGE_PROVIDER?.trim().toLowerCase();
  if (value === "s3") return "s3";
  return "local";
}

export const storageConfig = {
  provider: readProvider(),
  publicBaseUrl: process.env.STORAGE_PUBLIC_BASE_URL?.replace(/\/$/, "") ?? "",
  local: {
    rootDir: process.env.STORAGE_LOCAL_DIR?.trim() || "public/uploads",
    urlPrefix: "/uploads",
  },
  s3: {
    bucket: process.env.STORAGE_S3_BUCKET?.trim() ?? "",
    region: process.env.STORAGE_S3_REGION?.trim() || "auto",
    accessKeyId: process.env.STORAGE_S3_ACCESS_KEY_ID?.trim() ?? "",
    secretAccessKey: process.env.STORAGE_S3_SECRET_ACCESS_KEY?.trim() ?? "",
    endpoint: process.env.STORAGE_S3_ENDPOINT?.trim() || undefined,
    publicUrl: process.env.STORAGE_S3_PUBLIC_URL?.replace(/\/$/, "") || undefined,
  },
} as const;

export const imageUploadConfig = {
  maxBytes: Number(process.env.IMAGE_UPLOAD_MAX_BYTES ?? 5 * 1024 * 1024),
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"] as const,
};
