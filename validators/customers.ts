import { z } from "zod";

export const customerSourceSchema = z.enum(["POS", "MANUAL", "IMPORT", "ONLINE"]);

export const customerFormSchema = z.object({
  displayName: z.string().min(1, "Name is required").max(120),
  phone: z.string().min(5, "Phone is required").max(30),
  email: z.string().email("Invalid email").optional().nullable().or(z.literal("")),
  referredById: z.string().uuid().optional().nullable(),
  source: customerSourceSchema.optional(),
});

export const customerListQuerySchema = z.object({
  q: z.string().optional(),
  blacklisted: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  hasPurchases: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export const customerNoteSchema = z.object({
  body: z.string().min(1, "Note is required").max(5000),
});

export const customerBlacklistSchema = z.object({
  isBlacklisted: z.boolean(),
  reason: z.string().max(1000).optional().nullable(),
});

export const referralCreateSchema = z.object({
  referredPhone: z.string().min(5).max(30),
  eventId: z.string().uuid().optional().nullable(),
  rewardPoints: z.number().int().min(0).optional().default(0),
});

export type CustomerListQuery = {
  q?: string;
  blacklisted?: boolean;
  hasPurchases?: boolean;
  limit?: number;
  offset?: number;
};

export type CustomerFormValues = z.infer<typeof customerFormSchema>;
export type CustomerNoteInput = z.infer<typeof customerNoteSchema>;
export type CustomerBlacklistInput = z.infer<typeof customerBlacklistSchema>;
export type ReferralCreateInput = z.infer<typeof referralCreateSchema>;
