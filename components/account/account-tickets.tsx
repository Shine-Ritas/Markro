"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { BuyerTicketDto } from "@/types/buyer";

export function AccountTicketsClient() {
  const [tickets, setTickets] = useState<BuyerTicketDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/me/tickets");
        const json = await res.json();
        if (res.ok) setTickets(json.tickets ?? []);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const organizers = [...new Set(tickets.map((t) => t.tenantName))];
  const filtered =
    filter === "all" ? tickets : tickets.filter((t) => t.tenantName === filter);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-xl font-bold">My tickets</h1>
      {organizers.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-full px-3 py-1 text-xs ${filter === "all" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          >
            All
          </button>
          {organizers.map((org) => (
            <button
              key={org}
              type="button"
              onClick={() => setFilter(org)}
              className={`rounded-full px-3 py-1 text-xs ${filter === org ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            >
              {org}
            </button>
          ))}
        </div>
      ) : null}
      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No tickets yet. Purchases will appear here once linked.
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket) => (
            <div
              key={ticket.id}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-lg font-bold">#{ticket.ticketNumber}</p>
                  <p className="text-sm text-muted-foreground">{ticket.eventName}</p>
                  <p className="text-xs text-muted-foreground">{ticket.tenantName}</p>
                </div>
                <Badge variant="outline">{ticket.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
