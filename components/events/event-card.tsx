import Link from "next/link";
import { Calendar, MapPin, Ticket, Trophy } from "lucide-react";
import { EventStatusBadge } from "@/components/events/event-status-badge";
import { formatDate } from "@/lib/format";
import type { EventListItem } from "@/types/events";

export function EventCard({ event }: { event: EventListItem }) {
  return (
    <Link
      href={`/dashboard/events/${event.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/40 hover:bg-card/80"
    >
      <div className="relative aspect-[2/1] bg-muted/40">
        {event.bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.bannerUrl} alt="" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Calendar className="size-10 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute right-3 top-3">
          <EventStatusBadge status={event.status} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="font-heading font-semibold group-hover:text-primary">
          {event.name}
        </h3>
        <div className="space-y-1.5 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <Calendar className="size-4 shrink-0" />
            {formatDate(event.startDate)}
            {event.endDate ? ` – ${formatDate(event.endDate)}` : null}
          </p>
          {event.venue ? (
            <p className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0" />
              <span className="truncate">{event.venue}</span>
            </p>
          ) : null}
        </div>
        <div className="mt-auto flex gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Ticket className="size-3.5" />
            {event.ticketQuantity} tickets
          </span>
          <span className="flex items-center gap-1">
            <Trophy className="size-3.5" />
            {event.winnerCount} winners
          </span>
        </div>
      </div>
    </Link>
  );
}
