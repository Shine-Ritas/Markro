"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PosAvailableTicket } from "@/types/pos";

type PosTicketPickerProps = {
  eventId: string;
  selectedIds: string[];
  onChange: (ids: string[], tickets: PosAvailableTicket[]) => void;
  disabled?: boolean;
  /** Increment to refetch available tickets (e.g. after a sale completes). */
  refreshKey?: number;
};

export function PosTicketPicker({
  eventId,
  selectedIds,
  onChange,
  disabled,
  refreshKey = 0,
}: PosTicketPickerProps) {
  const [tickets, setTickets] = useState<PosAvailableTicket[]>([]);
  const [selectedTickets, setSelectedTickets] = useState<PosAvailableTicket[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [quickAdd, setQuickAdd] = useState("");

  const fetchTickets = useCallback(
    async (query: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (query.trim()) params.set("q", query.trim());
        params.set("limit", "500");

        const res = await fetch(`/api/pos/events/${eventId}/tickets?${params}`);
        const data = await res.json();
        if (res.ok) {
          setTickets(data.tickets);
        }
      } finally {
        setLoading(false);
      }
    },
    [eventId]
  );

  useEffect(() => {
    void fetchTickets(search);
  }, [eventId, search, refreshKey, fetchTickets]);

  useEffect(() => {
    setSelectedTickets((prev) => {
      const map = new Map(prev.map((t) => [t.id, t]));
      for (const ticket of tickets) {
        if (selectedIds.includes(ticket.id)) {
          map.set(ticket.id, ticket);
        }
      }
      return selectedIds
        .map((id) => map.get(id))
        .filter((t): t is PosAvailableTicket => t !== undefined);
    });
  }, [selectedIds, tickets]);

  function toggleTicket(ticket: PosAvailableTicket) {
    if (disabled) return;

    const isSelected = selectedIds.includes(ticket.id);
    let nextIds: string[];
    let nextTickets: PosAvailableTicket[];

    if (isSelected) {
      nextIds = selectedIds.filter((id) => id !== ticket.id);
      nextTickets = selectedTickets.filter((t) => t.id !== ticket.id);
    } else {
      if (selectedIds.length >= 50) return;
      nextIds = [...selectedIds, ticket.id];
      nextTickets = [...selectedTickets, ticket];
    }

    setSelectedTickets(nextTickets);
    onChange(nextIds, nextTickets);
  }

  function removeTicket(ticketId: string) {
    const nextIds = selectedIds.filter((id) => id !== ticketId);
    const nextTickets = selectedTickets.filter((t) => t.id !== ticketId);
    setSelectedTickets(nextTickets);
    onChange(nextIds, nextTickets);
  }

  function handleQuickAdd() {
    const raw = quickAdd.trim();
    if (!raw) return;

    const match = tickets.find(
      (t) =>
        t.ticketNumber === raw ||
        t.ticketNumber === raw.padStart(t.ticketNumber.length, "0")
    );

    if (!match) return;
    if (selectedIds.includes(match.id)) {
      setQuickAdd("");
      return;
    }
    if (selectedIds.length >= 50) return;

    const nextIds = [...selectedIds, match.id];
    const nextTickets = [...selectedTickets, match];
    setSelectedTickets(nextTickets);
    onChange(nextIds, nextTickets);
    setQuickAdd("");
  }

  return (
    <div className="space-y-3">
      {selectedTickets.length > 0 ? (
        <div className="space-y-2">
          <Label>Selected numbers</Label>
          <div className="flex flex-wrap gap-2">
            {selectedTickets.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                onClick={() => removeTicket(ticket.id)}
                disabled={disabled}
                className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 font-mono text-sm text-primary"
              >
                #{ticket.ticketNumber}
                <X className="size-3" />
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="pos-ticket-search">Search numbers</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="pos-ticket-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="e.g. 007, 13, 420"
            className="pl-9"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          value={quickAdd}
          onChange={(e) => setQuickAdd(e.target.value)}
          placeholder="Quick add number"
          className="font-mono"
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleQuickAdd();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleQuickAdd}
          disabled={disabled || !quickAdd.trim()}
        >
          Add
        </Button>
      </div>

      <div className="relative min-h-[120px] rounded-lg border border-border bg-muted/20 p-3">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No available tickets match your search.
          </p>
        ) : (
          <div className="grid max-h-64 grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-6 md:grid-cols-8">
            {tickets.map((ticket) => {
              const isSelected = selectedIds.includes(ticket.id);
              return (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => toggleTicket(ticket)}
                  disabled={disabled || (!isSelected && selectedIds.length >= 50)}
                  className={cn(
                    "rounded-md border px-1 py-2 font-mono text-xs transition-colors",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:border-primary/50 hover:bg-primary/5"
                  )}
                >
                  {ticket.ticketNumber}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Tap numbers to select lucky tickets. Up to 50 per sale.
      </p>
    </div>
  );
}
