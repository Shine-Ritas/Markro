"use client";

import { useMemo, useState } from "react";
import { Camera, LayoutGrid, List, Rows3, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TicketPreviewCard } from "@/components/tickets/ticket-preview-card";
import { EventShareCapture } from "@/components/events/event-share-capture";
import { cn } from "@/lib/utils";
import { parseTicketDesignTheme } from "@/lib/ticket-designs";
import {
  MAX_SHARE_TICKET_COUNT,
  SHARE_ASPECT_RATIOS,
  TICKET_LIST_VIEW_LABELS,
  type ShareAspectRatio,
} from "@/types/ticket-designs";
import type { EventDto } from "@/types/events";
import type { TicketListView } from "@prisma/client";

const VIEW_ICONS: Record<TicketListView, typeof LayoutGrid> = {
  GRID: LayoutGrid,
  COMPACT: List,
  SHOWCASE: Rows3,
  TABLE: Table2,
};

function buildMockShareTickets(quantity: number) {
  const count = Math.min(Math.max(quantity, 3), MAX_SHARE_TICKET_COUNT);
  return Array.from({ length: count }, (_, i) => ({
    number: String(i + 1).padStart(4, "0"),
    priceCents: 0,
  }));
}

type EventTicketsPanelProps = {
  event: EventDto;
  tenantName: string;
};

export function EventTicketsPanel({ event, tenantName }: EventTicketsPanelProps) {
  const [listView, setListView] = useState<TicketListView>(event.ticketListViewDefault);
  const [aspectRatio, setAspectRatio] = useState<ShareAspectRatio>("4:5");

  const theme = parseTicketDesignTheme(event.ticketDesign?.theme ?? {});
  const designName = event.ticketDesign?.name ?? "Classic";
  const mockTickets = useMemo(
    () => buildMockShareTickets(event.ticketQuantity).map((t) => t.number),
    [event.ticketQuantity]
  );
  const shareTickets = useMemo(
    () => buildMockShareTickets(event.ticketQuantity),
    [event.ticketQuantity]
  );

  return (
    <section className="rounded-xl border border-border bg-card/30 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-heading text-lg font-semibold">Tickets preview</h3>
          <p className="text-sm text-muted-foreground">
            Choose how tickets will appear · real tickets in Phase 5
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(Object.keys(TICKET_LIST_VIEW_LABELS) as TicketListView[]).map((view) => {
            const Icon = VIEW_ICONS[view];
            return (
              <button
                key={view}
                type="button"
                onClick={() => setListView(view)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                  listView === view
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-3.5" />
                {TICKET_LIST_VIEW_LABELS[view]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        {listView === "GRID" ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {mockTickets.map((n) => (
              <TicketPreviewCard
                key={n}
                number={n}
                eventName={event.name}
                theme={theme}
              />
            ))}
          </div>
        ) : listView === "COMPACT" ? (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {mockTickets.map((n) => (
              <li
                key={n}
                className="flex items-center justify-between px-4 py-2.5 font-mono text-sm"
              >
                <span>{n}</span>
                <span className="text-xs text-muted-foreground">Available</span>
              </li>
            ))}
          </ul>
        ) : listView === "SHOWCASE" ? (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {mockTickets.slice(0, 5).map((n) => (
              <div key={n} className="w-[min(200px,40vw)] shrink-0">
                <TicketPreviewCard number={n} eventName={event.name} theme={theme} />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left text-muted-foreground">
                  <th className="px-4 py-2">Number</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {mockTickets.map((n) => (
                  <tr key={n} className="border-b border-border/60 font-mono">
                    <td className="px-4 py-2">{n}</td>
                    <td className="px-4 py-2 text-muted-foreground">Available</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
        <p className="text-xs text-muted-foreground">
          Design: <span className="text-foreground">{designName}</span>
        </p>

        <Dialog>
          <DialogTrigger
            render={
              <Button type="button">
                <Camera className="size-4" />
                Take photo
              </Button>
            }
          />
          <DialogContent className="max-h-[92vh] w-[min(96vw,56rem)] max-w-[min(96vw,56rem)] overflow-y-auto overflow-x-hidden sm:max-w-[min(96vw,56rem)]">
            <DialogHeader>
              <DialogTitle>Share preview</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Full-width promo with up to {MAX_SHARE_TICKET_COUNT} tickets. Screenshot
              this view to share on social media.
            </p>

            <div className="flex flex-wrap gap-2">
              {SHARE_ASPECT_RATIOS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setAspectRatio(r.id)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-medium",
                    aspectRatio === r.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground"
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <div className="w-full min-w-0">
              <EventShareCapture
                eventName={event.name}
                tenantName={tenantName}
                venue={event.venue}
                startDate={event.startDate}
                ticketQuantity={event.ticketQuantity}
                winnerCount={event.winnerCount}
                bannerUrl={event.bannerUrl}
                theme={theme}
                aspectRatio={aspectRatio}
                tickets={shareTickets}
                currencyCode={event.currencyCode}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
