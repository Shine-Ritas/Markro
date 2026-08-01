"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Trophy } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { DRAW_SELECTION_LABELS, type WinnersHistoryResult } from "@/types/draws";

type DatePreset = "all" | "7d" | "30d";

type EventOption = { id: string; name: string };

type WinnersListClientProps = {
  initialData: WinnersHistoryResult;
  eventOptions: EventOption[];
};

function rankLabel(rank: number) {
  if (rank === 1) return "1st";
  if (rank === 2) return "2nd";
  if (rank === 3) return "3rd";
  return `${rank}th`;
}

function buildUrl(options: { eventId: string; preset: DatePreset; q: string }) {
  const params = new URLSearchParams();
  if (options.eventId) params.set("eventId", options.eventId);
  if (options.q.trim()) params.set("q", options.q.trim());
  if (options.preset === "7d") {
    const from = new Date();
    from.setDate(from.getDate() - 7);
    params.set("from", from.toISOString());
  }
  if (options.preset === "30d") {
    const from = new Date();
    from.setDate(from.getDate() - 30);
    params.set("from", from.toISOString());
  }
  const query = params.toString();
  return query ? `/api/winners?${query}` : "/api/winners";
}

export function WinnersListClient({
  initialData,
  eventOptions,
}: WinnersListClientProps) {
  const [data, setData] = useState(initialData);
  const [eventId, setEventId] = useState("");
  const [preset, setPreset] = useState<DatePreset>("all");
  const [searchInput, setSearchInput] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchWinners = useCallback(
    async (opts: { eventId: string; preset: DatePreset; q: string }) => {
      setLoading(true);
      try {
        const res = await fetch(buildUrl(opts));
        const json = await res.json();
        if (res.ok) setData(json);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchWinners({ eventId, preset, q: appliedQuery });
  }, [eventId, preset, appliedQuery, fetchWinners]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Total winners"
          value={String(data.summary.winnerCount)}
          subtext="Across filtered results"
          icon={Trophy}
        />
        <StatCard
          label="Events with winners"
          value={String(data.summary.eventCount)}
          subtext="Unique events"
          icon={Trophy}
        />
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", "All time"],
              ["7d", "Last 7 days"],
              ["30d", "Last 30 days"],
            ] as const
          ).map(([key, label]) => (
            <Button
              key={key}
              type="button"
              size="sm"
              variant={preset === key ? "default" : "outline"}
              onClick={() => setPreset(key)}
            >
              {label}
            </Button>
          ))}
        </div>

        <div className="min-w-[180px] flex-1 space-y-1">
          <Label htmlFor="eventFilter">Event</Label>
          <select
            id="eventFilter"
            className="flex h-9 w-full rounded-lg border border-border bg-background px-3 text-sm"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
          >
            <option value="">All events</option>
            {eventOptions.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex min-w-[200px] flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Ticket #, name, phone…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setAppliedQuery(searchInput);
              }}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setAppliedQuery(searchInput)}
          >
            Search
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Rank</TableHead>
              <TableHead>Prize</TableHead>
              <TableHead>Ticket</TableHead>
              <TableHead>Buyer</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Selected</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-12 text-center text-muted-foreground"
                >
                  Loading…
                </TableCell>
              </TableRow>
            ) : data.winners.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-12 text-center text-muted-foreground"
                >
                  No winners yet. Run a draw from a published event.
                </TableCell>
              </TableRow>
            ) : (
              data.winners.map((w) => (
                <TableRow key={w.id}>
                  <TableCell>
                    <div className="font-medium">{w.eventName}</div>
                  </TableCell>
                  <TableCell>{rankLabel(w.rank)}</TableCell>
                  <TableCell>{w.prizeName ?? "—"}</TableCell>
                  <TableCell className="font-mono">{w.ticketNumber}</TableCell>
                  <TableCell>{w.buyerName ?? "—"}</TableCell>
                  <TableCell>{w.buyerPhone ?? "—"}</TableCell>
                  <TableCell>{DRAW_SELECTION_LABELS[w.selectionMethod]}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(w.selectedAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
