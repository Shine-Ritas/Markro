"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import type { BuyerWinDto } from "@/types/buyer";

type RecentWinHighlightProps = {
  win: BuyerWinDto | null;
  loading?: boolean;
};

function rankLabel(rank: number) {
  if (rank === 1) return "1st";
  if (rank === 2) return "2nd";
  if (rank === 3) return "3rd";
  return `${rank}th`;
}

export function RecentWinHighlight({ win, loading }: RecentWinHighlightProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-sm font-semibold">Recent win</h2>
        {win ? (
          <Link
            href="/account/wins"
            className="text-xs font-medium text-primary hover:underline"
          >
            View all
          </Link>
        ) : null}
      </div>

      {loading ? (
        <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          Loading…
        </div>
      ) : win ? (
        <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-card p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
              <Trophy className="size-5 text-amber-600" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{win.prizeName ?? "Prize"}</p>
                <Badge variant="secondary">{rankLabel(win.rank)}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{win.eventName}</p>
              <p className="text-xs text-muted-foreground">
                {win.tenantName} · Ticket #{win.ticketNumber}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDateTime(win.selectedAt)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center">
          <Sparkles className="mx-auto mb-2 size-8 text-muted-foreground/40" />
          <p className="text-sm font-medium">No wins yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Explore live events and try your luck!
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            render={<Link href="/account/explore" />}
          >
            Explore events
            <ArrowRight className="size-4" />
          </Button>
        </div>
      )}
    </section>
  );
}
