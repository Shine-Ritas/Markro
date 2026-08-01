import type { DrawOrder, EventStatus, TicketListView } from "@prisma/client";
import type { TicketDesignPresetDto } from "@/types/ticket-designs";

export type EventDto = {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description: string | null;
  bannerUrl: string | null;
  rules: string | null;
  venue: string | null;
  startDate: string;
  endDate: string | null;
  drawScheduledAt: string | null;
  ticketQuantity: number;
  winnerCount: number;
  drawOrder: DrawOrder;
  ticketDesignId: string | null;
  ticketListViewDefault: TicketListView;
  currencyCode: string | null;
  ticketDesign: TicketDesignPresetDto | null;
  status: EventStatus;
  publishedAt: string | null;
  drawCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EventListItem = Pick<
  EventDto,
  | "id"
  | "name"
  | "slug"
  | "status"
  | "startDate"
  | "endDate"
  | "ticketQuantity"
  | "winnerCount"
  | "venue"
  | "bannerUrl"
>;
