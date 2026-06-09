import type { PosSale, PosSaleLine } from "@prisma/client";
import { createAuditLog } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { resolveCurrentPriceForEvent } from "@/services/ticket.service";
import type {
  PosDailyStats,
  PosEventFilterOption,
  PosEventOption,
  PosSaleDto,
  PosSaleLineDto,
  PosSalesHistoryResult,
} from "@/types/pos";
import type {
  PosSaleDraftInput,
  PosSaleUpdateInput,
  PosSalesHistoryQuery,
} from "@/validators/pos";

const saleInclude = {
  event: { select: { name: true, currencyCode: true } },
  actor: { select: { name: true } },
  lines: {
    include: {
      ticket: { select: { id: true, ticketNumber: true, priceCents: true } },
    },
  },
} as const;

type SaleWithRelations = PosSale & {
  event: { name: string; currencyCode: string | null };
  actor: { name: string | null } | null;
  lines: (PosSaleLine & {
    ticket: { id: string; ticketNumber: string; priceCents: number };
  })[];
};

function toPosSaleLineDto(line: SaleWithRelations["lines"][number]): PosSaleLineDto {
  return {
    id: line.id,
    ticketId: line.ticket.id,
    ticketNumber: line.ticket.ticketNumber,
    priceCents: line.priceCents,
  };
}

