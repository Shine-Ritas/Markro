import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { storageConfig } from "@/lib/storage/config";
import type {
  DeleteObjectInput,
  StorageProvider,
  UploadObjectInput,
  UploadObjectResult,
} from "@/lib/storage/types";

function resolveLocalPath(key: string) {
  const normalized = key.replace(/^\/+/, "").replace(/\.\./g, "");
  return path.join(storageConfig.local.rootDir, normalized);
}

function resolvePublicUrl(key: string) {
  const normalized = key.replace(/^\/+/, "");
  const relative = `${storageConfig.local.urlPrefix}/${normalized}`;

  if (storageConfig.publicBaseUrl) {
    return `${storageConfig.publicBaseUrl}${relative}`;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  return appUrl ? `${appUrl}${relative}` : relative;
}

export const localStorageProvider: StorageProvider = {
  name: "local",

  getPublicUrl(key: string) {
    return resolvePublicUrl(key);
  },

  async upload(input: UploadObjectInput): Promise<UploadObjectResult> {
    const filePath = resolveLocalPath(input.key);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, input.body);

    return {
      key: input.key,
      url: resolvePublicUrl(input.key),
      mimeType: input.mimeType,
      sizeBytes: input.body.byteLength,
    };
  },

  async delete(input: DeleteObjectInput): Promise<void> {
    const filePath = resolveLocalPath(input.key);
    await unlink(filePath).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
    });
  },
};
