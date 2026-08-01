import { randomBytes } from "node:crypto";
import type { Customer, CustomerNote, Prisma, Referral } from "@prisma/client";
import { createAuditLog } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import type {
  CustomerDetailDto,
  CustomerDto,
  CustomerListItem,
  CustomerListResult,
  CustomerNoteDto,
  CustomerParticipationDto,
  CustomerPurchaseDto,
  CustomerTimelineEvent,
  ReferralDto,
} from "@/types/customers";
import type {
  CustomerBlacklistInput,
  CustomerFormValues,
  CustomerListQuery,
  CustomerNoteInput,
  ReferralCreateInput,
} from "@/validators/customers";

function normalizePhone(phone: string): string {
  return phone.trim().replace(/\s+/g, "");
}

function generateReferralCode(): string {
  return randomBytes(4).toString("hex").toUpperCase();
}

function toCustomerDto(customer: Customer): CustomerDto {
  return {
    id: customer.id,
    tenantId: customer.tenantId,
    userId: customer.userId,
    displayName: customer.displayName,
    phone: customer.phone,
    email: customer.email,
    loyaltyPoints: customer.loyaltyPoints,
    isBlacklisted: customer.isBlacklisted,
    blacklistReason: customer.blacklistReason,
    referralCode: customer.referralCode,
    referredById: customer.referredById,
    source: customer.source,
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt.toISOString(),
  };
}

async function uniqueReferralCode(tenantId: string): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateReferralCode();
    const existing = await prisma.customer.findFirst({
      where: { tenantId, referralCode: code },
      select: { id: true },
    });
    if (!existing) return code;
  }
  throw new Error("Failed to generate unique referral code");
}

async function getCustomerStats(tenantId: string, customerId: string) {
  const [purchaseAgg, winCount] = await Promise.all([
    prisma.posSale.aggregate({
      where: { tenantId, customerId, status: "COMPLETED" },
      _count: { id: true },
      _sum: { totalCents: true },
    }),
    prisma.drawWinner.count({ where: { tenantId, customerId } }),
  ]);

  return {
    purchaseCount: purchaseAgg._count.id,
    winCount,
    totalSpentCents: purchaseAgg._sum.totalCents ?? 0,
  };
}

export async function listTenantCustomers(
  tenantId: string,
  filters: CustomerListQuery
): Promise<CustomerListResult> {
  const q = filters.q?.trim();
  const where: Prisma.CustomerWhereInput = {
    tenantId,
    deletedAt: null,
    ...(filters.blacklisted !== undefined
      ? { isBlacklisted: filters.blacklisted }
      : {}),
    ...(q
      ? {
          OR: [
            { displayName: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { referralCode: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(filters.hasPurchases === true
      ? { posSales: { some: { status: "COMPLETED" } } }
      : filters.hasPurchases === false
        ? { posSales: { none: { status: "COMPLETED" } } }
        : {}),
  };

  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      take: limit,
      skip: offset,
    }),
    prisma.customer.count({ where }),
  ]);

  const items: CustomerListItem[] = await Promise.all(
    customers.map(async (customer) => {
      const stats = await getCustomerStats(tenantId, customer.id);
      return { ...toCustomerDto(customer), ...stats };
    })
  );

  return { customers: items, total };
}

export async function getTenantCustomerById(
  tenantId: string,
  customerId: string
): Promise<CustomerDetailDto | null> {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, tenantId, deletedAt: null },
    include: {
      referredBy: { select: { displayName: true } },
    },
  });
  if (!customer) return null;

  const stats = await getCustomerStats(tenantId, customerId);
  return {
    ...toCustomerDto(customer),
    ...stats,
    referredByName: customer.referredBy?.displayName ?? null,
  };
}

