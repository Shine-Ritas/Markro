import { randomInt } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { resolveCurrentPriceForEvent } from "@/services/ticket.service";
import type {
  BuyerProfileDto,
  BuyerPurchaseDto,
  BuyerTicketDto,
  BuyerWinDto,
  ExploreEventDto,
  ExploreEventsResult,
} from "@/types/buyer";

function normalizePhone(phone: string): string {
  return phone.trim().replace(/\s+/g, "");
}

export async function getBuyerProfile(userId: string): Promise<BuyerProfileDto | null> {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      email: true,
      name: true,
      globalUserCode: true,
      phone: true,
      phoneVerifiedAt: true,
      customerProfiles: {
        where: { deletedAt: null },
        select: { id: true, tenantId: true },
      },
      staff: {
        where: { deletedAt: null, status: "ACTIVE" },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!user?.globalUserCode) return null;

  const tenantIds = new Set(user.customerProfiles.map((c) => c.tenantId));

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    globalUserCode: user.globalUserCode,
    phone: user.phone,
    phoneVerified: Boolean(user.phoneVerifiedAt),
    linkedOrganizerCount: tenantIds.size,
    linkedCustomerIds: user.customerProfiles.map((c) => c.id),
    hasStaffAccess: user.staff.length > 0,
  };
}

export async function claimCustomersByEmail(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!user) return 0;

  const orphans = await prisma.customer.findMany({
    where: {
      deletedAt: null,
      userId: null,
      email: { equals: user.email, mode: "insensitive" },
    },
    select: { id: true, tenantId: true },
  });

  let linked = 0;
  for (const customer of orphans) {
    const conflict = await prisma.customer.findFirst({
      where: { tenantId: customer.tenantId, userId, deletedAt: null },
    });
    if (conflict) continue;

    await prisma.customer.update({
      where: { id: customer.id },
      data: { userId },
    });
    linked++;
  }
  return linked;
}

export async function claimCustomersByPhone(
  userId: string,
  phone: string
): Promise<number> {
  const normalized = normalizePhone(phone);
  const orphans = await prisma.customer.findMany({
    where: {
      deletedAt: null,
      userId: null,
      phone: normalized,
    },
    select: { id: true, tenantId: true },
  });

  let linked = 0;
  for (const customer of orphans) {
    const conflict = await prisma.customer.findFirst({
      where: { tenantId: customer.tenantId, userId, deletedAt: null },
    });
    if (conflict) continue;

    await prisma.customer.update({
      where: { id: customer.id },
      data: { userId },
    });
    linked++;
  }
  return linked;
}

export async function autoLinkCustomerOnPos(
  tenantId: string,
  customerId: string,
  phone: string
): Promise<void> {
  const normalized = normalizePhone(phone);
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, tenantId, deletedAt: null },
    select: { userId: true },
  });
  if (!customer || customer.userId) return;

  const user = await prisma.user.findFirst({
    where: {
      phone: normalized,
      phoneVerifiedAt: { not: null },
      deletedAt: null,
    },
    select: { id: true },
  });
  if (!user) return;

  const conflict = await prisma.customer.findFirst({
    where: { tenantId, userId: user.id, deletedAt: null, NOT: { id: customerId } },
  });
  if (conflict) return;

  await prisma.customer.update({
    where: { id: customerId },
    data: { userId: user.id },
  });
}

export async function listBuyerTickets(
  userId: string,
  tenantId?: string
): Promise<BuyerTicketDto[]> {
  const customers = await prisma.customer.findMany({
    where: {
      userId,
      deletedAt: null,
      ...(tenantId ? { tenantId } : {}),
    },
    select: { id: true, tenantId: true },
  });
  if (customers.length === 0) return [];

  const customerIds = customers.map((c) => c.id);
  const tenantIds = [...new Set(customers.map((c) => c.tenantId))];

  const tenants = await prisma.tenant.findMany({
    where: { id: { in: tenantIds } },
    select: { id: true, name: true },
  });
  const tenantMap = new Map(tenants.map((t) => [t.id, t.name]));

  const lines = await prisma.posSaleLine.findMany({
    where: {
      posSale: {
        status: "COMPLETED",
        customerId: { in: customerIds },
      },
    },
    include: {
      ticket: {
        select: {
          id: true,
          ticketNumber: true,
          status: true,
          eventId: true,
          soldAt: true,
          priceCents: true,
          event: { select: { name: true } },
        },
      },
      posSale: { select: { tenantId: true } },
    },
    orderBy: { ticket: { soldAt: "desc" } },
  });

  return lines.map((line) => ({
    id: line.ticket.id,
    ticketNumber: line.ticket.ticketNumber,
    status: line.ticket.status,
    eventId: line.ticket.eventId,
    eventName: line.ticket.event.name,
    tenantId: line.posSale.tenantId,
    tenantName: tenantMap.get(line.posSale.tenantId) ?? "Organizer",
    soldAt: line.ticket.soldAt?.toISOString() ?? null,
    priceCents: line.ticket.priceCents,
  }));
}

