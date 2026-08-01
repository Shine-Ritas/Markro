import { randomUUID } from "node:crypto";
import path from "node:path";
import {
  getStorageProvider,
  imageUploadConfig,
  storageConfig,
  type ImageUploadPurpose,
} from "@/lib/storage";

import { createModuleLogger } from "@/lib/logger";

const log = createModuleLogger("services.image-upload.service");

const MIME_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export type UploadTenantImageInput = {
  tenantId: string;
  purpose?: ImageUploadPurpose;
  fileName?: string;
  mimeType: string;
  body: Buffer;
};

export type UploadTenantImageResult = {
  key: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  purpose: ImageUploadPurpose;
};

export class ImageUploadError extends Error {
  constructor(
    message: string,
    public code: "INVALID_TYPE" | "FILE_TOO_LARGE" | "UPLOAD_FAILED"
  ) {
    super(message);
  }
}

function sanitizeSegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function extensionFromMimeType(mimeType: string) {
  return MIME_EXTENSION[mimeType] ?? "bin";
}

function extensionFromFileName(fileName?: string) {
  if (!fileName) return null;
  const ext = path.extname(fileName).replace(/^\./, "").toLowerCase();
  return ext.length > 0 ? ext : null;
}

export function buildImageObjectKey(
  tenantId: string,
  purpose: ImageUploadPurpose,
  mimeType: string,
  fileName?: string
) {
  const ext = extensionFromFileName(fileName) ?? extensionFromMimeType(mimeType);
  const folder = sanitizeSegment(purpose) || "general";
  return `${tenantId}/${folder}/${randomUUID()}.${ext}`;
}

export function validateImageUpload(mimeType: string, sizeBytes: number) {
  if (
    !imageUploadConfig.allowedMimeTypes.includes(
      mimeType as (typeof imageUploadConfig.allowedMimeTypes)[number]
    )
  ) {
    throw new ImageUploadError(
      `Unsupported image type. Allowed: ${imageUploadConfig.allowedMimeTypes.join(", ")}`,
      "INVALID_TYPE"
    );
  }

  if (sizeBytes > imageUploadConfig.maxBytes) {
    const maxMb = Math.round(imageUploadConfig.maxBytes / (1024 * 1024));
    throw new ImageUploadError(`Image must be ${maxMb}MB or smaller`, "FILE_TOO_LARGE");
  }
}

export async function uploadTenantImage(
  input: UploadTenantImageInput
): Promise<UploadTenantImageResult> {
  const purpose = input.purpose ?? "general";

  validateImageUpload(input.mimeType, input.body.byteLength);

  const key = buildImageObjectKey(
    input.tenantId,
    purpose,
    input.mimeType,
    input.fileName
  );

  const provider = getStorageProvider();

  try {
    const uploaded = await provider.upload({
      key,
      body: input.body,
      mimeType: input.mimeType,
    });

    return {
      ...uploaded,
      purpose,
    };
  } catch (error) {
    if (error instanceof ImageUploadError) throw error;
    log.error({ err: error }, "[image-upload]");
    throw new ImageUploadError("Failed to upload image", "UPLOAD_FAILED");
  }
}

export async function deleteTenantImage(key: string, tenantId: string) {
  if (!key.startsWith(`${tenantId}/`)) {
    throw new ImageUploadError(
      "Cannot delete image outside tenant scope",
      "UPLOAD_FAILED"
    );
  }

  await getStorageProvider().delete({ key });
}

export function getTenantImageUrl(key: string) {
  return getStorageProvider().getPublicUrl(key);
}

export function isManagedStorageUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return false;

  if (storageConfig.provider === "local") {
    return trimmed.includes(`${storageConfig.local.urlPrefix}/`);
  }

  if (storageConfig.s3.publicUrl && trimmed.startsWith(storageConfig.s3.publicUrl)) {
    return true;
  }

  if (storageConfig.publicBaseUrl && trimmed.startsWith(storageConfig.publicBaseUrl)) {
    return true;
  }

  return trimmed.includes(`/${storageConfig.s3.bucket}/`);
}
