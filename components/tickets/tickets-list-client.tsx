"use client";

import Link from "next/link";
import { Ticket } from "lucide-react";
import { TicketStatusBadge } from "@/components/tickets/ticket-status-badge";
import { TicketsAggregatedTable } from "@/components/tickets/tickets-aggregated-table";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatMoney } from "@/lib/tickets";
import type { TicketTableGroup } from "@/lib/ticket-groups";
import type { TicketSummary } from "@/types/tickets";
import type { TicketStatus } from "@prisma/client";

type TicketsListClientProps = {
  tableGroups: TicketTableGroup[];
  summary: TicketSummary;
};

const STATUS_ORDER: TicketStatus[] = ["AVAILABLE", "SOLD", "VALIDATED", "CANCELLED"];

export function TicketsListClient({ tableGroups, summary }: TicketsListClientProps) {
  if (summary.total === 0) {
    return (
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
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,280px)_1fr]">
        <StatCard
          label="Total tickets"
          value={String(summary.total)}
          subtext={`${tableGroups.length} row${tableGroups.length === 1 ? "" : "s"} in table`}
          icon={Ticket}
        />
        <div className="space-y-3 rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">By status</p>
          <div className="flex flex-wrap gap-2">
            {STATUS_ORDER.map((status) => (
              <span
                key={status}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-xs"
              >
                <TicketStatusBadge status={status} />
                <span className="font-medium tabular-nums">
                  {summary.byStatus[status]}
                </span>
              </span>
            ))}
          </div>
          {summary.byPrice.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground">By price</p>
              <div className="flex flex-wrap gap-2">
                {summary.byPrice.map((group) => (
                  <span
                    key={group.priceCents}
                    className="rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground"
                  >
                    <span className="font-medium text-foreground">
                      {formatMoney(group.priceCents)}
                    </span>{" "}
                    · {group.count} ticket{group.count === 1 ? "" : "s"}
                  </span>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>

      <TicketsAggregatedTable groups={tableGroups} showEventColumn />
    </div>
  );
}