export async function listBuyerPurchases(
  userId: string,
  tenantId?: string
): Promise<BuyerPurchaseDto[]> {
  const customers = await prisma.customer.findMany({
    where: {
      userId,
      deletedAt: null,
      ...(tenantId ? { tenantId } : {}),
    },
    select: { id: true },
  });
  if (customers.length === 0) return [];

  const customerIds = customers.map((c) => c.id);

  const sales = await prisma.posSale.findMany({
    where: {
      status: "COMPLETED",
      customerId: { in: customerIds },
    },
    include: {
      event: { select: { id: true, name: true } },
      lines: {
        include: { ticket: { select: { ticketNumber: true } } },
      },
    },
    orderBy: { completedAt: "desc" },
  });

  const tenantIds = [...new Set(sales.map((s) => s.tenantId))];
  const tenants = await prisma.tenant.findMany({
    where: { id: { in: tenantIds } },
    select: { id: true, name: true },
  });
  const tenantMap = new Map(tenants.map((t) => [t.id, t.name]));

  return sales.map((sale) => ({
    id: sale.id,
    receiptNumber: sale.receiptNumber,
    tenantId: sale.tenantId,
    tenantName: tenantMap.get(sale.tenantId) ?? "Organizer",
    eventId: sale.event.id,
    eventName: sale.event.name,
    totalCents: sale.totalCents,
    ticketCount: sale.lines.length,
    ticketNumbers: sale.lines.map((l) => l.ticket.ticketNumber),
    completedAt: sale.completedAt?.toISOString() ?? null,
  }));
}

export async function listBuyerWins(
  userId: string,
  tenantId?: string,
  limit?: number
): Promise<BuyerWinDto[]> {
  const winners = await prisma.drawWinner.findMany({
    where: {
      customer: { userId, deletedAt: null },
      ...(tenantId ? { tenantId } : {}),
    },
    include: {
      event: { select: { id: true, name: true } },
      ticket: { select: { ticketNumber: true } },
    },
    orderBy: { selectedAt: "desc" },
    ...(limit ? { take: limit } : {}),
  });

  const tenantIds = [...new Set(winners.map((w) => w.tenantId))];
  const tenants = await prisma.tenant.findMany({
    where: { id: { in: tenantIds } },
    select: { id: true, name: true },
  });
  const tenantMap = new Map(tenants.map((t) => [t.id, t.name]));

  return winners.map((w) => ({
    id: w.id,
    tenantId: w.tenantId,
    tenantName: tenantMap.get(w.tenantId) ?? "Organizer",
    eventId: w.eventId,
    eventName: w.event.name,
    prizeName: w.prizeName,
    ticketNumber: w.ticket.ticketNumber,
    rank: w.rank,
    selectedAt: w.selectedAt.toISOString(),
  }));
}

function generateVerificationCode(): string {
  return String(randomInt(100000, 999999));
}

export async function requestPhoneVerification(userId: string, phone: string) {
  const normalized = normalizePhone(phone);
  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.phoneVerification.deleteMany({ where: { userId, phone: normalized } });
  await prisma.phoneVerification.create({
    data: { userId, phone: normalized, code, expiresAt },
  });

  return {
    code: process.env.NODE_ENV === "development" ? code : undefined,
    expiresAt: expiresAt.toISOString(),
  };
}

