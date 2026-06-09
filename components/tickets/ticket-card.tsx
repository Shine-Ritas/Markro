"use client";

import { TicketPreviewCard } from "@/components/tickets/ticket-preview-card";
import { TicketStatusBadge } from "@/components/tickets/ticket-status-badge";
import { formatMoney } from "@/lib/tickets";
import type { TicketDesignTheme } from "@/types/ticket-designs";
import type { TicketDto } from "@/types/tickets";
import { cn } from "@/lib/utils";

type TicketCardProps = {
  ticket: TicketDto;
  eventName: string;
  theme: TicketDesignTheme;
  currencyCode?: string | null;
  onClick?: () => void;
  compact?: boolean;
};

export function TicketCard({
  ticket,
  eventName,
  theme,
  currencyCode,
  onClick,
  compact,
}: TicketCardProps) {
  const inner = (
    <>
      <TicketPreviewCard
        number={ticket.ticketNumber}
        eventName={eventName}
        theme={theme}
        compact={compact}
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-primary">
          {formatMoney(ticket.priceCents, currencyCode ?? ticket.currencyCode)}
        </span>
        <TicketStatusBadge status={ticket.status} />
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn("w-full text-left transition-opacity hover:opacity-90")}
      >
        {inner}
      </button>
    );
  }

  return <div>{inner}</div>;
}
