import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { TicketStatusBadge } from "@/components/tickets/ticket-status-badge";
import { formatMoney } from "@/lib/tickets";
import { listTenantTickets } from "@/services/ticket.service";

export default async function TicketsPage() {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");

  const tickets = await listTenantTickets(session.user.tenantId, { limit: 200 });

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <p className="text-sm text-muted-foreground">
        All tickets across events. Open an event for generation, pricing, and QR
        validation.
      </p>

      {tickets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <p className="font-medium">No tickets yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create an event, set price periods, then generate tickets.
          </p>
          <Link
            href="/dashboard/events"
            className="mt-4 inline-block text-sm text-primary hover:underline"
          >
            Go to events →
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-muted-foreground">
                <th className="px-4 py-3">Number</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id} className="border-b border-border/60">
                  <td className="px-4 py-3 font-mono">{t.ticketNumber}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/events/${t.eventId}`}
                      className="hover:text-primary"
                    >
                      {t.eventName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{formatMoney(t.priceCents)}</td>
                  <td className="px-4 py-3">
                    <TicketStatusBadge status={t.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