export async function confirmPhoneVerification(
  userId: string,
  phone: string,
  code: string
) {
  const normalized = normalizePhone(phone);
  const record = await prisma.phoneVerification.findFirst({
    where: { userId, phone: normalized, code },
    orderBy: { createdAt: "desc" },
  });

  if (!record || record.expiresAt < new Date()) {
    return { error: "Invalid or expired verification code" as const };
  }

  const phoneOwner = await prisma.user.findFirst({
    where: {
      phone: normalized,
      phoneVerifiedAt: { not: null },
      deletedAt: null,
      NOT: { id: userId },
    },
  });
  if (phoneOwner) {
    return { error: "This phone number is already linked to another account" as const };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { phone: normalized, phoneVerifiedAt: new Date() },
  });

  await prisma.phoneVerification.deleteMany({ where: { userId, phone: normalized } });

  const linkedCount = await claimCustomersByPhone(userId, normalized);

  return { linkedCount };
}

const publishedEventWhere = {
  status: "PUBLISHED" as const,
  deletedAt: null,
  OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
  tenant: { deletedAt: null, status: "ACTIVE" as const },
};

async function enrichEventsWithStats(
  events: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    bannerUrl: string | null;
    endDate: Date | null;
    currencyCode: string | null;
    tenantId: string;
    tenant: { name: string; slug: string };
  }>
): Promise<ExploreEventDto[]> {
  if (events.length === 0) return [];

  const eventIds = events.map((e) => e.id);

  const [prizeCounts, availableCounts, avgPrices] = await Promise.all([
    prisma.eventPrize.groupBy({
      by: ["eventId"],
      where: { eventId: { in: eventIds } },
      _count: { id: true },
    }),
    prisma.ticket.groupBy({
      by: ["eventId"],
      where: { eventId: { in: eventIds }, status: "AVAILABLE", deletedAt: null },
      _count: { id: true },
    }),
    prisma.ticket.groupBy({
      by: ["eventId"],
      where: {
        eventId: { in: eventIds },
        status: { not: "CANCELLED" },
        deletedAt: null,
      },
      _avg: { priceCents: true },
    }),
  ]);

  const prizeMap = new Map(prizeCounts.map((p) => [p.eventId, p._count.id]));
  const availableMap = new Map(availableCounts.map((a) => [a.eventId, a._count.id]));
  const avgMap = new Map(
    avgPrices.map((a) => [a.eventId, Math.round(a._avg.priceCents ?? 0)])
  );

  const currentPrices = await Promise.all(
    events.map((event) => resolveCurrentPriceForEvent(event.tenantId, event.id))
  );

  return events.map((event, index) => ({
    id: event.id,
    name: event.name,
    slug: event.slug,
    description: event.description,
    bannerUrl: event.bannerUrl,
    endDate: event.endDate?.toISOString() ?? null,
    tenantId: event.tenantId,
    tenantName: event.tenant.name,
    tenantSlug: event.tenant.slug,
    prizeCount: prizeMap.get(event.id) ?? 0,
    availableTicketCount: availableMap.get(event.id) ?? 0,
    avgTicketPriceCents: avgMap.get(event.id) ?? 0,
    currentPriceCents: currentPrices[index] ?? 0,
    currencyCode: event.currencyCode,
  }));
}

export async function listFeaturedPublishedEvents(
  limit = 3
): Promise<ExploreEventDto[]> {
  const events = await prisma.event.findMany({
    where: publishedEventWhere,
    orderBy: { publishedAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      bannerUrl: true,
      endDate: true,
      currencyCode: true,
      tenantId: true,
      tenant: { select: { name: true, slug: true } },
    },
  });

  return enrichEventsWithStats(events);
}

export async function listExplorePublishedEvents(opts: {
  limit?: number;
  offset?: number;
}): Promise<ExploreEventsResult> {
  const limit = opts.limit ?? 20;
  const offset = opts.offset ?? 0;

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where: publishedEventWhere,
      orderBy: { publishedAt: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        bannerUrl: true,
        endDate: true,
        currencyCode: true,
        tenantId: true,
        tenant: { select: { name: true, slug: true } },
      },
    }),
    prisma.event.count({ where: publishedEventWhere }),
  ]);

  const enriched = await enrichEventsWithStats(events);
  return { events: enriched, total };
}
