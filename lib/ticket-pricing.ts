import type { TicketPricePeriod } from "@prisma/client";

/** Resolve active price at a given moment (no history — first matching period wins). */
export function resolvePriceCents(
  periods: TicketPricePeriod[],
  at: Date = new Date(),
  ticketTypeId?: string | null
): number | null {
  const active = periods.filter((p) => {
    const afterStart = at >= p.startsAt;
    const beforeEnd = !p.endsAt || at <= p.endsAt;
    if (!afterStart || !beforeEnd) return false;
    if (ticketTypeId) return p.ticketTypeId === ticketTypeId || p.ticketTypeId === null;
    return p.ticketTypeId === null;
  });

  if (active.length === 0) return null;

  const typed = ticketTypeId
    ? (active.find((p) => p.ticketTypeId === ticketTypeId) ??
      active.find((p) => !p.ticketTypeId))
    : (active.find((p) => !p.ticketTypeId) ?? active[0]);

  return typed?.priceCents ?? null;
}
