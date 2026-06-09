---
name: image-upload
description: >-
  Upload, delete, and resolve public URLs for tenant-scoped images via a
  swappable storage provider (local dev or S3-compatible cloud). Use when adding
  image uploads, switching storage vendors, wiring banner/logo uploads, or
  changing STORAGE_PROVIDER env vars.
---

# Image upload & storage

LuckDraw stores **URLs in the database** (e.g. `events.banner_url`) and uploads bytes through a **provider-agnostic** layer so we can change cloud vendors yearly without rewriting feature code.

## Architecture

```
API route / feature code
        ↓
services/image-upload.service.ts   ← validation, tenant keys, errors
        ↓
lib/storage/index.ts               ← picks provider from STORAGE_PROVIDER
        ↓
providers/local.ts | providers/s3.ts
```

**Rule:** Features call `uploadTenantImage` / `deleteTenantImage` — never import `@aws-sdk` or touch the filesystem directly.

## Env vars

| Variable                       | Purpose                                          | Default            |
| ------------------------------ | ------------------------------------------------ | ------------------ |
| `STORAGE_PROVIDER`             | `local` or `s3`                                  | `local`            |
| `STORAGE_PUBLIC_BASE_URL`      | Optional CDN/app origin prefix for returned URLs | —                  |
| `IMAGE_UPLOAD_MAX_BYTES`       | Max upload size in bytes                         | `5242880` (5MB)    |
| `STORAGE_LOCAL_DIR`            | Local disk root                                  | `public/uploads`   |
| `STORAGE_S3_BUCKET`            | S3-compatible bucket                             | required when `s3` |
| `STORAGE_S3_REGION`            | AWS region (`auto` for R2)                       | `auto`             |
| `STORAGE_S3_ACCESS_KEY_ID`     | Access key                                       | required when `s3` |
| `STORAGE_S3_SECRET_ACCESS_KEY` | Secret key                                       | required when `s3` |
| `STORAGE_S3_ENDPOINT`          | Custom endpoint (R2, MinIO, B2)                  | omit for AWS       |
| `STORAGE_S3_PUBLIC_URL`        | Public CDN/base URL for objects                  | optional           |

## Switching cloud vendors (yearly)

1. Provision the new bucket + credentials.
2. Set `STORAGE_PROVIDER=s3` and the `STORAGE_S3_*` vars (R2/MinIO need `STORAGE_S3_ENDPOINT`).
3. Set `STORAGE_S3_PUBLIC_URL` or `STORAGE_PUBLIC_BASE_URL` to the CDN origin customers see.
4. **Do not** change `services/image-upload.service.ts` or API routes.
5. Old URLs in DB keep working until you migrate objects + update rows (migration is a separate task).

To add a non-S3 provider (GCS, Azure): implement `StorageProvider` in `lib/storage/providers/`, register it in `lib/storage/index.ts`, and add a new `STORAGE_PROVIDER` value.

## Upload from the client

```ts
const form = new FormData();
form.append("file", file);
form.append("purpose", "events/banner"); // optional

const res = await fetch("/api/uploads/images", { method: "POST", body: form });
const { image } = await res.json();
// image.url → save on event.bannerUrl
```

Purposes: `events/banner`, `events/gallery`, `tenant/logo`, `general`.

## Server-side usage

```ts
import { uploadTenantImage } from "@/services/image-upload.service";

const image = await uploadTenantImage({
  tenantId,
  purpose: "events/banner",
  fileName: file.name,
  mimeType: file.type,
  body: Buffer.from(await file.arrayBuffer()),
});
// image.url, image.key
```

## Object key layout

`{tenantId}/{purpose}/{uuid}.{ext}` — tenant prefix is enforced on delete.

## Allowed types

JPEG, PNG, WebP, GIF (`imageUploadConfig.allowedMimeTypes`).

## Local dev

Default `STORAGE_PROVIDER=local` writes under `public/uploads/` and serves at `/uploads/...`. Uploaded files are gitignored.

## New provider checklist

- [ ] Add `lib/storage/providers/<name>.ts` implementing `StorageProvider`
- [ ] Extend `StorageProviderName` in `lib/storage/types.ts`
- [ ] Wire factory in `lib/storage/index.ts`
- [ ] Document env vars in `.env.example` and this skill
- [ ] Append decision to `.cursor/planning/other.md`