export async function createTenantCustomer(
  tenantId: string,
  actorId: string,
  input: CustomerFormValues
) {
  const phone = normalizePhone(input.phone);
  const existing = await prisma.customer.findFirst({
    where: { tenantId, phone, deletedAt: null },
  });
  if (existing) {
    return { error: "A customer with this phone already exists" as const };
  }

  const referralCode = await uniqueReferralCode(tenantId);

  const customer = await prisma.customer.create({
    data: {
      tenantId,
      displayName: input.displayName.trim(),
      phone,
      email: input.email?.trim() || null,
      referredById: input.referredById ?? null,
      source: input.source ?? "MANUAL",
      referralCode,
    },
  });

  await createAuditLog({
    tenantId,
    actorId,
    action: "customer.created",
    entity: "customer",
    entityId: customer.id,
    metadata: { phone, source: customer.source },
  });

  return { customer: toCustomerDto(customer) };
}

export async function updateTenantCustomer(
  tenantId: string,
  actorId: string,
  customerId: string,
  input: CustomerFormValues
) {
  const existing = await prisma.customer.findFirst({
    where: { id: customerId, tenantId, deletedAt: null },
  });
  if (!existing) return null;

  const phone = normalizePhone(input.phone);
  if (phone !== existing.phone) {
    const duplicate = await prisma.customer.findFirst({
      where: { tenantId, phone, deletedAt: null, NOT: { id: customerId } },
    });
    if (duplicate) {
      return { error: "A customer with this phone already exists" as const };
    }
  }

  const customer = await prisma.customer.update({
    where: { id: customerId },
    data: {
      displayName: input.displayName.trim(),
      phone,
      email: input.email?.trim() || null,
      referredById: input.referredById ?? null,
    },
  });

  await createAuditLog({
    tenantId,
    actorId,
    action: "customer.updated",
    entity: "customer",
    entityId: customer.id,
  });

  return { customer: toCustomerDto(customer) };
}

export async function softDeleteCustomer(
  tenantId: string,
  actorId: string,
  customerId: string
) {
  const existing = await prisma.customer.findFirst({
    where: { id: customerId, tenantId, deletedAt: null },
  });
  if (!existing) return null;

  await prisma.customer.update({
    where: { id: customerId },
    data: { deletedAt: new Date() },
  });

  await createAuditLog({
    tenantId,
    actorId,
    action: "customer.deleted",
    entity: "customer",
    entityId: customerId,
  });

  return { ok: true as const };
}

export async function findOrCreateCustomerByPhone(
  tenantId: string,
  input: {
    displayName: string;
    phone: string;
    email?: string | null;
    source?: Customer["source"];
    actorId?: string;
  }
): Promise<{ customer: CustomerDto; created: boolean; error?: string }> {
  const phone = normalizePhone(input.phone);
  if (!phone)
    return { customer: {} as CustomerDto, created: false, error: "Phone is required" };

  const existing = await prisma.customer.findFirst({
    where: { tenantId, phone, deletedAt: null },
  });

  if (existing) {
    if (existing.isBlacklisted) {
      return {
        customer: toCustomerDto(existing),
        created: false,
        error: "Customer is blacklisted and cannot make purchases",
      };
    }

    const needsUpdate =
      existing.displayName !== input.displayName.trim() ||
      (input.email?.trim() && existing.email !== input.email.trim());

    if (needsUpdate) {
      const updated = await prisma.customer.update({
        where: { id: existing.id },
        data: {
          displayName: input.displayName.trim(),
          ...(input.email?.trim() ? { email: input.email.trim() } : {}),
        },
      });
      return { customer: toCustomerDto(updated), created: false };
    }

    return { customer: toCustomerDto(existing), created: false };
  }

  const referralCode = await uniqueReferralCode(tenantId);
  const customer = await prisma.customer.create({
    data: {
      tenantId,
      displayName: input.displayName.trim(),
      phone,
      email: input.email?.trim() || null,
      source: input.source ?? "POS",
      referralCode,
    },
  });

  if (input.actorId) {
    await createAuditLog({
      tenantId,
      actorId: input.actorId,
      action: "customer.created",
      entity: "customer",
      entityId: customer.id,
      metadata: { phone, source: customer.source, via: "findOrCreate" },
    });
  }

  return { customer: toCustomerDto(customer), created: true };
}

