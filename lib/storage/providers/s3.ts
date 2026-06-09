import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { storageConfig } from "@/lib/storage/config";
import type {
  DeleteObjectInput,
  StorageProvider,
  UploadObjectInput,
  UploadObjectResult,
} from "@/lib/storage/types";

function assertS3Config() {
  const { bucket, accessKeyId, secretAccessKey } = storageConfig.s3;
  if (!bucket || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "S3 storage requires STORAGE_S3_BUCKET, STORAGE_S3_ACCESS_KEY_ID, and STORAGE_S3_SECRET_ACCESS_KEY"
    );
  }
}

function createS3Client() {
  assertS3Config();

  return new S3Client({
    region: storageConfig.s3.region,
    endpoint: storageConfig.s3.endpoint,
    credentials: {
      accessKeyId: storageConfig.s3.accessKeyId,
      secretAccessKey: storageConfig.s3.secretAccessKey,
    },
    forcePathStyle: Boolean(storageConfig.s3.endpoint),
  });
}

function resolvePublicUrl(key: string) {
  const normalized = key.replace(/^\/+/, "");

  if (storageConfig.s3.publicUrl) {
    return `${storageConfig.s3.publicUrl}/${normalized}`;
  }

  if (storageConfig.publicBaseUrl) {
    return `${storageConfig.publicBaseUrl}/${normalized}`;
  }

  if (storageConfig.s3.endpoint) {
    const endpoint = storageConfig.s3.endpoint.replace(/\/$/, "");
    return `${endpoint}/${storageConfig.s3.bucket}/${normalized}`;
  }

  const region =
    storageConfig.s3.region === "auto" ? "us-east-1" : storageConfig.s3.region;
  return `https://${storageConfig.s3.bucket}.s3.${region}.amazonaws.com/${normalized}`;
}

export const s3StorageProvider: StorageProvider = {
  name: "s3",

  getPublicUrl(key: string) {
    return resolvePublicUrl(key);
  },

  async upload(input: UploadObjectInput): Promise<UploadObjectResult> {
    const client = createS3Client();

    await client.send(
      new PutObjectCommand({
        Bucket: storageConfig.s3.bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.mimeType,
        CacheControl: input.cacheControl ?? "public, max-age=31536000, immutable",
      })
    );

    return {
      key: input.key,
      url: resolvePublicUrl(input.key),
      mimeType: input.mimeType,
      sizeBytes: input.body.byteLength,
    };
  },

  async delete(input: DeleteObjectInput): Promise<void> {
    const client = createS3Client();

    await client.send(
      new DeleteObjectCommand({
        Bucket: storageConfig.s3.bucket,
        Key: input.key,
      })
    );
  },
};
