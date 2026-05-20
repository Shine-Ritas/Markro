"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMoney } from "@/lib/tickets";
import { formatDate } from "@/lib/format";
import type { TicketPricePeriodDto } from "@/types/tickets";

type EventPriceScheduleProps = {
  eventId: string;
  periods: TicketPricePeriodDto[];
  currentPriceCents: number | null;
};

export function EventPriceSchedule({
  eventId,
  periods,
  currentPriceCents,
}: EventPriceScheduleProps) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [price, setPrice] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const priceCents = Math.round(parseFloat(price) * 100);
    if (Number.isNaN(priceCents)) {
      toast.error("Enter a valid price");
      return;
    }

    const res = await fetch(`/api/events/${eventId}/price-periods`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: label || null,
        priceCents,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Failed to add period");
      return;
    }

    toast.success("Price period added");
    setAdding(false);
    setLabel("");
    setPrice("");
    setStartsAt("");
    setEndsAt("");
    router.refresh();
  }

  async function handleDelete(periodId: string) {
    if (!confirm("Remove this price period?")) return;
    const res = await fetch(`/api/events/${eventId}/price-periods/${periodId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      toast.error("Failed to delete");
      return;
    }
    toast.success("Removed");
    router.refresh();
  }

  return (
    <section className="rounded-xl border border-border bg-card/30 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-lg font-semibold">Ticket pricing</h3>
          <p className="text-sm text-muted-foreground">
            Set prices by date range (e.g. early month vs end of month). Each ticket
            stores its price when generated — no price history.
          </p>
          {currentPriceCents !== null ? (
            <p className="mt-2 text-sm">
              Current price:{" "}
              <span className="font-semibold text-primary">
                {formatMoney(currentPriceCents)}
              </span>
            </p>
          ) : (
            <p className="mt-2 text-sm text-amber-400/90">
              No active price for today — add a period before generating tickets.
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setAdding((v) => !v)}
        >
          <Plus className="size-4" />
          Add period
        </Button>
      </div>

      {periods.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {periods.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3"
            >
              <div>
                <p className="font-medium">
                  {p.label ?? "Price period"} · {formatMoney(p.priceCents)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(p.startsAt)}
                  {p.endsAt ? ` → ${formatDate(p.endsAt)}` : " → open ended"}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(p.id)}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          No price periods yet. Example: $10 from the 1st–15th, $15 from the 16th–31st.
        </p>
      )}

      {adding ? (
        <form
          onSubmit={handleAdd}
          className="mt-4 grid gap-4 border-t border-border pt-4 sm:grid-cols-2"
        >
          <div className="space-y-2">
            <Label>Label (optional)</Label>
            <Input
              placeholder="Early bird"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Price (USD)</Label>
            <Input
              type="number"
              min={0}
              step={0.01}
              placeholder="10.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Starts</Label>
            <Input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Ends (optional)</Label>
            <Input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2 flex gap-2">
            <Button type="submit">Save period</Button>
            <Button type="button" variant="outline" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
