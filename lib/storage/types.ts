export type StorageProviderName = "local" | "s3";

export type ImageUploadPurpose =
  | "events/banner"
  | "events/gallery"
  | "tenant/logo"
  | "general";

export type UploadObjectInput = {
  key: string;
  body: Buffer;
  mimeType: string;
  cacheControl?: string;
};

export type UploadObjectResult = {
  key: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
};

export type DeleteObjectInput = {
  key: string;
};

export interface StorageProvider {
  readonly name: StorageProviderName;
  upload(input: UploadObjectInput): Promise<UploadObjectResult>;
  delete(input: DeleteObjectInput): Promise<void>;
  getPublicUrl(key: string): string;
}
