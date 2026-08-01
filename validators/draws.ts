import { z } from "zod";

export const manualPickSchema = z.object({
  ticketNumber: z.string().min(1, "Ticket number is required").max(32),
});

export const winnersHistoryQuerySchema = z.object({
  eventId: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  q: z.string().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export type WinnersHistoryQuery = z.infer<typeof winnersHistoryQuerySchema>;
