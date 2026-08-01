"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, Sparkles } from "lucide-react";
import { FeaturedEventCard } from "@/components/account/featured-event-card";
import { Input } from "@/components/ui/input";
import type { ExploreEventDto } from "@/types/buyer";

export function AccountExploreClient() {
  const [events, setEvents] = useState<ExploreEventDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/me/events/explore?limit=50");
        const json = await res.json();
        if (res.ok) {
          setEvents(json.events ?? []);
          setTotal(json.total ?? 0);
        }
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return events;
    return events.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.tenantName.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q)
    );
  }, [events, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-xl font-bold">Explore events</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse live lucky draws from organizers near you.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search events or organizers…"
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <Sparkles className="mx-auto mb-2 size-8 text-muted-foreground/40" />
          <p className="text-sm font-medium">
            {search ? "No events match your search" : "No live events right now"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {search ? "Try a different keyword." : "Check back soon for new draws."}
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            Showing {filtered.length} of {total} published event{total !== 1 ? "s" : ""}
          </p>
          <div className="space-y-4">
            {filtered.map((event) => (
              <FeaturedEventCard key={event.id} event={event} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
