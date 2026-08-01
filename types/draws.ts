import type { DrawSelectionMethod, DrawSessionStatus, DrawOrder } from "@prisma/client";

export type DrawWinnerDto = {
  id: string;
  drawSessionId: string;
  eventId: string;
  ticketId: string;
  ticketNumber: string;
  rank: number;
  tier: number | null;
  selectionMethod: DrawSelectionMethod;
  userId: string | null;
  customerId: string | null;
  buyerName: string | null;
  buyerPhone: string | null;
  buyerEmail: string | null;
  eventPrizeId: string | null;
  prizeId: string | null;
  prizeName: string | null;
  selectedAt: string;
};

export type DrawSessionDto = {
  id: string;
  tenantId: string;
  eventId: string;
  status: DrawSessionStatus;
  winnerCount: number;
  drawOrder: DrawOrder;
  eligibleCount: number;
  startedAt: string | null;
  completedAt: string | null;
  winners: DrawWinnerDto[];
  createdAt: string;
};

export type EligibleTicketSummary = {
  id: string;
  ticketNumber: string;
  status: string;
};

export type TenantWinnerListItem = DrawWinnerDto & {
  eventName: string;
  eventSlug: string;
  currencyCode: string | null;
};

export type WinnersHistoryResult = {
  winners: TenantWinnerListItem[];
  total: number;
  summary: {
    winnerCount: number;
    eventCount: number;
  };
};

export const DRAW_SELECTION_LABELS: Record<DrawSelectionMethod, string> = {
  RANDOM: "Random",
  MANUAL: "Manual",
};

export const DRAW_SESSION_STATUS_LABELS: Record<DrawSessionStatus, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};
