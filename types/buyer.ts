export type BuyerProfileDto = {
  id: string;
  email: string;
  name: string | null;
  globalUserCode: string;
  phone: string | null;
  phoneVerified: boolean;
  linkedOrganizerCount: number;
  linkedCustomerIds: string[];
  hasStaffAccess: boolean;
};

export type BuyerTicketDto = {
  id: string;
  ticketNumber: string;
  status: string;
  eventId: string;
  eventName: string;
  tenantId: string;
  tenantName: string;
  soldAt: string | null;
  priceCents: number;
};

export type BuyerPurchaseDto = {
  id: string;
  receiptNumber: string | null;
  tenantId: string;
  tenantName: string;
  eventId: string;
  eventName: string;
  totalCents: number;
  ticketCount: number;
  ticketNumbers: string[];
  completedAt: string | null;
};

export type BuyerWinDto = {
  id: string;
  tenantId: string;
  tenantName: string;
  eventId: string;
  eventName: string;
  prizeName: string | null;
  ticketNumber: string;
  rank: number;
  selectedAt: string;
};

export type ExploreEventDto = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  bannerUrl: string | null;
  endDate: string | null;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  prizeCount: number;
  availableTicketCount: number;
  avgTicketPriceCents: number;
  currentPriceCents: number;
  currencyCode: string | null;
};

export type ExploreEventsResult = {
  events: ExploreEventDto[];
  total: number;
};
