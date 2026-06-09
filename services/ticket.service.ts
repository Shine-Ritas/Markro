import type { Prisma, TicketStatus } from "@prisma/client";
import { resolvePriceCents } from "@/lib/ticket-pricing";
import {
  generateQrToken,
  toTicketDto,
  toTicketPricePeriodDto,
  toTicketTypeDto,
} from "@/lib/tickets";
import { createAuditLog } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import type {
  GenerateTicketsInput,
  TicketPricePeriodInput,
} from "@/validators/tickets";
import type { TicketSummary } from "@/types/tickets";
import type { TicketTableGroup } from "@/lib/ticket-groups";

const ticketInclude = { ticketType: true } as const;

export async function ensureDefaultTicketType(tenantId: string, eventId: string) {
  const existing = await prisma.ticketType.findFirst({
    where: { eventId, slug: "standard", deletedAt: null },
  });
  if (existing) return toTicketTypeDto(existing);

  const created = await prisma.ticketType.create({
    data: {
      tenantId,
      eventId,
      name: "Standard",
      slug: "standard",
    },
  });
  return toTicketTypeDto(created);
}

export async function listEventPricePeriods(tenantId: string, eventId: string) {
  const periods = await prisma.ticketPricePeriod.findMany({
    where: { tenantId, eventId },
    orderBy: { startsAt: "asc" },
  });
  return periods.map(toTicketPricePeriodDto);
}

export async function createEventPricePeriod(
  tenantId: string,
  eventId: string,
  input: TicketPricePeriodInput
) {
  const startsAt = new Date(input.startsAt);
  const endsAt =
    input.endsAt && input.endsAt.length > 0 ? new Date(input.endsAt) : null;

  const period = await prisma.ticketPricePeriod.create({
    data: {
      tenantId,
      eventId,
      ticketTypeId: input.ticketTypeId ?? null,
      label: input.label?.trim() || null,
      priceCents: input.priceCents,
      startsAt,
      endsAt,
    },
  });
  return toTicketPricePeriodDto(period);
}

export async function deleteEventPricePeriod(
  tenantId: string,
  eventId: string,
  periodId: string
) {
  const deleted = await prisma.ticketPricePeriod.deleteMany({
    where: { id: periodId, tenantId, eventId },
  });
  return deleted.count > 0;
}

export async function resolveCurrentPriceForEvent(
  tenantId: string,
  eventId: string,
  ticketTypeId?: string | null,
  at = new Date()
) {
  const periods = await prisma.ticketPricePeriod.findMany({
    where: { tenantId, eventId },
  });
  return resolvePriceCents(periods, at, ticketTypeId);
}

async function nextTicketNumbers(eventId: string, count: number) {
  const last = await prisma.ticket.findFirst({
    where: { eventId, deletedAt: null },
    orderBy: { ticketNumber: "desc" },
    select: { ticketNumber: true },
  });

  let start = 1;
  if (last?.ticketNumber) {
    const parsed = parseInt(last.ticketNumber, 10);
    if (!Number.isNaN(parsed)) start = parsed + 1;
  }

  return Array.from({ length: count }, (_, i) => String(start + i).padStart(4, "0"));
}

export async function listEventTickets(
  tenantId: string,
  eventId: string,
  options?: {
    status?: TicketStatus;
    search?: string;
    limit?: number;
    offset?: number;
  }
) {
  const where: Prisma.TicketWhereInput = {
    tenantId,
    eventId,
    deletedAt: null,
    ...(options?.status ? { status: options.status } : {}),
    ...(options?.search
      ? { ticketNumber: { contains: options.search, mode: "insensitive" } }
      : {}),
  };

  const tickets = await prisma.ticket.findMany({
    where,
    include: ticketInclude,
    orderBy: { ticketNumber: "asc" },
    ...(options?.limit !== undefined ? { take: options.limit } : {}),
    ...(options?.offset !== undefined ? { skip: options.offset } : {}),
  });

  return tickets.map(toTicketDto);
}

export async function getTicketById(tenantId: string, ticketId: string) {
  const ticket = await prisma.ticket.findFirst({
    where: { id: ticketId, tenantId, deletedAt: null },
    include: ticketInclude,
  });
  return ticket ? toTicketDto(ticket) : null;
}

