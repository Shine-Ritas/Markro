import type { PosSaleStatus } from "@prisma/client";

export type PosAvailableTicket = {
  id: string;
  ticketNumber: string;
  priceCents: number;
};

export type PosEventOption = {
  id: string;
  name: string;
  slug: string;
  venue: string | null;
  startDate: string;
  availableCount: number;
  currentPriceCents: number | null;
  currencyCode: string | null;
};

export type PosSaleLineDto = {
  id: string;
  ticketId: string;
  ticketNumber: string;
  priceCents: number;
};

export type PosSaleDto = {
  id: string;
  tenantId: string;
  eventId: string;
  eventName: string;
  currencyCode: string | null;
  status: PosSaleStatus;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  quantity: number;
  totalCents: number;
  receiptNumber: string | null;
  actorId: string | null;
  actorName: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  lines: PosSaleLineDto[];
};

export type PosDailyStats = {
  saleCount: number;
  ticketCount: number;
  revenueCents: number;
  recentSales: {
    id: string;
    receiptNumber: string | null;
    eventName: string;
    quantity: number;
    totalCents: number;
    customerName: string | null;
    completedAt: string;
    actorName: string | null;
  }[];
};

export type PosSalesHistorySummary = {
  saleCount: number;
  ticketCount: number;
  revenueCents: number;
};

export type PosSalesHistoryResult = {
  sales: PosSaleDto[];
  total: number;
  summary: PosSalesHistorySummary;
};

export type PosEventFilterOption = {
  id: string;
  name: string;
};
