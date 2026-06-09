"use client";

import Link from "next/link";
import { Eye, Pencil } from "lucide-react";
import { TicketStatusBadge } from "@/components/tickets/ticket-status-badge";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/tickets";
import type { TicketTableGroup } from "@/lib/ticket-groups";
import type { TicketStatus } from "@prisma/client";

const STATUS_ORDER: TicketStatus[] = ["AVAILABLE", "SOLD", "VALIDATED", "CANCELLED"];

type TicketsAggregatedTableProps = {
  groups: TicketTableGroup[];
  showEventColumn?: boolean;
  onViewGroup?: (group: TicketTableGroup) => void;
  modifyHref?: (group: TicketTableGroup) => string;
};

function StatusCountBadges({ byStatus }: { byStatus: Record<TicketStatus, number> }) {
  const active = STATUS_ORDER.filter((status) => byStatus[status] > 0);

  if (active.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {active.map((status) => (
        <span
          key={status}
          className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/20 px-2 py-1"
        >
          <TicketStatusBadge status={status} />
          <span className="text-xs font-medium tabular-nums">{byStatus[status]}</span>
        </span>
      ))}
    </div>
  );
}

export function TicketsAggregatedTable({
  groups,
  showEventColumn = true,
  onViewGroup,
  modifyHref,
}: TicketsAggregatedTableProps) {
  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
        No ticket groups to display.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm" suppressHydrationWarning>
        <thead>
          <tr className="border-b border-border bg-muted/30 text-left text-muted-foreground">
            {showEventColumn ? <th className="px-4 py-3">Event</th> : null}
            <th className="px-4 py-3">Ticket type</th>
            <th className="px-4 py-3">Total tickets</th>
            <th className="px-4 py-3">Price</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => {
            const rowKey = `${group.eventId}-${group.ticketTypeId ?? "none"}-${group.priceCents}`;
            const modifyUrl =
              modifyHref?.(group) ?? `/dashboard/events/${group.eventId}`;

            return (
              <tr key={rowKey} className="border-b border-border/60 last:border-0">
                {showEventColumn ? (
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/events/${group.eventId}`}
                      className="font-medium hover:text-primary"
                    >
                      {group.eventName}
                    </Link>
                  </td>
                ) : null}
                <td className="px-4 py-3 text-muted-foreground">
                  {group.ticketTypeName}
                </td>
                <td className="px-4 py-3 font-medium tabular-nums">{group.total}</td>
                <td className="px-4 py-3">
                  {formatMoney(group.priceCents, group.currencyCode)}
                </td>
                <td className="px-4 py-3">
                  <StatusCountBadges byStatus={group.byStatus} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {onViewGroup ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => onViewGroup(group)}
                      >
                        <Eye className="size-3.5" />
                        View
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        render={<Link href={`/dashboard/events/${group.eventId}`} />}
                      >
                        <Eye className="size-3.5" />
                        View
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      render={<Link href={modifyUrl} />}
                    >
                      <Pencil className="size-3.5" />
                      Modify
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
