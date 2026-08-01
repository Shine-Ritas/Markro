import type { EventPrize, Prize } from "@prisma/client";
import { createAuditLog } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import type { DrawReadyEventItem, EventPrizeDto, PrizeDto } from "@/types/prizes";
import type { EventPrizesInput, PrizeFormValues } from "@/validators/prizes";

function toPrizeDto(prize: Prize): PrizeDto {
  return {
    id: prize.id,
    tenantId: prize.tenantId,
    name: prize.name,
    description: prize.description,
    imageUrl: prize.imageUrl,
    valueCents: prize.valueCents,
    sortOrder: prize.sortOrder,
    isActive: prize.isActive,
    createdAt: prize.createdAt.toISOString(),
    updatedAt: prize.updatedAt.toISOString(),
  };
}

type EventPrizeWithPrize = EventPrize & { prize: Prize };

function toEventPrizeDto(row: EventPrizeWithPrize): EventPrizeDto {
  return {
    id: row.id,
    eventId: row.eventId,
    prizeId: row.prizeId,
    rank: row.rank,
    prize: toPrizeDto(row.prize),
  };
}

export async function listTenantPrizes(
  tenantId: string,
  options?: { activeOnly?: boolean }
) {
  const prizes = await prisma.prize.findMany({
    where: {
      tenantId,
      deletedAt: null,
      ...(options?.activeOnly ? { isActive: true } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return prizes.map(toPrizeDto);
}

export async function getTenantPrizeById(tenantId: string, prizeId: string) {
  const prize = await prisma.prize.findFirst({
    where: { id: prizeId, tenantId, deletedAt: null },
  });
  return prize ? toPrizeDto(prize) : null;
}

export async function createTenantPrize(
  tenantId: string,
  actorId: string,
  input: PrizeFormValues
) {
  const prize = await prisma.prize.create({
    data: {
      tenantId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      imageUrl: input.imageUrl?.trim() || null,
      valueCents: input.valueCents ?? null,
      sortOrder: input.sortOrder ?? 0,
      isActive: input.isActive ?? true,
    },
  });

  await createAuditLog({
    tenantId,
    actorId,
    action: "prize.created",
    entity: "prize",
    entityId: prize.id,
    metadata: { name: prize.name },
  });

  return toPrizeDto(prize);
}

export async function updateTenantPrize(
  tenantId: string,
  actorId: string,
  prizeId: string,
  input: PrizeFormValues
) {
  const existing = await prisma.prize.findFirst({
    where: { id: prizeId, tenantId, deletedAt: null },
  });
  if (!existing) return null;

  const prize = await prisma.prize.update({
    where: { id: prizeId },
    data: {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      imageUrl: input.imageUrl?.trim() || null,
      valueCents: input.valueCents ?? null,
      sortOrder: input.sortOrder ?? existing.sortOrder,
      isActive: input.isActive ?? existing.isActive,
    },
  });

  await createAuditLog({
    tenantId,
    actorId,
    action: "prize.updated",
    entity: "prize",
    entityId: prize.id,
  });

  return toPrizeDto(prize);
}

export async function deleteTenantPrize(
  tenantId: string,
  actorId: string,
  prizeId: string
) {
  const existing = await prisma.prize.findFirst({
    where: { id: prizeId, tenantId, deletedAt: null },
  });
  if (!existing) return null;

  const prize = await prisma.prize.update({
    where: { id: prizeId },
    data: { deletedAt: new Date() },
  });

  await createAuditLog({
    tenantId,
    actorId,
    action: "prize.deleted",
    entity: "prize",
    entityId: prize.id,
  });

  return toPrizeDto(prize);
}

export async function listEventPrizes(tenantId: string, eventId: string) {
  const rows = await prisma.eventPrize.findMany({
    where: { tenantId, eventId },
    include: { prize: true },
    orderBy: { rank: "asc" },
  });

  return rows.map(toEventPrizeDto);
}

export async function setEventPrizes(
  tenantId: string,
  actorId: string,
  eventId: string,
  input: EventPrizesInput
): Promise<{ prizes?: EventPrizeDto[]; error?: string }> {
  const event = await prisma.event.findFirst({
    where: { id: eventId, tenantId, deletedAt: null },
  });
  if (!event) return { error: "Event not found" };
  if (event.status === "COMPLETED") {
    return { error: "Completed events cannot change prize assignments" };
  }

  const { assignments } = input;
  const ranks = assignments.map((a) => a.rank);
  const uniqueRanks = new Set(ranks);
  if (uniqueRanks.size !== ranks.length) {
    return { error: "Each rank must be unique" };
  }
  if (assignments.length !== event.winnerCount) {
    return {
      error: `Assign exactly ${event.winnerCount} prizes (one per winner rank)`,
    };
  }
  for (const rank of ranks) {
    if (rank < 1 || rank > event.winnerCount) {
      return { error: `Rank must be between 1 and ${event.winnerCount}` };
    }
  }

  const prizeIds = assignments.map((a) => a.prizeId);
  const uniquePrizeIds = new Set(prizeIds);
  if (uniquePrizeIds.size !== prizeIds.length) {
    return { error: "Each prize can only be assigned once per event" };
  }

  const prizes = await prisma.prize.findMany({
    where: {
      id: { in: prizeIds },
      tenantId,
      deletedAt: null,
      isActive: true,
    },
  });
  if (prizes.length !== prizeIds.length) {
    return { error: "One or more prizes are invalid or inactive" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.eventPrize.deleteMany({ where: { eventId } });
    await tx.eventPrize.createMany({
      data: assignments.map((a) => ({
        tenantId,
        eventId,
        prizeId: a.prizeId,
        rank: a.rank,
      })),
    });
  });

  await createAuditLog({
    tenantId,
    actorId,
    action: "event.prizes_updated",
    entity: "event",
    entityId: eventId,
    metadata: { assignmentCount: assignments.length },
  });

  const updated = await listEventPrizes(tenantId, eventId);
  return { prizes: updated };
}

export async function validateEventPrizesForDraw(
  tenantId: string,
  eventId: string
): Promise<{ ok: boolean; error?: string }> {
  const event = await prisma.event.findFirst({
    where: { id: eventId, tenantId, deletedAt: null },
  });
  if (!event) return { ok: false, error: "Event not found" };

  const count = await prisma.eventPrize.count({ where: { eventId } });
  if (count !== event.winnerCount) {
    return {
      ok: false,
      error: `Assign all ${event.winnerCount} prizes before starting the draw (${count} assigned)`,
    };
  }

  const ranks = await prisma.eventPrize.findMany({
    where: { eventId },
    select: { rank: true },
    orderBy: { rank: "asc" },
  });
  const expected = Array.from({ length: event.winnerCount }, (_, i) => i + 1);
  const actual = ranks.map((r) => r.rank);
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    return {
      ok: false,
      error: "Prize ranks must be consecutive from 1 to winner count",
    };
  }

  return { ok: true };
}

export async function getEventPrizeForRank(eventId: string, rank: number) {
  return prisma.eventPrize.findFirst({
    where: { eventId, rank },
    include: { prize: true },
  });
}

export async function listDrawReadyEvents(
  tenantId: string
): Promise<DrawReadyEventItem[]> {
  const events = await prisma.event.findMany({
    where: { tenantId, deletedAt: null, status: "PUBLISHED" },
    orderBy: [{ drawScheduledAt: "asc" }, { startDate: "asc" }],
    include: {
      eventPrizes: { select: { id: true } },
      drawSessions: {
        where: { status: { in: ["PENDING", "IN_PROGRESS"] } },
        select: { id: true },
        take: 1,
      },
    },
  });

  const items: DrawReadyEventItem[] = [];

  for (const event of events) {
    const eligibleTicketCount = await prisma.ticket.count({
      where: {
        tenantId,
        eventId: event.id,
        deletedAt: null,
        status: { in: ["SOLD", "VALIDATED"] },
        drawWinner: null,
      },
    });
    const activeSession = event.drawSessions[0] ?? null;

    items.push({
      id: event.id,
      name: event.name,
      slug: event.slug,
      winnerCount: event.winnerCount,
      drawOrder: event.drawOrder,
      prizesAssigned: event.eventPrizes.length,
      eligibleTicketCount,
      drawScheduledAt: event.drawScheduledAt?.toISOString() ?? null,
      hasActiveSession: Boolean(activeSession),
      activeSessionId: activeSession?.id ?? null,
    });
  }

  return items;
}

export function buildEventPrizeSlots(
  winnerCount: number,
  catalog: PrizeDto[],
  assigned: EventPrizeDto[]
) {
  const byRank = new Map(assigned.map((a) => [a.rank, a]));
  return Array.from({ length: winnerCount }, (_, i) => {
    const rank = i + 1;
    const existing = byRank.get(rank);
    return {
      rank,
      prizeId: existing?.prizeId ?? "",
      assigned: existing ?? null,
      catalog,
    };
  });
}
