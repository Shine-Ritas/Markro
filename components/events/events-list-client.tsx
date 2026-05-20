"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { LayoutGrid, List, CalendarDays, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventCard } from "@/components/events/event-card";
import { EventsTable } from "@/components/events/events-table";
import { EventsCalendar } from "@/components/events/events-calendar";
import type { EventListItem } from "@/types/events";

type EventsListClientProps = {
  events: EventListItem[];
  tenantSlug: string;
};

export function EventsListClient({ events, tenantSlug }: EventsListClientProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "DRAFT" | "PUBLISHED" | "ARCHIVED">(
    "all"
  );

  const filtered = events.filter((e) => {
    if (filter !== "all" && e.status !== filter) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      e.name.toLowerCase().includes(q) || (e.venue?.toLowerCase().includes(q) ?? false)
    );
  });

  async function action(id: string, path: "publish" | "archive", label: string) {
    const res = await fetch(`/api/events/${id}/${path}`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? `Failed to ${label}`);
      return;
    }
    toast.success(`Event ${label}`);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this event? This cannot be undone.")) return;
    const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Failed to delete");
      return;
    }
    toast.success("Event deleted");
    router.refresh();
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search events…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-border p-0.5">
            {(
              [
                ["all", "All"],
                ["DRAFT", "Draft"],
                ["PUBLISHED", "Published"],
                ["ARCHIVED", "Archived"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  filter === key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <Button render={<Link href="/dashboard/events/new" />}>
            <Plus className="size-4" />
            New event
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <CalendarDays className="mb-4 size-12 text-muted-foreground/40" />
          <p className="font-medium">No events yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Create your first lucky draw event to start selling tickets.
          </p>
          <Button className="mt-6" render={<Link href="/dashboard/events/new" />}>
            Create event →
          </Button>
        </div>
      ) : (
        <Tabs defaultValue="cards">
          <TabsList>
            <TabsTrigger value="cards">
              <LayoutGrid className="size-4" />
              Cards
            </TabsTrigger>
            <TabsTrigger value="table">
              <List className="size-4" />
              Table
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <CalendarDays className="size-4" />
              Calendar
            </TabsTrigger>
          </TabsList>
          <TabsContent value="cards" className="mt-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="table" className="mt-4">
            <EventsTable
              events={filtered}
              tenantSlug={tenantSlug}
              onPublish={(id) => action(id, "publish", "published")}
              onArchive={(id) => action(id, "archive", "archived")}
              onDelete={handleDelete}
            />
          </TabsContent>
          <TabsContent value="calendar" className="mt-4">
            <EventsCalendar events={filtered} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
