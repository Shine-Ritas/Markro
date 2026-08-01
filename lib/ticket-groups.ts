import type { TicketDto } from "@/types/tickets";
import type { TicketStatus } from "@prisma/client";

export type TicketTableGroup = {
  eventId: string;
  eventName: string;
  currencyCode: string | null;
  ticketTypeId: string | null;
  ticketTypeName: string;
  priceCents: number;
  total: number;
  byStatus: Record<TicketStatus, number>;
  /** Present when grouped client-side from a full ticket list */
  tickets?: TicketDto[];
};

const emptyStatusCounts = (): Record<TicketStatus, number> => ({
  AVAILABLE: 0,
  SOLD: 0,
  VALIDATED: 0,
  WINNER: 0,
  CANCELLED: 0,
});

type GroupableTicket = TicketDto & { eventName?: string; currencyCode?: string | null };

function groupKey(ticket: GroupableTicket) {
  return `${ticket.eventId}|${ticket.ticketTypeId ?? "none"}|${ticket.priceCents}`;
}

export function groupTicketsForTable(
  tickets: GroupableTicket[],
  defaultEventName = ""
): TicketTableGroup[] {
  const map = new Map<string, TicketTableGroup>();

  for (const ticket of tickets) {
    const key = groupKey(ticket);
    const existing = map.get(key);

    if (existing) {
      existing.total += 1;
      existing.byStatus[ticket.status] += 1;
      if (existing.tickets) existing.tickets.push(ticket);
      continue;
    }

    const byStatus = emptyStatusCounts();
    byStatus[ticket.status] = 1;

    map.set(key, {
      eventId: ticket.eventId,
      eventName: ticket.eventName ?? defaultEventName,
      currencyCode: ticket.currencyCode ?? null,
      ticketTypeId: ticket.ticketTypeId,
      ticketTypeName: ticket.ticketTypeName ?? "Standard",
      priceCents: ticket.priceCents,
      total: 1,
      byStatus,
      tickets: [ticket],
    });
  }

  return Array.from(map.values()).sort((a, b) => {
    const eventCompare = a.eventName.localeCompare(b.eventName);
    if (eventCompare !== 0) return eventCompare;
    const typeCompare = a.ticketTypeName.localeCompare(b.ticketTypeName);
    if (typeCompare !== 0) return typeCompare;
    return a.priceCents - b.priceCents;
  });
}