export async function generateEventTickets(
  tenantId: string,
  eventId: string,
  actorId: string,
  input: GenerateTicketsInput
) {
  const event = await prisma.event.findFirst({
    where: { id: eventId, tenantId, deletedAt: null },
  });
  if (!event) return { error: "Event not found" as const };

  const existingCount = await prisma.ticket.count({
    where: { eventId, deletedAt: null },
  });

  if (existingCount + input.count > event.ticketQuantity) {
    return {
      error: `Cannot exceed event capacity (${event.ticketQuantity} tickets)` as const,
    };
  }

  const defaultType = await ensureDefaultTicketType(tenantId, eventId);
  const ticketTypeId = input.ticketTypeId ?? defaultType.id;

  const ticketType = await prisma.ticketType.findFirst({
    where: { id: ticketTypeId, eventId, deletedAt: null },
  });

  if (!ticketType) return { error: "Ticket type not found" as const };

  const priceCents =
    input.priceCents ??
    (await resolveCurrentPriceForEvent(tenantId, eventId, ticketType.id));

  if (priceCents === null) {
    return {
      error:
        "No active price period for this date. Add a price schedule first." as const,
    };
  }

  const numbers = await nextTicketNumbers(eventId, input.count);

  const created = await prisma.$transaction(
    numbers.map((ticketNumber) =>
      prisma.ticket.create({
        data: {
          tenantId,
          eventId,
          ticketTypeId: ticketType.id,
          ticketNumber,
          priceCents,
          status: "AVAILABLE",
          qrToken: generateQrToken(),
          transactions: {
            create: {
              tenantId,
              type: "GENERATED",
              amountCents: priceCents,
              actorId,
            },
          },
        },
        include: ticketInclude,
      })
    )
  );

  await createAuditLog({
    tenantId,
    actorId,
    action: "tickets.generated",
    entity: "event",
    entityId: eventId,
    metadata: { count: input.count, priceCents },
  });

  return { tickets: created.map(toTicketDto) };
}

export async function markTicketsSold(
  tenantId: string,
  actorId: string,
  ticketIds: string[]
) {
  const now = new Date();
  const updated = await prisma.ticket.updateMany({
    where: {
      id: { in: ticketIds },
      tenantId,
      status: "AVAILABLE",
      deletedAt: null,
    },
    data: { status: "SOLD", soldAt: now },
  });

  if (updated.count > 0) {
    await prisma.ticketTransaction.createMany({
      data: ticketIds.map((ticketId) => ({
        tenantId,
        ticketId,
        type: "SALE" as const,
        actorId,
      })),
    });
  }

  return updated.count;
}

export async function validateTicketByQrToken(
  tenantId: string,
  qrToken: string,
  actorId?: string
) {
  const ticket = await prisma.ticket.findFirst({
    where: { qrToken, tenantId, deletedAt: null },
    include: ticketInclude,
  });

  if (!ticket) {
    return { valid: false, message: "Ticket not found" };
  }

  if (ticket.status === "CANCELLED") {
    return { valid: false, message: "Ticket cancelled", ticket: toTicketDto(ticket) };
  }

  if (ticket.status === "AVAILABLE") {
    return {
      valid: false,
      message: "Ticket not sold yet",
      ticket: toTicketDto(ticket),
    };
  }

  if (ticket.status === "VALIDATED") {
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        scanCount: { increment: 1 },
        lastScannedAt: new Date(),
      },
    });
    return {
      valid: false,
      duplicate: true,
      message: "Already validated — duplicate scan",
      ticket: toTicketDto(ticket),
    };
  }

  const now = new Date();
  const updated = await prisma.ticket.update({
    where: { id: ticket.id },
    data: {
      status: "VALIDATED",
      validatedAt: now,
      lastScannedAt: now,
      scanCount: { increment: 1 },
    },
    include: ticketInclude,
  });

  await prisma.ticketTransaction.create({
    data: {
      tenantId,
      ticketId: ticket.id,
      type: "VALIDATION",
      actorId,
    },
  });

  return {
    valid: true,
    message: "Ticket validated successfully",
    ticket: toTicketDto(updated),
  };
}

