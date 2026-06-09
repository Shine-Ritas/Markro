import { storageConfig } from "@/lib/storage/config";
import { localStorageProvider } from "@/lib/storage/providers/local";
import { s3StorageProvider } from "@/lib/storage/providers/s3";
import type { StorageProvider } from "@/lib/storage/types";

let cachedProvider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (cachedProvider) return cachedProvider;

  cachedProvider =
    storageConfig.provider === "s3" ? s3StorageProvider : localStorageProvider;

  return cachedProvider;
}

export function resetStorageProviderForTests() {
  cachedProvider = null;
}

export type {
  DeleteObjectInput,
  ImageUploadPurpose,
  StorageProvider,
  StorageProviderName,
  UploadObjectInput,
  UploadObjectResult,
} from "@/lib/storage/types";

export { imageUploadConfig, storageConfig } from "@/lib/storage/config";
