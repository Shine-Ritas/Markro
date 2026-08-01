"use client";

import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  CalendarDays,
  CircleDollarSign,
  Ticket,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { formatMoney } from "@/lib/tickets";
import type { ExploreEventDto } from "@/types/buyer";

type FeaturedEventCardProps = {
  event: ExploreEventDto;
};

export function FeaturedEventCard({ event }: FeaturedEventCardProps) {
  const eventUrl = `/org/${event.tenantSlug}/events/${event.slug}`;
  const currencyCode = event.currencyCode ?? "THB";
  const ticketPriceCents =
    event.currentPriceCents > 0 ? event.currentPriceCents : event.avgTicketPriceCents;

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="relative aspect-[2/1] bg-muted/40">
        {event.bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.bannerUrl} alt="" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/20 via-primary/5 to-muted">
            <Calendar className="size-10 text-muted-foreground/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <p className="text-xs font-medium text-white/80">{event.tenantName}</p>
          <h3 className="font-heading text-lg font-bold leading-tight">{event.name}</h3>
          {event.description ? (
            <p className="mt-1 line-clamp-2 text-xs text-white/85">
              {event.description}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
            <Trophy className="size-3" />
            {event.prizeCount} prize{event.prizeCount !== 1 ? "s" : ""}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
            <Ticket className="size-3" />
            {event.availableTicketCount} available
          </span>
          {ticketPriceCents > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
              <CircleDollarSign className="size-3" />
              {formatMoney(ticketPriceCents, currencyCode)} / ticket
            </span>
          ) : null}
          {event.endDate ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
              <CalendarDays className="size-3" />
              Ends {formatDate(event.endDate)}
            </span>
          ) : null}
        </div>

        <Button variant="outline" className="w-full" render={<Link href={eventUrl} />}>
          View event
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </article>
  );
}
