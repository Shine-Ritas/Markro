import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { EventDetailActions } from "@/components/events/event-detail-actions";
import { EventStatusBadge } from "@/components/events/event-status-badge";
import { formatDate, formatDateTime } from "@/lib/format";
import { getTenantEventById } from "@/services/event.service";
import { Calendar, MapPin, Ticket, Trophy } from "lucide-react";

type PageProps = { params: Promise<{ id: string }> };

export default async function EventDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");

  const { id } = await params;
  const event = await getTenantEventById(session.user.tenantId, id);
  if (!event) notFound();

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-2xl font-bold">{event.name}</h2>
            <EventStatusBadge status={event.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            Slug: <code className="font-mono text-xs">{event.slug}</code>
          </p>
        </div>
        <EventDetailActions
          event={event}
          tenantSlug={session.user.tenantSlug ?? "demo-org"}
        />
      </div>

      {event.bannerUrl ? (
        <div className="overflow-hidden rounded-xl border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.bannerUrl}
            alt=""
            className="aspect-[3/1] w-full object-cover"
          />
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-heading font-semibold">Schedule</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <Calendar className="size-4 text-muted-foreground" />
              Starts {formatDateTime(event.startDate)}
            </li>
            {event.endDate ? (
              <li className="flex items-center gap-2 text-muted-foreground">
                Ends {formatDateTime(event.endDate)}
              </li>
            ) : null}
            {event.drawScheduledAt ? (
              <li className="text-muted-foreground">
                Draw scheduled {formatDateTime(event.drawScheduledAt)}
              </li>
            ) : null}
            {event.venue ? (
              <li className="flex items-center gap-2">
                <MapPin className="size-4 text-muted-foreground" />
                {event.venue}
              </li>
            ) : null}
          </ul>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-heading font-semibold">Capacity</h3>
          <div className="mt-4 flex gap-6">
            <div>
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <Ticket className="size-4" />
                Tickets
              </p>
              <p className="font-heading text-2xl font-bold">{event.ticketQuantity}</p>
            </div>
            <div>
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <Trophy className="size-4" />
                Winners
              </p>
              <p className="font-heading text-2xl font-bold">{event.winnerCount}</p>
            </div>
          </div>
          {event.publishedAt ? (
            <p className="mt-4 text-xs text-muted-foreground">
              Published {formatDate(event.publishedAt)}
            </p>
          ) : null}
        </section>
      </div>

      {event.description ? (
        <section className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-heading font-semibold">Description</h3>
          <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
            {event.description}
          </p>
        </section>
      ) : null}

      {event.rules ? (
        <section className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-heading font-semibold">Rules</h3>
          <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
            {event.rules}
          </p>
        </section>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Ticket sales UI arrives in Phase 5.{" "}
        {event.status === "PUBLISHED" ? (
          <Link
            href={`/org/${session.user.tenantSlug}/events/${event.slug}`}
            className="text-primary hover:underline"
          >
            View public page →
          </Link>
        ) : null}
      </p>
    </div>
  );
}
