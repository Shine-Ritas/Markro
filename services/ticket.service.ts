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
  options?: { status?: TicketStatus; search?: string }
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
    orderBy: { createdAt: "desc" },
    take: options?.limit ?? 100,
  });

  return tickets.map((t) => ({
    ...toTicketDto(t),
    eventName: t.event.name,
    eventSlug: t.event.slug,
  }));
}
