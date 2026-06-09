import { z } from "zod";

export const posSaleDraftSchema = z.object({
  eventId: z.string().uuid(),
  ticketIds: z.array(z.string().uuid()).min(1).max(50),
  customerName: z.string().trim().max(120).optional().nullable(),
  customerPhone: z.string().trim().max(40).optional().nullable(),
  customerEmail: z
    .string()
    .trim()
    .email()
    .max(200)
    .optional()
    .nullable()
    .or(z.literal("")),
});

export const posSaleUpdateSchema = z
  .object({
    eventId: z.string().uuid().optional(),
    ticketIds: z.array(z.string().uuid()).min(1).max(50).optional(),
    customerName: z.string().trim().max(120).optional().nullable(),
    customerPhone: z.string().trim().max(40).optional().nullable(),
    customerEmail: z
      .string()
      .trim()
      .email()
      .max(200)
      .optional()
      .nullable()
      .or(z.literal("")),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export type PosSaleDraftInput = z.infer<typeof posSaleDraftSchema>;
export type PosSaleUpdateInput = z.infer<typeof posSaleUpdateSchema>;

export const posSalesHistoryQuerySchema = z.object({
  eventId: z.string().uuid().optional(),
  from: z.string().trim().optional(),
  to: z.string().trim().optional(),
  q: z.string().trim().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export type PosSalesHistoryQuery = z.infer<typeof posSalesHistoryQuerySchema>;
