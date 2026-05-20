import type { EventStatus, Prisma, TicketListView } from "@prisma/client";
import {
  combineDateAndTime,
  eventWithDesignInclude,
  slugifyEventName,
  toEventDto,
  toEventListItem,
} from "@/lib/events";
import { createAuditLog } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { getDefaultTicketDesignId } from "@/services/ticket-design.service";
import type { EventFormValues } from "@/validators/events";

export type EventInput = EventFormValues;

async function uniqueEventSlug(tenantId: string, base: string, excludeId?: string) {
  const slug = slugifyEventName(base) || "event";
  let suffix = 0;

  while (true) {
    const candidate = suffix === 0 ? slug : `${slug}-${suffix}`;
    const existing = await prisma.event.findFirst({
      where: {
        tenantId,
        slug: candidate,
        deletedAt: null,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (!existing) return candidate;
    suffix += 1;
  }
}

function mapFormToData(input: EventInput) {
  const startDate = combineDateAndTime(input.startDate, input.startTime);
  const endDate =
    input.endDate && input.endDate.length > 0
      ? combineDateAndTime(input.endDate, input.endTime)
      : null;
  const drawScheduledAt =
    input.drawScheduledAt && input.drawScheduledAt.length > 0
      ? combineDateAndTime(input.drawScheduledAt, input.drawScheduledTime)
      : null;

  return {
    name: input.name.trim(),
    description: input.description?.trim() || null,
    bannerUrl: input.bannerUrl?.trim() || null,
    rules: input.rules?.trim() || null,
    venue: input.venue?.trim() || null,
    startDate,
    endDate,
    drawScheduledAt,
    ticketQuantity: input.ticketQuantity,
    winnerCount: input.winnerCount,
    ticketDesignId: input.ticketDesignId ?? undefined,
    ticketListViewDefault: (input.ticketListViewDefault ?? "GRID") as TicketListView,
    status: input.status,
  };
}

export async function listTenantEvents(
  tenantId: string,
  options?: { status?: EventStatus; search?: string }
) {
  const where: Prisma.EventWhereInput = {
    tenantId,
    deletedAt: null,
    ...(options?.status ? { status: options.status } : {}),
    ...(options?.search
      ? {
          OR: [
            { name: { contains: options.search, mode: "insensitive" } },
            { venue: { contains: options.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const events = await prisma.event.findMany({
    where,
    orderBy: { startDate: "asc" },
  });

  return events.map(toEventListItem);
}

export async function getTenantEventById(tenantId: string, eventId: string) {
  const event = await prisma.event.findFirst({
    where: { id: eventId, tenantId, deletedAt: null },
    include: eventWithDesignInclude,
  });
  return event ? toEventDto(event) : null;
}

export async function getTenantEventBySlug(tenantId: string, slug: string) {
  const event = await prisma.event.findFirst({
    where: { tenantId, slug, deletedAt: null, status: "PUBLISHED" },
    include: { tenant: { select: { name: true, slug: true } } },
  });
  if (!event) return null;
  return {
    ...toEventDto(event),
    tenantName: event.tenant.name,
    tenantSlug: event.tenant.slug,
  };
}

export async function createTenantEvent(
  tenantId: string,
  actorId: string,
  input: EventInput
) {
  const data = mapFormToData(input);
  const slug = await uniqueEventSlug(tenantId, data.name);

  const status = data.status ?? "DRAFT";
  const ticketDesignId = data.ticketDesignId ?? (await getDefaultTicketDesignId());

  const event = await prisma.event.create({
    data: {
      tenantId,
      slug,
      ...data,
      ticketDesignId,
      status,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
    },
    include: eventWithDesignInclude,
  });

  await createAuditLog({
    tenantId,
    actorId,
    action: "event.created",
    entity: "event",
    entityId: event.id,
    metadata: { name: event.name, status: event.status },
  });

  return toEventDto(event);
}

export async function updateTenantEvent(
  tenantId: string,
  actorId: string,
  eventId: string,
  input: EventInput
) {
  const existing = await prisma.event.findFirst({
    where: { id: eventId, tenantId, deletedAt: null },
  });
  if (!existing) return null;

  const data = mapFormToData(input);
  const slug =
    slugifyEventName(data.name) !== existing.slug
      ? await uniqueEventSlug(tenantId, data.name, eventId)
      : existing.slug;

  const event = await prisma.event.update({
    where: { id: eventId },
    data: {
      ...data,
      slug,
      ticketDesignId: data.ticketDesignId ?? null,
      publishedAt:
        data.status === "PUBLISHED" && !existing.publishedAt
          ? new Date()
          : data.status !== "PUBLISHED"
            ? null
            : existing.publishedAt,
    },
    include: eventWithDesignInclude,
  });

  await createAuditLog({
    tenantId,
    actorId,
    action: "event.updated",
    entity: "event",
    entityId: event.id,
  });

  return toEventDto(event);
}

export async function publishTenantEvent(
  tenantId: string,
  actorId: string,
  eventId: string
) {
  const existing = await prisma.event.findFirst({
    where: { id: eventId, tenantId, deletedAt: null },
  });
  if (!existing) return null;

  const event = await prisma.event.update({
    where: { id: eventId },
    data: {
      status: "PUBLISHED",
      publishedAt: existing.publishedAt ?? new Date(),
    },
    include: eventWithDesignInclude,
  });

  await createAuditLog({
    tenantId,
    actorId,
    action: "event.published",
    entity: "event",
    entityId: event.id,
  });

  return toEventDto(event);
}

export async function archiveTenantEvent(
  tenantId: string,
  actorId: string,
  eventId: string
) {
  const existing = await prisma.event.findFirst({
    where: { id: eventId, tenantId, deletedAt: null },
  });
  if (!existing) return null;

  const event = await prisma.event.update({
    where: { id: eventId },
    data: { status: "ARCHIVED" },
    include: eventWithDesignInclude,
  });

  await createAuditLog({
    tenantId,
    actorId,
    action: "event.archived",
    entity: "event",
    entityId: event.id,
  });

  return toEventDto(event);
}

export async function deleteTenantEvent(
  tenantId: string,
  actorId: string,
  eventId: string
) {
  const existing = await prisma.event.findFirst({
    where: { id: eventId, tenantId, deletedAt: null },
  });
  if (!existing) return null;

  const event = await prisma.event.update({
    where: { id: eventId },
    data: { deletedAt: new Date() },
    include: eventWithDesignInclude,
  });

  await createAuditLog({
    tenantId,
    actorId,
    action: "event.deleted",
    entity: "event",
    entityId: event.id,
  });

  return toEventDto(event);
}

export async function listPublishedEventsForOrg(tenantSlug: string) {
  const tenant = await prisma.tenant.findFirst({
    where: { slug: tenantSlug, deletedAt: null, status: "ACTIVE" },
  });
  if (!tenant) return null;

  const events = await prisma.event.findMany({
    where: { tenantId: tenant.id, status: "PUBLISHED", deletedAt: null },
    orderBy: { startDate: "asc" },
  });

  return {
    tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
    events: events.map(toEventListItem),
  };
}
