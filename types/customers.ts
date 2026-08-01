import type { CustomerSource, ReferralStatus } from "@prisma/client";

export type CustomerDto = {
  id: string;
  tenantId: string;
  userId: string | null;
  displayName: string;
  phone: string;
  email: string | null;
  loyaltyPoints: number;
  isBlacklisted: boolean;
  blacklistReason: string | null;
  referralCode: string;
  referredById: string | null;
  source: CustomerSource;
  createdAt: string;
  updatedAt: string;
};

export type CustomerListItem = CustomerDto & {
  purchaseCount: number;
  winCount: number;
  totalSpentCents: number;
};

export type CustomerListResult = {
  customers: CustomerListItem[];
  total: number;
};

export type CustomerNoteDto = {
  id: string;
  customerId: string;
  authorId: string;
  authorName: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type ReferralDto = {
  id: string;
  referrerCustomerId: string;
  referredCustomerId: string | null;
  referredPhone: string | null;
  eventId: string | null;
  status: ReferralStatus;
  rewardPoints: number;
  createdAt: string;
  referredCustomerName: string | null;
};

export type CustomerPurchaseDto = {
  id: string;
  receiptNumber: string | null;
  eventId: string;
  eventName: string;
  totalCents: number;
  ticketCount: number;
  ticketNumbers: string[];
  completedAt: string | null;
};

export type CustomerParticipationDto = {
  eventId: string;
  eventName: string;
  ticketCount: number;
  ticketNumbers: string[];
  wins: Array<{
    rank: number;
    prizeName: string | null;
    ticketNumber: string;
    selectedAt: string;
  }>;
};

export type CustomerTimelineEvent =
  | {
      type: "SALE_COMPLETED";
      id: string;
      at: string;
      receiptNumber: string | null;
      eventName: string;
      totalCents: number;
      ticketCount: number;
    }
  | {
      type: "TICKET_WON";
      id: string;
      at: string;
      eventName: string;
      prizeName: string | null;
      ticketNumber: string;
      rank: number;
    }
  | {
      type: "NOTE_ADDED";
      id: string;
      at: string;
      authorName: string | null;
      body: string;
    }
  | {
      type: "REFERRAL_CREATED";
      id: string;
      at: string;
      referredPhone: string | null;
      referredCustomerName: string | null;
      status: ReferralStatus;
    }
  | {
      type: "BLACKLIST_UPDATED";
      id: string;
      at: string;
      isBlacklisted: boolean;
      reason: string | null;
    };

export type CustomerDetailDto = CustomerDto & {
  purchaseCount: number;
  winCount: number;
  totalSpentCents: number;
  referredByName: string | null;
};

export const CUSTOMER_SOURCE_LABELS: Record<CustomerSource, string> = {
  POS: "POS",
  MANUAL: "Manual",
  IMPORT: "Import",
  ONLINE: "Online",
};

export const REFERRAL_STATUS_LABELS: Record<ReferralStatus, string> = {
  PENDING: "Pending",
  COMPLETED: "Completed",
  REWARDED: "Rewarded",
};
