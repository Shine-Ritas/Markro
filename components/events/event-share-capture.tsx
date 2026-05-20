"use client";

import { Calendar, MapPin, Sparkles, Ticket, Trophy } from "lucide-react";
import { TicketPreviewCard } from "@/components/tickets/ticket-preview-card";
import { formatDate } from "@/lib/format";
import { formatMoney } from "@/lib/tickets";
import { cn } from "@/lib/utils";
import type { TicketDesignTheme } from "@/types/ticket-designs";
import type { TicketListView } from "@prisma/client";

export type EventShareCaptureProps = {
  eventName: string;
  tenantName: string;
  venue: string | null;
  startDate: string;
  ticketQuantity: number;
  winnerCount: number;
  bannerUrl: string | null;
  designName: string;
  theme: TicketDesignTheme;
  listView: TicketListView;
  aspectRatio: "1:1" | "4:5" | "16:9";
  mockTicketNumbers: string[];
  ticketPrices?: number[];
};

export function EventShareCapture({
  eventName,
  tenantName,
  venue,
  startDate,
  ticketQuantity,
  winnerCount,
  bannerUrl,
  designName,
  theme,
  listView,
  aspectRatio,
  mockTicketNumbers,
  ticketPrices = [],
}: EventShareCaptureProps) {
  const aspectClass =
    aspectRatio === "1:1"
      ? "aspect-square"
      : aspectRatio === "4:5"
        ? "aspect-[4/5]"
        : "aspect-video";

  return (
    <div
      id="event-share-capture"
      className={cn(
        "overflow-hidden rounded-xl bg-[oklch(0.11_0.02_285)] text-foreground",
        aspectClass,
        "w-full max-w-2xl"
      )}
    >
      {bannerUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={bannerUrl} alt="" className="h-32 w-full object-cover" />
      ) : (
        <div className="flex h-24 items-center justify-center bg-primary/20">
          <Sparkles className="size-10 text-primary" />
        </div>
      )}

      <div className="space-y-4 p-5">
        <div>
          <p className="text-xs uppercase tracking-wider text-primary/80">
            {tenantName}
          </p>
          <h2 className="font-heading text-xl font-bold leading-tight">{eventName}</h2>
        </div>

        <ul className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <li className="flex items-center gap-1">
            <Calendar className="size-3.5" />
            {formatDate(startDate)}
          </li>
          {venue ? (
            <li className="flex items-center gap-1">
              <MapPin className="size-3.5" />
              {venue}
            </li>
          ) : null}
          <li className="flex items-center gap-1">
            <Ticket className="size-3.5" />
            {ticketQuantity} tickets
          </li>
          <li className="flex items-center gap-1">
            <Trophy className="size-3.5" />
            {winnerCount} winners
          </li>
        </ul>

        <div>
          <p className="mb-2 text-xs text-muted-foreground">
            Ticket design: {designName} · Preview ({listView.toLowerCase()})
          </p>
          {listView === "TABLE" ? (
            <div className="rounded-lg border border-border/60 overflow-hidden text-xs">
              <div className="grid grid-cols-3 gap-px bg-border/40 font-medium">
                <span className="bg-card/80 p-2">#</span>
                <span className="bg-card/80 p-2 col-span-2">Event</span>
              </div>
              {mockTicketNumbers.slice(0, 5).map((n) => (
                <div key={n} className="grid grid-cols-3 gap-px bg-border/20">
                  <span className="bg-card/60 p-2 font-mono">{n}</span>
                  <span className="bg-card/60 p-2 col-span-2 truncate">
                    {eventName}
                  </span>
                </div>
              ))}
            </div>
          ) : listView === "COMPACT" ? (
            <ul className="space-y-1">
              {mockTicketNumbers.map((n, i) => (
                <li
                  key={n}
                  className="flex items-center justify-between rounded-md border border-border/50 px-3 py-1.5 font-mono text-sm"
                  style={{ borderColor: theme.borderColor }}
                >
                  <span>{n}</span>
                  <span className="text-xs text-primary">
                    {ticketPrices[i] !== undefined ? formatMoney(ticketPrices[i]) : "—"}
                  </span>
                </li>
              ))}
            </ul>
          ) : listView === "SHOWCASE" ? (
            <div className="flex gap-2 overflow-hidden">
              {mockTicketNumbers.slice(0, 4).map((n) => (
                <div key={n} className="min-w-[140px] flex-1">
                  <TicketPreviewCard
                    number={n}
                    eventName={eventName}
                    theme={theme}
                    compact
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {mockTicketNumbers.map((n, i) => (
                <div key={n}>
                  <TicketPreviewCard
                    number={n}
                    eventName={eventName}
                    theme={theme}
                    compact
                  />
                  {ticketPrices[i] !== undefined ? (
                    <p className="mt-1 text-center text-[10px] text-primary">
                      {formatMoney(ticketPrices[i])}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-[10px] text-muted-foreground/80">
          LuckyDraw Pro · luckdraw.app
        </p>
      </div>
    </div>
  );
}
