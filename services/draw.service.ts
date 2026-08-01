import { randomInt } from "node:crypto";
import type { DrawSelectionMethod, Prisma, Ticket } from "@prisma/client";
import { createAuditLog } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import type {
  DrawSessionDto,
  DrawWinnerDto,
  EligibleTicketSummary,
  TenantWinnerListItem,
  WinnersHistoryResult,
} from "@/types/draws";
import type { WinnersHistoryQuery } from "@/validators/draws";
import { getNextPrizeRank } from "@/lib/draw-order";
import {
  getEventPrizeForRank,
  validateEventPrizesForDraw,
} from "@/services/prize.service";
import { resolveCustomerIdForTicket } from "@/services/customer.service";

const sessionInclude = {
  winners: {
    include: {
      ticket: { select: { ticketNumber: true } },
    },
    orderBy: { rank: "asc" as const },
  },
} as const;

type SessionWithWinners = Prisma.DrawSessionGetPayload<{
  include: typeof sessionInclude;
}>;

function toDrawWinnerDto(winner: SessionWithWinners["winners"][number]): DrawWinnerDto {
  return {
    id: winner.id,
    drawSessionId: winner.drawSessionId,
    eventId: winner.eventId,
    ticketId: winner.ticketId,
    ticketNumber: winner.ticket.ticketNumber,
    rank: winner.rank,
    tier: winner.tier,
    selectionMethod: winner.selectionMethod,
    userId: winner.userId,
    customerId: winner.customerId,
    buyerName: winner.buyerName,
    buyerPhone: winner.buyerPhone,
    buyerEmail: winner.buyerEmail,
    eventPrizeId: winner.eventPrizeId,
    prizeId: winner.prizeId,
    prizeName: winner.prizeName,
    selectedAt: winner.selectedAt.toISOString(),
  };
}

function toDrawSessionDto(session: SessionWithWinners): DrawSessionDto {
  return {
    id: session.id,
    tenantId: session.tenantId,
    eventId: session.eventId,
    status: session.status,
    winnerCount: session.winnerCount,
    drawOrder: session.drawOrder,
    eligibleCount: session.eligibleCount,
    startedAt: session.startedAt?.toISOString() ?? null,
    completedAt: session.completedAt?.toISOString() ?? null,
    winners: session.winners.map(toDrawWinnerDto),
    createdAt: session.createdAt.toISOString(),
  };
}

async function resolveBuyerSnapshot(ticketId: string) {
  const line = await prisma.posSaleLine.findFirst({
    where: {
      ticketId,
      posSale: { status: "COMPLETED" },
    },
    include: {
      posSale: {
        select: {
          customerName: true,
          customerPhone: true,
          customerEmail: true,
        },
      },
    },
    orderBy: { posSale: { completedAt: "desc" } },
  });

  if (!line) {
    return { buyerName: null, buyerPhone: null, buyerEmail: null };
  }

  return {
    buyerName: line.posSale.customerName,
    buyerPhone: line.posSale.customerPhone,
    buyerEmail: line.posSale.customerEmail,
  };
}

async function getWinnerTicketIdsForEvent(eventId: string): Promise<Set<string>> {
  const winners = await prisma.drawWinner.findMany({
    where: { eventId },
    select: { ticketId: true },
  });
  return new Set(winners.map((w) => w.ticketId));
}

export async function getEligibleTickets(
  tenantId: string,
  eventId: string
): Promise<EligibleTicketSummary[]> {
  const winnerIds = await getWinnerTicketIdsForEvent(eventId);

  const tickets = await prisma.ticket.findMany({
    where: {
      tenantId,
      eventId,
      deletedAt: null,
      status: { in: ["SOLD", "VALIDATED"] },
      ...(winnerIds.size > 0 ? { id: { notIn: [...winnerIds] } } : {}),
    },
    select: { id: true, ticketNumber: true, status: true },
    orderBy: { ticketNumber: "asc" },
  });

  return tickets;
}

export async function getActiveDrawSession(tenantId: string, eventId: string) {
  const session = await prisma.drawSession.findFirst({
    where: {
      tenantId,
      eventId,
      status: { in: ["PENDING", "IN_PROGRESS"] },
    },
    include: sessionInclude,
    orderBy: { createdAt: "desc" },
  });

  return session ? toDrawSessionDto(session) : null;
}

