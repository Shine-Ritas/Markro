"use client";

import { useEffect, useState } from "react";
import { Loader2, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import type { BuyerWinDto } from "@/types/buyer";

function rankLabel(rank: number) {
  if (rank === 1) return "1st";
  if (rank === 2) return "2nd";
  if (rank === 3) return "3rd";
  return `${rank}th`;
}

export function AccountWinsClient() {
  const [wins, setWins] = useState<BuyerWinDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/me/wins");
        const json = await res.json();
        if (res.ok) setWins(json.wins ?? []);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-xl font-bold">My wins</h1>
      {wins.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No wins yet. Good luck!
        </p>
      ) : (
        <div className="space-y-3">
          {wins.map((win) => (
            <div key={win.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-amber-500/15">
                  <Trophy className="size-5 text-amber-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{win.prizeName ?? "Prize"}</p>
                    <Badge variant="secondary">{rankLabel(win.rank)}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{win.eventName}</p>
                  <p className="text-xs text-muted-foreground">
                    {win.tenantName} · Ticket #{win.ticketNumber}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(win.selectedAt)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