export async function setCustomerBlacklist(
  tenantId: string,
  actorId: string,
  customerId: string,
  input: CustomerBlacklistInput
) {
  const existing = await prisma.customer.findFirst({
    where: { id: customerId, tenantId, deletedAt: null },
  });
  if (!existing) return null;

  const customer = await prisma.customer.update({
    where: { id: customerId },
    data: {
      isBlacklisted: input.isBlacklisted,
      blacklistReason: input.isBlacklisted ? input.reason?.trim() || null : null,
    },
  });

  await createAuditLog({
    tenantId,
    actorId,
    action: input.isBlacklisted ? "customer.blacklisted" : "customer.unblacklisted",
    entity: "customer",
    entityId: customerId,
    metadata: { reason: input.reason ?? null },
  });

  return { customer: toCustomerDto(customer) };
}

function toCustomerNoteDto(
  note: CustomerNote & { author: { name: string | null } }
): CustomerNoteDto {
  return {
    id: note.id,
    customerId: note.customerId,
    authorId: note.authorId,
    authorName: note.author.name,
    body: note.body,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}

export async function listCustomerNotes(tenantId: string, customerId: string) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, tenantId, deletedAt: null },
    select: { id: true },
  });
  if (!customer) return null;

  const notes = await prisma.customerNote.findMany({
    where: { tenantId, customerId },
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return notes.map(toCustomerNoteDto);
}

export async function addCustomerNote(
  tenantId: string,
  actorId: string,
  customerId: string,
  input: CustomerNoteInput
) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, tenantId, deletedAt: null },
    select: { id: true },
  });
  if (!customer) return null;

  const note = await prisma.customerNote.create({
    data: {
      tenantId,
      customerId,
      authorId: actorId,
      body: input.body.trim(),
    },
    include: { author: { select: { name: true } } },
  });

  await createAuditLog({
    tenantId,
    actorId,
    action: "customer.note.added",
    entity: "customer_note",
    entityId: note.id,
    metadata: { customerId },
  });

  return toCustomerNoteDto(note);
}

function toReferralDto(
  referral: Referral & { referredCustomer?: { displayName: string } | null }
): ReferralDto {
  return {
    id: referral.id,
    referrerCustomerId: referral.referrerCustomerId,
    referredCustomerId: referral.referredCustomerId,
    referredPhone: referral.referredPhone,
    eventId: referral.eventId,
    status: referral.status,
    rewardPoints: referral.rewardPoints,
    createdAt: referral.createdAt.toISOString(),
    referredCustomerName: referral.referredCustomer?.displayName ?? null,
  };
}

export async function listCustomerReferrals(tenantId: string, customerId: string) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, tenantId, deletedAt: null },
    select: { id: true },
  });
  if (!customer) return null;

  const referrals = await prisma.referral.findMany({
    where: {
      tenantId,
      OR: [{ referrerCustomerId: customerId }, { referredCustomerId: customerId }],
    },
    include: { referredCustomer: { select: { displayName: true } } },
    orderBy: { createdAt: "desc" },
  });

  return referrals.map(toReferralDto);
}

export async function createReferral(
  tenantId: string,
  actorId: string,
  referrerCustomerId: string,
  input: ReferralCreateInput
) {
  const referrer = await prisma.customer.findFirst({
    where: { id: referrerCustomerId, tenantId, deletedAt: null },
  });
  if (!referrer) return null;

  const phone = normalizePhone(input.referredPhone);
  const referredCustomer = await prisma.customer.findFirst({
    where: { tenantId, phone, deletedAt: null },
  });

  const referral = await prisma.referral.create({
    data: {
      tenantId,
      referrerCustomerId,
      referredCustomerId: referredCustomer?.id ?? null,
      referredPhone: phone,
      eventId: input.eventId ?? null,
      status: referredCustomer ? "COMPLETED" : "PENDING",
      rewardPoints: input.rewardPoints ?? 0,
    },
    include: { referredCustomer: { select: { displayName: true } } },
  });

  await createAuditLog({
    tenantId,
    actorId,
    action: "referral.created",
    entity: "referral",
    entityId: referral.id,
    metadata: { referrerCustomerId, referredPhone: phone },
  });

  return toReferralDto(referral);
}

