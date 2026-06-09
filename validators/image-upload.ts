import { z } from "zod";

export const imageUploadPurposeSchema = z.enum([
  "events/banner",
  "events/gallery",
  "tenant/logo",
  "general",
]);

export type ImageUploadPurposeInput = z.infer<typeof imageUploadPurposeSchema>;
