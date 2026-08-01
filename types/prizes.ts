export type PrizeDto = {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  valueCents: number | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type EventPrizeDto = {
  id: string;
  eventId: string;
  prizeId: string;
  rank: number;
  prize: PrizeDto;
};

export type EventPrizeAssignmentInput = {
  prizeId: string;
  rank: number;
};

export type DrawReadyEventItem = {
  id: string;
  name: string;
  slug: string;
  winnerCount: number;
  drawOrder: "HIGH_TO_LOW" | "LOW_TO_HIGH";
  prizesAssigned: number;
  eligibleTicketCount: number;
  drawScheduledAt: string | null;
  hasActiveSession: boolean;
  activeSessionId: string | null;
};
