"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { FeaturedEventCard } from "@/components/account/featured-event-card";
import { QuickLinksGrid } from "@/components/account/quick-links-grid";
import { RecentWinHighlight } from "@/components/account/recent-win-highlight";
import type { BuyerWinDto, ExploreEventDto } from "@/types/buyer";

export function AccountHomeClient() {
  const [featuredEvents, setFeaturedEvents] = useState<ExploreEventDto[]>([]);
  const [recentWin, setRecentWin] = useState<BuyerWinDto | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingWin, setLoadingWin] = useState(true);

  useEffect(() => {
    async function load() {
      setLoadingEvents(true);
      setLoadingWin(true);
      try {
        const [eventsRes, winsRes] = await Promise.all([
          fetch("/api/me/events/featured?limit=3"),
          fetch("/api/me/wins?limit=1"),
        ]);
        const eventsJson = await eventsRes.json();
        const winsJson = await winsRes.json();
        if (eventsRes.ok) setFeaturedEvents(eventsJson.events ?? []);
        if (winsRes.ok) setRecentWin(winsJson.wins?.[0] ?? null);
      } finally {
        setLoadingEvents(false);
        setLoadingWin(false);
      }
    }
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <RecentWinHighlight win={recentWin} loading={loadingWin} />

      <QuickLinksGrid />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-sm font-semibold">Featured events</h2>
          <Link
            href="/account/explore"
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Explore all events
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {loadingEvents ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : featuredEvents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-12 text-center">
            <Sparkles className="mx-auto mb-2 size-8 text-muted-foreground/40" />
            <p className="text-sm font-medium">No live events right now</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Check back soon for new lucky draws.
            </p>
            <Link
              href="/account/explore"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Browse events
              <ArrowRight className="size-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {featuredEvents.map((event) => (
              <FeaturedEventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