export async function getCustomerPurchases(
  tenantId: string,
  customerId: string
): Promise<CustomerPurchaseDto[] | null> {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, tenantId, deletedAt: null },
    select: { id: true },
  });
  if (!customer) return null;

  const sales = await prisma.posSale.findMany({
    where: { tenantId, customerId, status: "COMPLETED" },
    include: {
      event: { select: { name: true } },
      lines: { include: { ticket: { select: { ticketNumber: true } } } },
    },
    orderBy: { completedAt: "desc" },
  });

  return sales.map((sale) => ({
    id: sale.id,
    receiptNumber: sale.receiptNumber,
    eventId: sale.eventId,
    eventName: sale.event.name,
    totalCents: sale.totalCents,
    ticketCount: sale.lines.length,
    ticketNumbers: sale.lines.map((l) => l.ticket.ticketNumber),
    completedAt: sale.completedAt?.toISOString() ?? null,
  }));
}

export async function getCustomerParticipation(
  tenantId: string,
  customerId: string
): Promise<CustomerParticipationDto[] | null> {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, tenantId, deletedAt: null },
    select: { id: true },
  });
  if (!customer) return null;

  const sales = await prisma.posSale.findMany({
    where: { tenantId, customerId, status: "COMPLETED" },
    include: {
      event: { select: { id: true, name: true } },
      lines: { include: { ticket: { select: { ticketNumber: true } } } },
    },
  });

  const wins = await prisma.drawWinner.findMany({
    where: { tenantId, customerId },
    include: {
      event: { select: { id: true, name: true } },
      ticket: { select: { ticketNumber: true } },
    },
    orderBy: { selectedAt: "desc" },
  });

  const byEvent = new Map<string, CustomerParticipationDto>();

  for (const sale of sales) {
    const existing = byEvent.get(sale.eventId) ?? {
      eventId: sale.eventId,
      eventName: sale.event.name,
      ticketCount: 0,
      ticketNumbers: [],
      wins: [],
    };
    existing.ticketCount += sale.lines.length;
    existing.ticketNumbers.push(...sale.lines.map((l) => l.ticket.ticketNumber));
    byEvent.set(sale.eventId, existing);
  }

  for (const win of wins) {
    const existing = byEvent.get(win.eventId) ?? {
      eventId: win.eventId,
      eventName: win.event.name,
      ticketCount: 0,
      ticketNumbers: [],
      wins: [],
    };
    existing.wins.push({
      rank: win.rank,
      prizeName: win.prizeName,
      ticketNumber: win.ticket.ticketNumber,
      selectedAt: win.selectedAt.toISOString(),
    });
    byEvent.set(win.eventId, existing);
  }

  return Array.from(byEvent.values());
}

