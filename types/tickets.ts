import type { TicketStatus, TicketTransactionType } from "@prisma/client";

export type TicketDto = {
  id: string;
  tenantId: string;
  eventId: string;
  ticketTypeId: string | null;
  ticketTypeName: string | null;
  ticketNumber: string;
  priceCents: number;
  currencyCode?: string | null;
  status: TicketStatus;
  qrToken: string;
  soldAt: string | null;
  validatedAt: string | null;
  lastScannedAt: string | null;
  scanCount: number;
  createdAt: string;
};

export type TicketPricePeriodDto = {
  id: string;
  eventId: string;
  ticketTypeId: string | null;
  label: string | null;
  priceCents: number;
  startsAt: string;
  endsAt: string | null;
};

export type TicketTypeDto = {
  id: string;
  eventId: string;
  name: string;
  slug: string;
  description: string | null;
};

export type TicketValidationResult = {
  valid: boolean;
  duplicate?: boolean;
  ticket?: TicketDto;
  message: string;
};

export type TenantTicketListItem = TicketDto & {
  eventName: string;
  eventSlug: string;
};

export type TicketSummary = {
  total: number;
  byStatus: Record<TicketStatus, number>;
  byPrice: { priceCents: number; count: number }[];
};

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  AVAILABLE: "Available",
  SOLD: "Sold",
  VALIDATED: "Validated",
  CANCELLED: "Cancelled",
};

export const TICKET_TRANSACTION_LABELS: Record<TicketTransactionType, string> = {
  GENERATED: "Generated",
  SALE: "Sale",
  VALIDATION: "Validation",
  REFUND: "Refund",
};
