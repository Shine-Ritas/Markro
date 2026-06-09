import type { Event, TicketDesignPreset } from "@prisma/client";
import type { EventDto, EventListItem } from "@/types/events";
import { toTicketDesignPresetDto } from "@/lib/ticket-designs";

export type EventWithDesign = Event & {
  ticketDesign?: TicketDesignPreset | null;
};

export function slugifyEventName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function combineDateAndTime(dateStr: string, timeStr?: string | null): Date {
  const date = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const time = timeStr && timeStr.length > 0 ? timeStr : "00:00";
  return new Date(`${date}T${time}:00`);
}

export function toEventDto(event: EventWithDesign): EventDto {
  return {
    id: event.id,
    tenantId: event.tenantId,
    name: event.name,
    slug: event.slug,
    description: event.description,
    bannerUrl: event.bannerUrl,
    rules: event.rules,
    venue: event.venue,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate?.toISOString() ?? null,
    drawScheduledAt: event.drawScheduledAt?.toISOString() ?? null,
    ticketQuantity: event.ticketQuantity,
    winnerCount: event.winnerCount,
    ticketDesignId: event.ticketDesignId,
    ticketListViewDefault: event.ticketListViewDefault,
    currencyCode: event.currencyCode,
    ticketDesign: event.ticketDesign
      ? toTicketDesignPresetDto(event.ticketDesign)
      : null,
    status: event.status,
    publishedAt: event.publishedAt?.toISOString() ?? null,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };
}

export const eventWithDesignInclude = {
  ticketDesign: true,
} as const;

export function toEventListItem(event: Event): EventListItem {
  const dto = toEventDto(event);
  return {
    id: dto.id,
    name: dto.name,
    slug: dto.slug,
    status: dto.status,
    startDate: dto.startDate,
    endDate: dto.endDate,
    ticketQuantity: dto.ticketQuantity,
    winnerCount: dto.winnerCount,
    venue: dto.venue,
    bannerUrl: dto.bannerUrl,
  };
}

export const EVENT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};
