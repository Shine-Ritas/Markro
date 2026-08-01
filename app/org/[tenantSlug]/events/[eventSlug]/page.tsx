import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, MapPin, Ticket, Trophy } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { getTenantEventBySlug } from "@/services/event.service";
import { listPublicEventWinners } from "@/services/draw.service";
import { prisma } from "@/lib/prisma";
import { APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";

type PageProps = {
  params: Promise<{ tenantSlug: string; eventSlug: string }>;
};

export default async function PublicEventPage({ params }: PageProps) {
  const { tenantSlug, eventSlug } = await params;

  const tenant = await prisma.tenant.findFirst({
    where: { slug: tenantSlug, deletedAt: null, status: "ACTIVE" },
  });
  if (!tenant) notFound();

  const event = await getTenantEventBySlug(tenant.id, eventSlug);
  if (!event) notFound();

  const publicWinners =
    event.status === "COMPLETED" ? await listPublicEventWinners(event.id) : [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5 sm:px-6">
          <Link
            href={`/org/${tenantSlug}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← {event.tenantName}
          </Link>
          <span className="text-xs text-muted-foreground">{APP_NAME}</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {event.bannerUrl ? (
          <div className="mb-6 overflow-hidden rounded-xl border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={event.bannerUrl}
              alt=""
              className="aspect-[2/1] w-full object-cover"
            />
          </div>
        ) : null}

        <h1 className="font-heading text-3xl font-bold">{event.name}</h1>

        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <Calendar className="size-4 shrink-0" />
            {formatDateTime(event.startDate)}
            {event.endDate ? ` – ${formatDateTime(event.endDate)}` : null}
          </li>
          {event.venue ? (
            <li className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0" />
              {event.venue}
            </li>
          ) : null}
          <li className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Ticket className="size-4" />
              {event.ticketQuantity} tickets available
            </span>
            <span className="flex items-center gap-1">
              <Trophy className="size-4" />
              {event.winnerCount} winner{event.winnerCount !== 1 ? "s" : ""}
            </span>
          </li>
        </ul>

        {event.description ? (
          <section className="mt-8 rounded-xl border border-border bg-card p-5">
            <h2 className="font-heading font-semibold">About</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
              {event.description}
            </p>
          </section>
        ) : null}

        {event.rules ? (
          <section className="mt-4 rounded-xl border border-border bg-card p-5">
            <h2 className="font-heading font-semibold">Rules</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
              {event.rules}
            </p>
          </section>
        ) : null}

        {publicWinners.length > 0 ? (
          <section className="mt-8 rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
            <h2 className="flex items-center gap-2 font-heading font-semibold">
              <Trophy className="size-5 text-amber-400" />
              Past winners
            </h2>
            <ul className="mt-4 space-y-2">
              {publicWinners.map((w) => (
                <li
                  key={`${w.rank}-${w.ticketNumber}`}
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2 text-sm"
                >
                  <div>
                    <span className="font-mono font-medium">#{w.ticketNumber}</span>
                    {w.prizeName ? (
                      <span className="ml-2 text-muted-foreground">
                        · {w.prizeName}
                      </span>
                    ) : null}
                  </div>
                  {w.buyerFirstName ? (
                    <span className="text-muted-foreground">{w.buyerFirstName}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {event.status === "PUBLISHED" ? (
          <section className="mt-8 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-6 text-center">
            <Ticket className="mx-auto mb-3 size-10 text-primary/60" />
            <h2 className="font-heading text-lg font-semibold">Get tickets</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Online ticket purchase opens in Phase 5. Visit our POS or contact the
              organizer for early access.
            </p>
            <Button className="mt-4" disabled>
              Buy tickets (coming soon)
            </Button>
          </section>
        ) : event.status === "COMPLETED" ? (
          <section className="mt-8 rounded-xl border border-border bg-card p-6 text-center">
            <Trophy className="mx-auto mb-3 size-10 text-amber-400/80" />
            <h2 className="font-heading text-lg font-semibold">Draw complete</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This event has concluded. See winners above.
            </p>
          </section>
        ) : null}
      </main>
    </div>
  );
}
