import { z } from "zod";
import { ticketListViewSchema } from "@/validators/events";

export const ticketAppearanceSchema = z.object({
  ticketDesignId: z.string().uuid("Select a ticket design"),
  ticketListViewDefault: ticketListViewSchema,
});

export type TicketAppearanceValues = z.infer<typeof ticketAppearanceSchema>;
