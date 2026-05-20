import type { EventStatus } from "@prisma/client";

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
  status: EventStatus;
  publishedAt: string | null;
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
