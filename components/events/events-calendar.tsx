"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventStatusBadge } from "@/components/events/event-status-badge";
import { cn } from "@/lib/utils";
import type { EventListItem } from "@/types/events";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export function EventsCalendar({ events }: { events: EventListItem[] }) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));

  const { year, month, cells, eventsByDay } = useMemo(() => {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const firstDow = new Date(y, m, 1).getDay();
    const total = daysInMonth(y, m);
    const pad = Array.from({ length: firstDow }, () => null as number | null);
    const days = Array.from({ length: total }, (_, i) => i + 1);
    const cells = [...pad, ...days];

    const byDay: Record<string, EventListItem[]> = {};
    for (const ev of events) {
      const d = new Date(ev.startDate);
      if (d.getFullYear() !== y || d.getMonth() !== m) continue;
      const key = String(d.getDate());
      byDay[key] = byDay[key] ?? [];
      byDay[key].push(ev);
    }

    return { year: y, month: m, cells, eventsByDay: byDay };
  }, [cursor, events]);

  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(cursor);

  function prevMonth() {
    setCursor(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setCursor(new Date(year, month + 1, 1));
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-heading text-lg font-semibold">{monthLabel}</h3>
        <div className="flex gap-1">
          <Button type="button" variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button type="button" variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px rounded-lg border border-border bg-border overflow-hidden">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="bg-muted/30 px-2 py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {d}
          </div>
        ))}
        {cells.map((day, i) => (
          <div
            key={i}
            className={cn("min-h-[88px] bg-card p-1.5", !day && "bg-muted/10")}
          >
            {day ? (
              <>
                <span className="text-xs font-medium text-muted-foreground">{day}</span>
                <div className="mt-1 space-y-1">
                  {(eventsByDay[String(day)] ?? []).slice(0, 2).map((ev) => (
                    <Link
                      key={ev.id}
                      href={`/dashboard/events/${ev.id}`}
                      className="block truncate rounded px-1 py-0.5 text-[10px] leading-tight bg-primary/20 hover:bg-primary/30"
                      title={ev.name}
                    >
                      {ev.name}
                    </Link>
                  ))}
                  {(eventsByDay[String(day)]?.length ?? 0) > 2 ? (
                    <span className="text-[10px] text-muted-foreground">
                      +{(eventsByDay[String(day)]?.length ?? 0) - 2} more
                    </span>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {events
          .filter((e) => {
            const d = new Date(e.startDate);
            return d.getFullYear() === year && d.getMonth() === month;
          })
          .map((ev) => (
            <Link
              key={ev.id}
              href={`/dashboard/events/${ev.id}`}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:border-primary/40"
            >
              <span className="font-medium">{ev.name}</span>
              <EventStatusBadge status={ev.status} />
            </Link>
          ))}
      </div>
    </div>
  );
}
