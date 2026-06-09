import type { Ticket, TicketPricePeriod, TicketType } from "@prisma/client";
import type { TicketDto, TicketPricePeriodDto, TicketTypeDto } from "@/types/tickets";
import { randomBytes } from "crypto";

export function formatMoney(cents: number, currencyCode?: string | null) {
  if (!currencyCode) {
    return (cents / 100).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currencyCode,
  }).format(cents / 100);
}

export function generateQrToken() {
  return randomBytes(16).toString("hex");
}

export function toTicketDto(
  ticket: Ticket & { ticketType?: TicketType | null }
): TicketDto {
  return {
    id: ticket.id,
    tenantId: ticket.tenantId,
    eventId: ticket.eventId,
    ticketTypeId: ticket.ticketTypeId,
    ticketTypeName: ticket.ticketType?.name ?? null,
    ticketNumber: ticket.ticketNumber,
    priceCents: ticket.priceCents,
    status: ticket.status,
    qrToken: ticket.qrToken,
    soldAt: ticket.soldAt?.toISOString() ?? null,
    validatedAt: ticket.validatedAt?.toISOString() ?? null,
    lastScannedAt: ticket.lastScannedAt?.toISOString() ?? null,
    scanCount: ticket.scanCount,
    createdAt: ticket.createdAt.toISOString(),
  };
}

export function toTicketPricePeriodDto(
  period: TicketPricePeriod
): TicketPricePeriodDto {
  return {
    id: period.id,
    eventId: period.eventId,
    ticketTypeId: period.ticketTypeId,
    label: period.label,
    priceCents: period.priceCents,
    startsAt: period.startsAt.toISOString(),
    endsAt: period.endsAt?.toISOString() ?? null,
  };
}

export function toTicketTypeDto(type: TicketType): TicketTypeDto {
  return {
    id: type.id,
    eventId: type.eventId,
    name: type.name,
    slug: type.slug,
    description: type.description,
  };
}

export function getQrPayload(qrToken: string) {
  return `luckdraw:ticket:${qrToken}`;
}