export async function startDrawSession(
  tenantId: string,
  eventId: string,
  actorId: string
): Promise<{ session?: DrawSessionDto; error?: string }> {
  const event = await prisma.event.findFirst({
    where: { id: eventId, tenantId, deletedAt: null },
  });

  if (!event) return { error: "Event not found" };
  if (event.status !== "PUBLISHED") {
    return { error: "Only published events can run a draw" };
  }

  const existing = await prisma.drawSession.findFirst({
    where: {
      tenantId,
      eventId,
      status: { in: ["PENDING", "IN_PROGRESS"] },
    },
  });
  if (existing) return { error: "A draw session is already in progress" };

  const prizeCheck = await validateEventPrizesForDraw(tenantId, eventId);
  if (!prizeCheck.ok) {
    return { error: prizeCheck.error };
  }

  const eligible = await getEligibleTickets(tenantId, eventId);
  if (eligible.length === 0) {
    return { error: "No eligible tickets for draw" };
  }
  if (eligible.length < event.winnerCount) {
    return {
      error: `Not enough eligible tickets (${eligible.length}) for ${event.winnerCount} winners`,
    };
  }

  const session = await prisma.drawSession.create({
    data: {
      tenantId,
      eventId,
      status: "IN_PROGRESS",
      winnerCount: event.winnerCount,
      drawOrder: event.drawOrder,
      eligibleCount: eligible.length,
      startedAt: new Date(),
      actorId,
    },
    include: sessionInclude,
  });

  await createAuditLog({
    tenantId,
    actorId,
    action: "draw.started",
    entity: "draw_session",
    entityId: session.id,
    metadata: {
      eventId,
      eligibleCount: eligible.length,
      winnerCount: event.winnerCount,
    },
  });

  return { session: toDrawSessionDto(session) };
}

async function loadSessionForPick(sessionId: string, tenantId: string) {
  return prisma.drawSession.findFirst({
    where: { id: sessionId, tenantId, status: "IN_PROGRESS" },
    include: {
      ...sessionInclude,
      event: { select: { winnerCount: true, name: true } },
    },
  });
}

async function pickWinnerInTransaction(
  session: NonNullable<Awaited<ReturnType<typeof loadSessionForPick>>>,
  ticket: Ticket,
  selectionMethod: DrawSelectionMethod,
  actorId: string
): Promise<DrawWinnerDto> {
  const picksSoFar = session.winners.length;
  const prizeRank = getNextPrizeRank(
    session.winnerCount,
    picksSoFar,
    session.drawOrder
  );
  const buyer = await resolveBuyerSnapshot(ticket.id);
  const eventPrize = await getEventPrizeForRank(session.eventId, prizeRank);
  const customerId = await resolveCustomerIdForTicket(session.tenantId, ticket.id);

  const winner = await prisma.$transaction(async (tx) => {
    const fresh = await tx.drawSession.findFirst({
      where: { id: session.id, status: "IN_PROGRESS" },
      include: { winners: { select: { id: true } } },
    });
    if (!fresh) throw new Error("Draw session is no longer active");
    if (fresh.winners.length >= session.winnerCount) {
      throw new Error("All winners have already been selected");
    }

    const nextRank = getNextPrizeRank(
      session.winnerCount,
      fresh.winners.length,
      session.drawOrder
    );

    const existingWinner = await tx.drawWinner.findUnique({
      where: { ticketId: ticket.id },
    });
    if (existingWinner) throw new Error("Ticket has already won");

    return tx.drawWinner.create({
      data: {
        tenantId: session.tenantId,
        drawSessionId: session.id,
        eventId: session.eventId,
        ticketId: ticket.id,
        rank: nextRank,
        selectionMethod,
        actorId,
        customerId,
        eventPrizeId: eventPrize?.id ?? null,
        prizeId: eventPrize?.prizeId ?? null,
        prizeName: eventPrize?.prize.name ?? null,
        ...buyer,
      },
      include: { ticket: { select: { ticketNumber: true } } },
    });
  });

  await createAuditLog({
    tenantId: session.tenantId,
    actorId,
    action: "winner.selected",
    entity: "draw_winner",
    entityId: winner.id,
    metadata: {
      eventId: session.eventId,
      ticketNumber: ticket.ticketNumber,
      rank: prizeRank,
      selectionMethod,
    },
  });

  return toDrawWinnerDto(winner);
}

