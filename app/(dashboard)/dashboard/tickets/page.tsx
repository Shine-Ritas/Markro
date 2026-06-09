import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { TicketsListClient } from "@/components/tickets/tickets-list-client";
import {
  getTenantTicketSummary,
  listTenantTicketTableGroups,
} from "@/services/ticket.service";

export default async function TicketsPage() {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");

  const tenantId = session.user.tenantId;

  const [tableGroups, summary] = await Promise.all([
    listTenantTicketTableGroups(tenantId),
    getTenantTicketSummary(tenantId),
  ]);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <p className="text-sm text-muted-foreground">
        One table row per event, ticket type, and price. Status shows grouped counts
        with badges.
      </p>

      <TicketsListClient tableGroups={tableGroups} summary={summary} />
    </div>
  );
}
