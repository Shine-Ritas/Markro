"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gift, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PrizeSearchSelect } from "@/components/prizes/prize-search-select";
import type { EventPrizeDto, PrizeDto } from "@/types/prizes";
import type { EventDto } from "@/types/events";

type EventPrizesSectionProps = {
  event: EventDto;
  catalog: PrizeDto[];
  initialAssigned: EventPrizeDto[];
};

function rankLabel(rank: number) {
  if (rank === 1) return "1st";
  if (rank === 2) return "2nd";
  if (rank === 3) return "3rd";
  return `${rank}th`;
}

export function EventPrizesSection({
  event,
  catalog,
  initialAssigned,
}: EventPrizesSectionProps) {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Record<number, string>>(() => {
    const map: Record<number, string> = {};
    for (const row of initialAssigned) {
      map[row.rank] = row.prizeId;
    }
    return map;
  });
  const [saving, setSaving] = useState(false);

  const filledCount = Object.values(assignments).filter(Boolean).length;
  const complete = filledCount === event.winnerCount;
  const readOnly = event.status === "COMPLETED" || event.status === "ARCHIVED";

  async function handleSave() {
    if (!complete) {
      toast.error(`Assign all ${event.winnerCount} prizes`);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        assignments: Array.from({ length: event.winnerCount }, (_, i) => ({
          rank: i + 1,
          prizeId: assignments[i + 1],
        })),
      };

      const res = await fetch(`/api/events/${event.id}/prizes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to save prizes");
        return;
      }
      toast.success("Event prizes saved");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (catalog.length === 0 && initialAssigned.length === 0) {
    return (
      <section className="rounded-xl border border-dashed border-border bg-card/30 p-5">
        <h3 className="flex items-center gap-2 font-heading font-semibold">
          <Gift className="size-4 text-primary" />
          Prize assignment
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Add prizes to your catalog first, then assign {event.winnerCount} prize
          {event.winnerCount !== 1 ? "s" : ""} for this event.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-xl border border-border bg-card/30 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-2 font-heading font-semibold">
            <Gift className="size-4 text-primary" />
            Prize assignment
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Assign one catalog prize per winner rank before running the draw.
          </p>
        </div>
        <Badge variant={complete ? "default" : "outline"}>
          {filledCount} / {event.winnerCount} assigned
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: event.winnerCount }, (_, i) => {
          const rank = i + 1;
          const assigned = initialAssigned.find((a) => a.rank === rank);
          return (
            <div key={rank} className="space-y-1.5 rounded-lg border border-border p-3">
              <Label>{rankLabel(rank)} prize</Label>
              {readOnly ? (
                <p className="text-sm font-medium">{assigned?.prize.name ?? "—"}</p>
              ) : (
                <PrizeSearchSelect
                  prizes={catalog}
                  value={assignments[rank] ?? ""}
                  onChange={(prizeId) =>
                    setAssignments((prev) => ({ ...prev, [rank]: prizeId }))
                  }
                  excludeIds={Object.entries(assignments)
                    .filter(([r, id]) => Number(r) !== rank && Boolean(id))
                    .map(([, id]) => id)}
                  placeholder="Select prize"
                />
              )}
            </div>
          );
        })}
      </div>

      {!readOnly ? (
        <Button onClick={handleSave} disabled={saving || !complete}>
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Save prize assignments
        </Button>
      ) : null}
    </section>
  );
}
