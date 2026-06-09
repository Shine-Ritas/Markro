"use client";

import { Calendar, MapPin, Sparkles, Ticket, Trophy } from "lucide-react";
import { formatDate } from "@/lib/format";
import { formatMoney } from "@/lib/tickets";
import { ticketDesignCardStyle } from "@/lib/ticket-designs";
import { cn } from "@/lib/utils";
import { MAX_SHARE_TICKET_COUNT, type ShareAspectRatio } from "@/types/ticket-designs";
import type { TicketDesignTheme } from "@/types/ticket-designs";

export type ShareTicketItem = {
  number: string;
  priceCents: number;
};

export type EventShareCaptureProps = {
  eventName: string;
  tenantName: string;
  venue: string | null;
  startDate: string;
  ticketQuantity: number;
  winnerCount: number;
  bannerUrl: string | null;
  theme: TicketDesignTheme;
  aspectRatio: ShareAspectRatio;
  tickets: ShareTicketItem[];
  currencyCode?: string | null;
};

export function EventShareCapture({
  eventName,
  tenantName,
  venue,
  startDate,
  ticketQuantity,
  winnerCount,
  bannerUrl,
  theme,
  aspectRatio,
  tickets,
  currencyCode,
}: EventShareCaptureProps) {
  const shown = tickets.slice(0, MAX_SHARE_TICKET_COUNT);
  const cardStyle = ticketDesignCardStyle(theme);
  const isWide = aspectRatio === "16:9";

  return (
    <div
      id="event-share-capture"
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-xl text-white",
        "bg-[linear-gradient(165deg,oklch(0.14_0.03_285)_0%,oklch(0.09_0.02_285)_55%,oklch(0.07_0.015_285)_100%)]"
      )}
    >
      {bannerUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={bannerUrl}
          alt=""
          className="h-36 w-full shrink-0 object-cover sm:h-44"
        />
      ) : (
        <div className="flex h-28 shrink-0 items-center justify-center bg-[linear-gradient(135deg,oklch(0.22_0.08_285),oklch(0.14_0.04_285))] sm:h-36">
          <Sparkles className="size-12 text-primary sm:size-14" />
        </div>
      )}

      <div className="flex flex-col gap-5 p-5 sm:gap-6 sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary sm:text-sm">
            {tenantName}
          </p>
          <h2 className="mt-1 font-heading text-2xl font-bold leading-tight tracking-tight sm:text-4xl">
            {eventName}
          </h2>

          <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/70 sm:text-sm">
            <li className="flex items-center gap-1.5">
              <Calendar className="size-3.5 shrink-0 opacity-80" />
              {formatDate(startDate)}
            </li>
            {venue ? (
              <li className="flex items-center gap-1.5">
                <MapPin className="size-3.5 shrink-0 opacity-80" />
                {venue}
              </li>
            ) : null}
            <li className="flex items-center gap-1.5">
              <Ticket className="size-3.5 shrink-0 opacity-80" />
              {ticketQuantity.toLocaleString()} tickets
            </li>
            <li className="flex items-center gap-1.5">
              <Trophy className="size-3.5 shrink-0 opacity-80" />
              {winnerCount} winner{winnerCount === 1 ? "" : "s"}
            </li>
          </ul>
        </div>

        <div>
          <div className="mb-3 flex items-end justify-between gap-2">
            <p className="text-sm font-semibold text-white/90 sm:text-base">
              Available tickets
            </p>
            {shown.length < ticketQuantity ? (
              <p className="text-xs text-white/50 sm:text-sm">
                Showing {shown.length} of {ticketQuantity.toLocaleString()}
              </p>
            ) : null}
          </div>

          <div
            className={cn(
              "grid w-full gap-2 sm:gap-3",
              isWide ? "grid-cols-3 sm:grid-cols-6" : "grid-cols-3 sm:grid-cols-4"
            )}
          >
            {shown.map((ticket) => (
              <div key={ticket.number} className="min-w-0">
                <div
                  className="flex min-h-[72px] flex-col items-center justify-center rounded-lg px-1 py-2 text-center sm:min-h-[84px] sm:rounded-xl sm:py-3"
                  style={cardStyle}
                >
                  <Ticket
                    className="size-3.5 opacity-70 sm:size-4"
                    style={{ color: theme.accentColor }}
                  />
                  <span
                    className="mt-1 font-mono text-base font-bold leading-none sm:text-xl"
                    style={{ color: theme.accentColor }}
                  >
                    {ticket.number}
                  </span>
                </div>
                {ticket.priceCents > 0 ? (
                  <p
                    className="mt-1 truncate text-center text-[10px] font-semibold sm:text-xs"
                    style={{ color: theme.accentColor ?? "oklch(0.72 0.2 285)" }}
                  >
                    {formatMoney(ticket.priceCents, currencyCode)}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <p className="border-t border-white/10 pt-4 text-center text-[10px] text-white/45 sm:text-xs">
          Get your ticket · LuckyDraw Pro
        </p>
      </div>
    </div>
  );
}
