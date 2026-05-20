import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Ticket } from "lucide-react";
import { EventStatusBadge } from "@/components/events/event-status-badge";
import { formatDate } from "@/lib/format";
import { listPublishedEventsForOrg } from "@/services/event.service";
import { APP_NAME } from "@/lib/constants";

type PageProps = { params: Promise<{ tenantSlug: string }> };

export default async function OrgPublicPage({ params }: PageProps) {
  const { tenantSlug } = await params;
  const data = await listPublishedEventsForOrg(tenantSlug);
  if (!data) notFound();

  const { tenant, events } = data;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-6 sm:px-6">
          <div>
            <p className="text-xs text-muted-foreground">{APP_NAME}</p>
            <h1 className="font-heading text-2xl font-bold">{tenant.name}</h1>
          </div>
          <Link href="/login" className="text-sm text-primary hover:underline">
            Organizer login
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <h2 className="font-heading text-lg font-semibold">Published events</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse upcoming lucky draw events from {tenant.name}.
        </p>

        {events.length === 0 ? (
          <div className="mt-12 rounded-xl border border-dashed border-border py-16 text-center">
            <Calendar className="mx-auto mb-4 size-12 text-muted-foreground/40" />
            <p className="font-medium">No published events</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Check back soon for new draws.
            </p>
          </div>
        ) : (
          <ul className="mt-8 space-y-4">
            {events.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/org/${tenantSlug}/events/${event.slug}`}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h3 className="font-heading text-lg font-semibold">{event.name}</h3>
                    <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="size-4" />
                      {formatDate(event.startDate)}
                      {event.venue ? ` · ${event.venue}` : null}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Ticket className="size-3.5" />
                      {event.ticketQuantity} tickets
                    </span>
                    <EventStatusBadge status={event.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
