import { z } from "zod";

export const prizeFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  description: z.string().max(5000).optional().nullable(),
  imageUrl: z
    .string()
    .optional()
    .nullable()
    .refine(
      (v) => !v || v.trim() === "" || /^https?:\/\/.+/i.test(v.trim()),
      "Invalid URL"
    ),
  valueCents: z.number().int().min(0).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const eventPrizesSchema = z.object({
  assignments: z.array(
    z.object({
      prizeId: z.string().uuid(),
      rank: z.number().int().min(1),
    })
  ),
});

export type PrizeFormValues = z.infer<typeof prizeFormSchema>;
export type EventPrizesInput = z.infer<typeof eventPrizesSchema>;