const emptyStatusCounts = (): Record<TicketStatus, number> => ({
  AVAILABLE: 0,
  SOLD: 0,
  VALIDATED: 0,
  CANCELLED: 0,
});

export async function getTenantTicketSummary(tenantId: string): Promise<TicketSummary> {
  const where = { tenantId, deletedAt: null };

  const [total, statusGroups, priceGroups] = await Promise.all([
    prisma.ticket.count({ where }),
    prisma.ticket.groupBy({
      by: ["status"],
      where,
      _count: { _all: true },
    }),
    prisma.ticket.groupBy({
      by: ["priceCents"],
      where,
      _count: { _all: true },
      orderBy: { priceCents: "asc" },
    }),
  ]);

  const byStatus = emptyStatusCounts();
  for (const group of statusGroups) {
    byStatus[group.status] = group._count._all;
  }

  return {
    total,
    byStatus,
    byPrice: priceGroups.map((g) => ({
      priceCents: g.priceCents,
      count: g._count._all,
    })),
  };
}

export async function listTenantTicketTableGroups(
  tenantId: string
): Promise<TicketTableGroup[]> {
  const where = { tenantId, deletedAt: null };

  const rows = await prisma.ticket.groupBy({
    by: ["eventId", "ticketTypeId", "priceCents", "status"],
    where,
    _count: { _all: true },
  });

  if (rows.length === 0) return [];

  const eventIds = [...new Set(rows.map((r) => r.eventId))];
  const ticketTypeIds = [
    ...new Set(
      rows.map((r) => r.ticketTypeId).filter((id): id is string => id !== null)
    ),
  ];

  const [events, ticketTypes] = await Promise.all([
    prisma.event.findMany({
      where: { id: { in: eventIds } },
      select: { id: true, name: true, currencyCode: true },
    }),
    ticketTypeIds.length > 0
      ? prisma.ticketType.findMany({
          where: { id: { in: ticketTypeIds } },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
  ]);

  const eventNames = new Map(events.map((e) => [e.id, e.name]));
  const eventCurrencies = new Map(events.map((e) => [e.id, e.currencyCode]));
  const typeNames = new Map(ticketTypes.map((t) => [t.id, t.name]));

  const groups = new Map<string, TicketTableGroup>();

  for (const row of rows) {
    const key = `${row.eventId}|${row.ticketTypeId ?? "none"}|${row.priceCents}`;
    let group = groups.get(key);

    if (!group) {
      group = {
        eventId: row.eventId,
        eventName: eventNames.get(row.eventId) ?? "Unknown event",
        currencyCode: eventCurrencies.get(row.eventId) ?? null,
        ticketTypeId: row.ticketTypeId,
        ticketTypeName: row.ticketTypeId
          ? (typeNames.get(row.ticketTypeId) ?? "Standard")
          : "Standard",
        priceCents: row.priceCents,
        total: 0,
        byStatus: emptyStatusCounts(),
      };
      groups.set(key, group);
    }

    group.total += row._count._all;
    group.byStatus[row.status] = row._count._all;
  }

  return Array.from(groups.values()).sort((a, b) => {
    const eventCompare = a.eventName.localeCompare(b.eventName);
    if (eventCompare !== 0) return eventCompare;
    const typeCompare = a.ticketTypeName.localeCompare(b.ticketTypeName);
    if (typeCompare !== 0) return typeCompare;
    return a.priceCents - b.priceCents;
  });
}

export async function listTenantTickets(
  tenantId: string,
  options?: { eventId?: string; limit?: number }
) {
  const tickets = await prisma.ticket.findMany({
    where: {
      tenantId,
      deletedAt: null,
      ...(options?.eventId ? { eventId: options.eventId } : {}),
    },
    include: {
      ...ticketInclude,
      event: { select: { id: true, name: true, slug: true } },
    },
    orderBy: [{ priceCents: "asc" }, { ticketNumber: "asc" }],
    take: options?.limit ?? 100,
  });

  return tickets.map((t) => ({
    ...toTicketDto(t),
    eventName: t.event.name,
    eventSlug: t.event.slug,
  }));
}
