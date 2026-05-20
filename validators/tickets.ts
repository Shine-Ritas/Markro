import { z } from "zod";

export const ticketPricePeriodSchema = z
  .object({
    label: z.string().max(80).optional().nullable(),
    priceCents: z.coerce.number().int().min(0).max(100_000_000),
    startsAt: z.string().min(1),
    endsAt: z.string().optional().nullable(),
    ticketTypeId: z.string().uuid().optional().nullable(),
  })
  .refine(
    (data) => {
      if (!data.endsAt) return true;
      return new Date(data.endsAt) > new Date(data.startsAt);
    },
    { message: "End must be after start", path: ["endsAt"] }
  );

export const generateTicketsSchema = z.object({
  count: z.coerce.number().int().min(1).max(10_000),
  ticketTypeId: z.string().uuid().optional().nullable(),
  /** Override auto price resolution */
  priceCents: z.coerce.number().int().min(0).optional(),
});

export const validateTicketSchema = z.object({
  qrToken: z.string().min(8),
});

export const markSoldSchema = z.object({
  ticketIds: z.array(z.string().uuid()).min(1).max(500),
});

export type TicketPricePeriodInput = z.infer<typeof ticketPricePeriodSchema>;
export type GenerateTicketsInput = z.infer<typeof generateTicketsSchema>;