export async function getCustomerTimeline(
  tenantId: string,
  customerId: string
): Promise<CustomerTimelineEvent[] | null> {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, tenantId, deletedAt: null },
    select: { id: true, updatedAt: true, isBlacklisted: true, blacklistReason: true },
  });
  if (!customer) return null;

  const [sales, wins, notes, referrals, blacklistLogs] = await Promise.all([
    prisma.posSale.findMany({
      where: { tenantId, customerId, status: "COMPLETED" },
      include: {
        event: { select: { name: true } },
        lines: { select: { id: true } },
      },
      orderBy: { completedAt: "desc" },
    }),
    prisma.drawWinner.findMany({
      where: { tenantId, customerId },
      include: {
        event: { select: { name: true } },
        ticket: { select: { ticketNumber: true } },
      },
      orderBy: { selectedAt: "desc" },
    }),
    prisma.customerNote.findMany({
      where: { tenantId, customerId },
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.referral.findMany({
      where: { tenantId, referrerCustomerId: customerId },
      include: { referredCustomer: { select: { displayName: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.auditLog.findMany({
      where: {
        tenantId,
        entity: "customer",
        entityId: customerId,
        action: { in: ["customer.blacklisted", "customer.unblacklisted"] },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const events: CustomerTimelineEvent[] = [];

  for (const sale of sales) {
    if (!sale.completedAt) continue;
    events.push({
      type: "SALE_COMPLETED",
      id: sale.id,
      at: sale.completedAt.toISOString(),
      receiptNumber: sale.receiptNumber,
      eventName: sale.event.name,
      totalCents: sale.totalCents,
      ticketCount: sale.lines.length,
    });
  }

  for (const win of wins) {
    events.push({
      type: "TICKET_WON",
      id: win.id,
      at: win.selectedAt.toISOString(),
      eventName: win.event.name,
      prizeName: win.prizeName,
      ticketNumber: win.ticket.ticketNumber,
      rank: win.rank,
    });
  }

  for (const note of notes) {
    events.push({
      type: "NOTE_ADDED",
      id: note.id,
      at: note.createdAt.toISOString(),
      authorName: note.author.name,
      body: note.body,
    });
  }

  for (const referral of referrals) {
    events.push({
      type: "REFERRAL_CREATED",
      id: referral.id,
      at: referral.createdAt.toISOString(),
      referredPhone: referral.referredPhone,
      referredCustomerName: referral.referredCustomer?.displayName ?? null,
      status: referral.status,
    });
  }

  for (const log of blacklistLogs) {
    events.push({
      type: "BLACKLIST_UPDATED",
      id: log.id,
      at: log.createdAt.toISOString(),
      isBlacklisted: log.action === "customer.blacklisted",
      reason:
        log.action === "customer.blacklisted"
          ? ((log.metadata as { reason?: string } | null)?.reason ?? null)
          : null,
    });
  }

  events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return events;
}

export async function awardLoyaltyPoints(
  tenantId: string,
  customerId: string,
  points: number
) {
  if (points <= 0) return;
  await prisma.customer.updateMany({
    where: { id: customerId, tenantId, deletedAt: null },
    data: { loyaltyPoints: { increment: points } },
  });
}

export async function resolveCustomerIdForTicket(
  tenantId: string,
  ticketId: string
): Promise<string | null> {
  const line = await prisma.posSaleLine.findFirst({
    where: {
      ticketId,
      posSale: { tenantId, status: "COMPLETED" },
    },
    select: { posSale: { select: { customerId: true } } },
    orderBy: { posSale: { completedAt: "desc" } },
  });
  return line?.posSale.customerId ?? null;
}

export async function backfillCustomersFromPosSales(tenantId: string) {
  const sales = await prisma.posSale.findMany({
    where: {
      tenantId,
      status: "COMPLETED",
      customerId: null,
      customerPhone: { not: null },
    },
    select: {
      id: true,
      customerName: true,
      customerPhone: true,
      customerEmail: true,
      lines: { select: { id: true } },
    },
  });

  let linked = 0;
  let created = 0;

  for (const sale of sales) {
    const phone = sale.customerPhone?.trim();
    const name = sale.customerName?.trim();
    if (!phone || !name) continue;

    const result = await findOrCreateCustomerByPhone(tenantId, {
      displayName: name,
      phone,
      email: sale.customerEmail,
      source: "POS",
    });
    if (result.error && !result.customer.id) continue;

    await prisma.posSale.update({
      where: { id: sale.id },
      data: { customerId: result.customer.id },
    });

    if (result.created) created += 1;
    linked += 1;

    const ticketCount = sale.lines.length;
    if (ticketCount > 0) {
      await awardLoyaltyPoints(tenantId, result.customer.id, ticketCount);
    }
  }

  const winners = await prisma.drawWinner.findMany({
    where: { tenantId, customerId: null },
    select: { id: true, ticketId: true },
  });

  let winnersLinked = 0;
  for (const winner of winners) {
    const customerId = await resolveCustomerIdForTicket(tenantId, winner.ticketId);
    if (!customerId) continue;
    await prisma.drawWinner.update({
      where: { id: winner.id },
      data: { customerId },
    });
    winnersLinked += 1;
  }

  return { linked, created, winnersLinked };
}

export async function isCustomerBlacklistedByPhone(
  tenantId: string,
  phone: string
): Promise<boolean> {
  const customer = await prisma.customer.findFirst({
    where: { tenantId, phone: normalizePhone(phone), deletedAt: null },
    select: { isBlacklisted: true },
  });
  return customer?.isBlacklisted ?? false;
}