function toPosSaleDto(sale: SaleWithRelations): PosSaleDto {
  return {
    id: sale.id,
    tenantId: sale.tenantId,
    eventId: sale.eventId,
    eventName: sale.event.name,
    currencyCode: sale.event.currencyCode,
    status: sale.status,
    customerName: sale.customerName,
    customerPhone: sale.customerPhone,
    customerEmail: sale.customerEmail,
    quantity: sale.quantity,
    totalCents: sale.totalCents,
    receiptNumber: sale.receiptNumber,
    actorId: sale.actorId,
    actorName: sale.actor?.name ?? null,
    completedAt: sale.completedAt?.toISOString() ?? null,
    createdAt: sale.createdAt.toISOString(),
    updatedAt: sale.updatedAt.toISOString(),
    lines: sale.lines.map(toPosSaleLineDto),
  };
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function nextReceiptNumber(tenantId: string) {
  const start = startOfToday();
  const count = await prisma.posSale.count({
    where: {
      tenantId,
      status: "COMPLETED",
      completedAt: { gte: start },
    },
  });
  const date = start.toISOString().slice(0, 10).replace(/-/g, "");
  return `RCP-${date}-${String(count + 1).padStart(4, "0")}`;
}

async function getPublishedEvent(tenantId: string, eventId: string) {
  return prisma.event.findFirst({
    where: {
      id: eventId,
      tenantId,
      deletedAt: null,
      status: "PUBLISHED",
    },
  });
}

async function validateAvailableTickets(
  tenantId: string,
  eventId: string,
  ticketIds: string[]
) {
  const uniqueIds = [...new Set(ticketIds)];
  if (uniqueIds.length !== ticketIds.length) {
    return { error: "Duplicate ticket selection" as const };
  }

  const tickets = await prisma.ticket.findMany({
    where: {
      id: { in: uniqueIds },
      tenantId,
      eventId,
      status: "AVAILABLE",
      deletedAt: null,
    },
    orderBy: { ticketNumber: "asc" },
  });

  if (tickets.length !== uniqueIds.length) {
    const foundIds = new Set(tickets.map((t) => t.id));
    const missing = uniqueIds.filter((id) => !foundIds.has(id));
    const unavailable = await prisma.ticket.findMany({
      where: { id: { in: missing }, tenantId, eventId, deletedAt: null },
      select: { ticketNumber: true, status: true },
    });

    if (unavailable.length > 0) {
      const numbers = unavailable.map((t) => `#${t.ticketNumber}`).join(", ");
      return {
        error:
          `Ticket${unavailable.length === 1 ? "" : "s"} not available: ${numbers}` as const,
      };
    }

    return { error: "One or more tickets are invalid for this event" as const };
  }

  return { tickets };
}

async function syncDraftLines(
  saleId: string,
  tickets: { id: string; priceCents: number }[]
) {
  await prisma.$transaction(async (tx) => {
    await tx.posSaleLine.deleteMany({ where: { posSaleId: saleId } });
    if (tickets.length > 0) {
      await tx.posSaleLine.createMany({
        data: tickets.map((ticket) => ({
          posSaleId: saleId,
          ticketId: ticket.id,
          priceCents: ticket.priceCents,
        })),
      });
    }
  });
}

export async function listPosEvents(tenantId: string): Promise<PosEventOption[]> {
  const events = await prisma.event.findMany({
    where: { tenantId, deletedAt: null, status: "PUBLISHED" },
    orderBy: { startDate: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      venue: true,
      startDate: true,
      currencyCode: true,
    },
  });

  const results = await Promise.all(
    events.map(async (event) => {
      const [availableCount, currentPriceCents] = await Promise.all([
        prisma.ticket.count({
          where: {
            tenantId,
            eventId: event.id,
            status: "AVAILABLE",
            deletedAt: null,
          },
        }),
        resolveCurrentPriceForEvent(tenantId, event.id),
      ]);

      return {
        id: event.id,
        name: event.name,
        slug: event.slug,
        venue: event.venue,
        startDate: event.startDate.toISOString(),
        availableCount,
        currentPriceCents,
        currencyCode: event.currencyCode,
      };
    })
  );

  return results;
}

export async function listPosDrafts(tenantId: string) {
  const sales = await prisma.posSale.findMany({
    where: { tenantId, status: "DRAFT" },
    include: saleInclude,
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  return sales.map(toPosSaleDto);
}

function buildCompletedSalesWhere(
  tenantId: string,
  filters: Pick<PosSalesHistoryQuery, "eventId" | "from" | "to" | "q">
) {
  const q = filters.q?.trim();

  return {
    tenantId,
    status: "COMPLETED" as const,
    ...(filters.eventId ? { eventId: filters.eventId } : {}),
    ...(filters.from || filters.to
      ? {
          completedAt: {
            ...(filters.from ? { gte: new Date(filters.from) } : {}),
            ...(filters.to ? { lte: new Date(filters.to) } : {}),
          },
        }
      : {}),
    ...(q
      ? {
          OR: [
            { receiptNumber: { contains: q, mode: "insensitive" as const } },
            { customerName: { contains: q, mode: "insensitive" as const } },
            { customerPhone: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
}

export async function listTenantPosSales(
  tenantId: string,
  filters: PosSalesHistoryQuery
): Promise<PosSalesHistoryResult> {
  const where = buildCompletedSalesWhere(tenantId, filters);
  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;

  const [sales, total, aggregates] = await Promise.all([
    prisma.posSale.findMany({
      where,
      include: saleInclude,
      orderBy: { completedAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.posSale.count({ where }),
    prisma.posSale.aggregate({
      where,
      _count: { _all: true },
      _sum: { quantity: true, totalCents: true },
    }),
  ]);

  return {
    sales: sales.map(toPosSaleDto),
    total,
    summary: {
      saleCount: aggregates._count._all,
      ticketCount: aggregates._sum.quantity ?? 0,
      revenueCents: aggregates._sum.totalCents ?? 0,
    },
  };
}

export async function listPosEventFilterOptions(
  tenantId: string
): Promise<PosEventFilterOption[]> {
  const events = await prisma.event.findMany({
    where: {
      tenantId,
      deletedAt: null,
      posSales: { some: { status: "COMPLETED" } },
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return events;
}

export async function getPosSaleById(tenantId: string, saleId: string) {
  const sale = await prisma.posSale.findFirst({
    where: { id: saleId, tenantId },
    include: saleInclude,
  });
  return sale ? toPosSaleDto(sale) : null;
}

export async function listPosAvailableTickets(
  tenantId: string,
  eventId: string,
  options?: { search?: string; limit?: number; offset?: number }
) {
  const event = await getPublishedEvent(tenantId, eventId);
  if (!event) return { error: "Event not found or not published" as const };

  const tickets = await prisma.ticket.findMany({
    where: {
      tenantId,
      eventId,
      status: "AVAILABLE",
      deletedAt: null,
      ...(options?.search
        ? { ticketNumber: { contains: options.search, mode: "insensitive" } }
        : {}),
    },
    select: { id: true, ticketNumber: true, priceCents: true },
    orderBy: { ticketNumber: "asc" },
    take: options?.limit ?? 200,
    skip: options?.offset ?? 0,
  });

  return { tickets };
}

export async function createPosDraft(
  tenantId: string,
  actorId: string,
  input: PosSaleDraftInput
) {
  const event = await getPublishedEvent(tenantId, input.eventId);
  if (!event) return { error: "Event not found or not published" as const };

  const ticketResult = await validateAvailableTickets(
    tenantId,
    input.eventId,
    input.ticketIds
  );
  if ("error" in ticketResult) return { error: ticketResult.error };

  const totalCents = ticketResult.tickets.reduce((sum, t) => sum + t.priceCents, 0);

  const sale = await prisma.posSale.create({
    data: {
      tenantId,
      eventId: input.eventId,
      actorId,
      quantity: ticketResult.tickets.length,
      customerName: input.customerName?.trim() || null,
      customerPhone: input.customerPhone?.trim() || null,
      customerEmail: input.customerEmail?.trim() || null,
      totalCents,
    },
    include: saleInclude,
  });

  await syncDraftLines(sale.id, ticketResult.tickets);

  const refreshed = await prisma.posSale.findFirst({
    where: { id: sale.id },
    include: saleInclude,
  });

  return { sale: toPosSaleDto(refreshed!) };
}

export async function updatePosDraft(
  tenantId: string,
  saleId: string,
  input: PosSaleUpdateInput
) {
  const existing = await prisma.posSale.findFirst({
    where: { id: saleId, tenantId, status: "DRAFT" },
    include: { lines: { select: { ticketId: true } } },
  });
  if (!existing) return { error: "Draft not found" as const };

  const eventId = input.eventId ?? existing.eventId;

  if (input.eventId) {
    const event = await getPublishedEvent(tenantId, input.eventId);
    if (!event) return { error: "Event not found or not published" as const };
  }

  const ticketIds = input.ticketIds ?? existing.lines.map((line) => line.ticketId);

  if (input.eventId && !input.ticketIds) {
    return {
      error: "Changing event requires re-selecting ticket numbers" as const,
    };
  }

  const ticketResult = await validateAvailableTickets(tenantId, eventId, ticketIds);
  if ("error" in ticketResult) return { error: ticketResult.error };

  const totalCents = ticketResult.tickets.reduce((sum, t) => sum + t.priceCents, 0);

  await prisma.posSale.update({
    where: { id: saleId },
    data: {
      ...(input.eventId !== undefined ? { eventId: input.eventId } : {}),
      quantity: ticketResult.tickets.length,
      ...(input.customerName !== undefined
        ? { customerName: input.customerName?.trim() || null }
        : {}),
      ...(input.customerPhone !== undefined
        ? { customerPhone: input.customerPhone?.trim() || null }
        : {}),
      ...(input.customerEmail !== undefined
        ? { customerEmail: input.customerEmail?.trim() || null }
        : {}),
      totalCents,
    },
  });

  await syncDraftLines(saleId, ticketResult.tickets);

  const sale = await prisma.posSale.findFirst({
    where: { id: saleId },
    include: saleInclude,
  });

  return { sale: toPosSaleDto(sale!) };
}

export async function cancelPosDraft(tenantId: string, saleId: string) {
  const existing = await prisma.posSale.findFirst({
    where: { id: saleId, tenantId, status: "DRAFT" },
  });
  if (!existing) return { error: "Draft not found" as const };

  await prisma.posSale.update({
    where: { id: saleId },
    data: { status: "CANCELLED" },
  });

  return { ok: true as const };
}

export async function completePosSale(
  tenantId: string,
  saleId: string,
  actorId: string
) {
  const sale = await prisma.posSale.findFirst({
    where: { id: saleId, tenantId, status: "DRAFT" },
    include: {
      event: { select: { name: true } },
      lines: {
        include: {
          ticket: {
            select: { id: true, ticketNumber: true, priceCents: true, status: true },
          },
        },
      },
    },
  });
  if (!sale) return { error: "Draft not found" as const };

  if (!sale.customerName?.trim()) {
    return { error: "Customer name is required" as const };
  }
  if (!sale.customerPhone?.trim()) {
    return { error: "Customer phone is required" as const };
  }

  if (sale.lines.length === 0) {
    return { error: "Select at least one ticket number" as const };
  }

  const unavailable = sale.lines.filter((line) => line.ticket.status !== "AVAILABLE");
  if (unavailable.length > 0) {
    const numbers = unavailable
      .map((line) => `#${line.ticket.ticketNumber}`)
      .join(", ");
    return {
      error:
        `Ticket${unavailable.length === 1 ? "" : "s"} no longer available: ${numbers}` as const,
    };
  }

  const tickets = sale.lines.map((line) => line.ticket);
  const totalCents = tickets.reduce((sum, t) => sum + t.priceCents, 0);
  const receiptNumber = await nextReceiptNumber(tenantId);
  const now = new Date();
  const customerNote = `POS · ${sale.customerName.trim()}`;

  await prisma.$transaction(async (tx) => {
    await tx.posSale.update({
      where: { id: saleId },
      data: {
        status: "COMPLETED",
        totalCents,
        receiptNumber,
        actorId,
        completedAt: now,
      },
    });

    await tx.ticket.updateMany({
      where: { id: { in: tickets.map((t) => t.id) } },
      data: { status: "SOLD", soldAt: now },
    });

    await tx.ticketTransaction.createMany({
      data: tickets.map((ticket) => ({
        tenantId,
        ticketId: ticket.id,
        type: "SALE" as const,
        amountCents: ticket.priceCents,
        actorId,
        note: customerNote,
      })),
    });
  });

  await createAuditLog({
    tenantId,
    actorId,
    action: "pos.sale.completed",
    entity: "pos_sale",
    entityId: saleId,
    metadata: {
      eventId: sale.eventId,
      quantity: sale.quantity,
      totalCents,
      receiptNumber,
    },
  });

  const completed = await getPosSaleById(tenantId, saleId);
  return { sale: completed! };
}

export async function getPosDailyStats(tenantId: string): Promise<PosDailyStats> {
  const start = startOfToday();

  const sales = await prisma.posSale.findMany({
    where: {
      tenantId,
      status: "COMPLETED",
      completedAt: { gte: start },
    },
    include: {
      event: { select: { name: true } },
      actor: { select: { name: true } },
    },
    orderBy: { completedAt: "desc" },
    take: 10,
  });

  const ticketCount = sales.reduce((sum, s) => sum + s.quantity, 0);
  const revenueCents = sales.reduce((sum, s) => sum + s.totalCents, 0);

  return {
    saleCount: sales.length,
    ticketCount,
    revenueCents,
    recentSales: sales.map((s) => ({
      id: s.id,
      receiptNumber: s.receiptNumber,
      eventName: s.event.name,
      quantity: s.quantity,
      totalCents: s.totalCents,
      customerName: s.customerName,
      completedAt: s.completedAt!.toISOString(),
      actorName: s.actor?.name ?? null,
    })),
  };
}