export async function pickRandomWinner(
  tenantId: string,
  sessionId: string,
  actorId: string
): Promise<{ winner?: DrawWinnerDto; session?: DrawSessionDto; error?: string }> {
  const session = await loadSessionForPick(sessionId, tenantId);
  if (!session) return { error: "Draw session not found or not in progress" };
  if (session.winners.length >= session.winnerCount) {
    return { error: "All winners have already been selected" };
  }

  const pickedIds = new Set(session.winners.map((w) => w.ticketId));
  const eligible = await getEligibleTickets(tenantId, session.eventId);
  const pool = eligible.filter((t) => !pickedIds.has(t.id));

  if (pool.length === 0) return { error: "No eligible tickets remaining" };

  const ticket = await prisma.ticket.findUnique({
    where: { id: pool[randomInt(pool.length)].id },
  });
  if (!ticket) return { error: "Ticket not found" };

  try {
    const winner = await pickWinnerInTransaction(session, ticket, "RANDOM", actorId);
    const updated = await prisma.drawSession.findUnique({
      where: { id: sessionId },
      include: sessionInclude,
    });
    return {
      winner,
      session: updated ? toDrawSessionDto(updated) : undefined,
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to pick winner" };
  }
}

export async function pickManualWinner(
  tenantId: string,
  sessionId: string,
  actorId: string,
  ticketNumber: string
): Promise<{ winner?: DrawWinnerDto; session?: DrawSessionDto; error?: string }> {
  const session = await loadSessionForPick(sessionId, tenantId);
  if (!session) return { error: "Draw session not found or not in progress" };
  if (session.winners.length >= session.winnerCount) {
    return { error: "All winners have already been selected" };
  }

  const ticket = await prisma.ticket.findFirst({
    where: {
      eventId: session.eventId,
      tenantId,
      ticketNumber: ticketNumber.trim(),
      deletedAt: null,
    },
  });
  if (!ticket) return { error: "Ticket not found" };
  if (!["SOLD", "VALIDATED"].includes(ticket.status)) {
    return { error: "Ticket is not eligible for draw" };
  }

  const alreadyWinner = await prisma.drawWinner.findUnique({
    where: { ticketId: ticket.id },
  });
  if (alreadyWinner) return { error: "Ticket has already won" };

  const pickedInSession = session.winners.some((w) => w.ticketId === ticket.id);
  if (pickedInSession) return { error: "Ticket already selected in this session" };

  try {
    const winner = await pickWinnerInTransaction(session, ticket, "MANUAL", actorId);
    const updated = await prisma.drawSession.findUnique({
      where: { id: sessionId },
      include: sessionInclude,
    });
    return {
      winner,
      session: updated ? toDrawSessionDto(updated) : undefined,
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to pick winner" };
  }
}

export async function confirmDrawSession(
  tenantId: string,
  sessionId: string,
  actorId: string
): Promise<{ session?: DrawSessionDto; error?: string }> {
  const session = await prisma.drawSession.findFirst({
    where: { id: sessionId, tenantId, status: "IN_PROGRESS" },
    include: sessionInclude,
  });
  if (!session) return { error: "Draw session not found or not in progress" };
  if (session.winners.length < session.winnerCount) {
    return {
      error: `Select all ${session.winnerCount} winners before confirming (${session.winners.length} selected)`,
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.drawSession.update({
      where: { id: sessionId },
      data: { status: "COMPLETED", completedAt: new Date() },
    });

    await tx.ticket.updateMany({
      where: { id: { in: session.winners.map((w) => w.ticketId) } },
      data: { status: "WINNER" },
    });

    await tx.event.update({
      where: { id: session.eventId },
      data: { status: "COMPLETED", drawCompletedAt: new Date() },
    });
  });

  await createAuditLog({
    tenantId,
    actorId,
    action: "draw.completed",
    entity: "draw_session",
    entityId: sessionId,
    metadata: { eventId: session.eventId, winnerCount: session.winners.length },
  });

  await createAuditLog({
    tenantId,
    actorId,
    action: "event.completed",
    entity: "event",
    entityId: session.eventId,
    metadata: { drawSessionId: sessionId },
  });

  const updated = await prisma.drawSession.findUnique({
    where: { id: sessionId },
    include: sessionInclude,
  });

  return { session: updated ? toDrawSessionDto(updated) : undefined };
}

export async function cancelDrawSession(
  tenantId: string,
  sessionId: string,
  actorId: string
): Promise<{ error?: string }> {
  const session = await prisma.drawSession.findFirst({
    where: { id: sessionId, tenantId, status: "IN_PROGRESS" },
    include: { winners: true },
  });
  if (!session) return { error: "Draw session not found or not in progress" };

  await prisma.$transaction(async (tx) => {
    if (session.winners.length > 0) {
      await tx.drawWinner.deleteMany({ where: { drawSessionId: sessionId } });
    }
    await tx.drawSession.update({
      where: { id: sessionId },
      data: { status: "CANCELLED", completedAt: new Date() },
    });
  });

  await createAuditLog({
    tenantId,
    actorId,
    action: "draw.cancelled",
    entity: "draw_session",
    entityId: sessionId,
    metadata: { eventId: session.eventId },
  });

  return {};
}

export async function listEventWinners(
  tenantId: string,
  eventId: string
): Promise<DrawWinnerDto[]> {
  const winners = await prisma.drawWinner.findMany({
    where: { tenantId, eventId },
    include: { ticket: { select: { ticketNumber: true } } },
    orderBy: { rank: "asc" },
  });

  return winners.map(toDrawWinnerDto);
}

function buildWinnersWhere(
  tenantId: string,
  filters: WinnersHistoryQuery
): Prisma.DrawWinnerWhereInput {
  const q = filters.q?.trim();

  return {
    tenantId,
    ...(filters.eventId ? { eventId: filters.eventId } : {}),
    ...(filters.from || filters.to
      ? {
          selectedAt: {
            ...(filters.from ? { gte: new Date(filters.from) } : {}),
            ...(filters.to ? { lte: new Date(filters.to) } : {}),
          },
        }
      : {}),
    ...(q
      ? {
          OR: [
            { buyerName: { contains: q, mode: "insensitive" } },
            { buyerPhone: { contains: q, mode: "insensitive" } },
            {
              ticket: {
                ticketNumber: { contains: q, mode: "insensitive" },
              },
            },
          ],
        }
      : {}),
  };
}

export async function listTenantWinners(
  tenantId: string,
  filters: WinnersHistoryQuery
): Promise<WinnersHistoryResult> {
  const where = buildWinnersWhere(tenantId, filters);
  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;

  const [winners, total, eventGroups] = await Promise.all([
    prisma.drawWinner.findMany({
      where,
      include: {
        ticket: { select: { ticketNumber: true } },
        event: { select: { name: true, slug: true, currencyCode: true } },
      },
      orderBy: { selectedAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.drawWinner.count({ where }),
    prisma.drawWinner.groupBy({
      by: ["eventId"],
      where,
    }),
  ]);

  const items: TenantWinnerListItem[] = winners.map((w) => ({
    ...toDrawWinnerDto(w),
    eventName: w.event.name,
    eventSlug: w.event.slug,
    currencyCode: w.event.currencyCode,
  }));

  return {
    winners: items,
    total,
    summary: {
      winnerCount: total,
      eventCount: eventGroups.length,
    },
  };
}

export async function listDrawEventFilterOptions(tenantId: string) {
  const events = await prisma.event.findMany({
    where: {
      tenantId,
      deletedAt: null,
      drawWinners: { some: {} },
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return events;
}

export async function countTenantWinners(tenantId: string): Promise<number> {
  return prisma.drawWinner.count({ where: { tenantId } });
}

export async function listPublicEventWinners(eventId: string) {
  const winners = await prisma.drawWinner.findMany({
    where: { eventId },
    include: { ticket: { select: { ticketNumber: true } } },
    orderBy: { rank: "asc" },
  });

  return winners.map((w) => ({
    rank: w.rank,
    ticketNumber: w.ticket.ticketNumber,
    prizeName: w.prizeName,
    buyerFirstName: w.buyerName?.split(/\s+/)[0] ?? null,
    selectedAt: w.selectedAt.toISOString(),
  }));
}
