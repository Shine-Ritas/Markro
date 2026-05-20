"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  LayoutGrid,
  List,
  Loader2,
  Plus,
  Rows3,
  ScanLine,
  Table2,
} from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TicketCard } from "@/components/tickets/ticket-card";
import { TicketQrDialog } from "@/components/tickets/ticket-qr-dialog";
import { TicketStatusBadge } from "@/components/tickets/ticket-status-badge";
import { EventShareCapture } from "@/components/events/event-share-capture";
import { cn } from "@/lib/utils";
import { parseTicketDesignTheme } from "@/lib/ticket-designs";
import { formatMoney } from "@/lib/tickets";
import {
  SHARE_ASPECT_RATIOS,
  TICKET_LIST_VIEW_LABELS,
  type ShareAspectRatio,
} from "@/types/ticket-designs";
import type { EventDto } from "@/types/events";
import type { TicketDto } from "@/types/tickets";
import type { TicketListView } from "@prisma/client";

const VIEW_ICONS: Record<TicketListView, typeof LayoutGrid> = {
  GRID: LayoutGrid,
  COMPACT: List,
  SHOWCASE: Rows3,
  TABLE: Table2,
};

type EventTicketsManagerProps = {
  event: EventDto;
  tenantName: string;
  initialTickets: TicketDto[];
  currentPriceCents: number | null;
};

export function EventTicketsManager({
  event,
  tenantName,
  initialTickets,
  currentPriceCents,
}: EventTicketsManagerProps) {
  const router = useRouter();
  const [tickets, setTickets] = useState(initialTickets);
  const [listView, setListView] = useState<TicketListView>(event.ticketListViewDefault);
  const [selected, setSelected] = useState<TicketDto | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [generateCount, setGenerateCount] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [validateToken, setValidateToken] = useState("");
  const [validating, setValidating] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<ShareAspectRatio>("4:5");
  const [exporting, setExporting] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  const theme = parseTicketDesignTheme(event.ticketDesign?.theme ?? {});
  const designName = event.ticketDesign?.name ?? "Classic";

  const stats = useMemo(() => {
    const counts = { AVAILABLE: 0, SOLD: 0, VALIDATED: 0, CANCELLED: 0 };
    for (const t of tickets) counts[t.status] += 1;
    return counts;
  }, [tickets]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/events/${event.id}/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: generateCount }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Generation failed");
        return;
      }
      toast.success(`Generated ${data.tickets.length} tickets`);
      setTickets((prev) =>
        [...prev, ...data.tickets].sort((a, b) =>
          a.ticketNumber.localeCompare(b.ticketNumber)
        )
      );
      router.refresh();
    } finally {
      setGenerating(false);
    }
  }

  async function handleValidate() {
    if (!validateToken.trim()) return;
    setValidating(true);
    try {
      const res = await fetch("/api/tickets/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrToken: validateToken.trim() }),
      });
      const data = await res.json();
      if (data.valid) {
        toast.success(data.message);
        setTickets((prev) =>
          prev.map((t) =>
            t.qrToken === validateToken.trim()
              ? { ...t, status: "VALIDATED" as const }
              : t
          )
        );
      } else {
        toast.error(data.message);
      }
      router.refresh();
    } finally {
      setValidating(false);
    }
  }

  async function handleTakePhoto() {
    const node = captureRef.current?.querySelector("#event-share-capture");
    if (!node || !(node instanceof HTMLElement)) {
      toast.error("Capture area not ready");
      return;
    }
    setExporting(true);
    try {
      const ratio = SHARE_ASPECT_RATIOS.find((r) => r.id === aspectRatio)!;
      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#0f0f14",
      });
      const link = document.createElement("a");
      link.download = `${event.slug}-tickets-${aspectRatio.replace(":", "x")}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Image downloaded");
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  }

  const displayTickets = tickets.length > 0 ? tickets : [];

  const shareNumbers = displayTickets.slice(0, 6).map((t) => t.ticketNumber);

  return (
    <section className="space-y-4 rounded-xl border border-border bg-card/30 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="font-heading text-lg font-semibold">Tickets</h3>
          <p className="text-sm text-muted-foreground">
            {tickets.length} / {event.ticketQuantity} generated · Design: {designName}
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span>Available {stats.AVAILABLE}</span>
            <span>Sold {stats.SOLD}</span>
            <span>Validated {stats.VALIDATED}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={500}
              className="w-20"
              value={generateCount}
              onChange={(e) => setGenerateCount(Number(e.target.value))}
            />
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Generate
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(TICKET_LIST_VIEW_LABELS) as TicketListView[]).map((view) => {
          const Icon = VIEW_ICONS[view];
          return (
            <button
              key={view}
              type="button"
              onClick={() => setListView(view)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium",
                listView === view
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground"
              )}
            >
              <Icon className="size-3.5" />
              {TICKET_LIST_VIEW_LABELS[view]}
            </button>
          );
        })}
      </div>

      {displayTickets.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          No tickets yet. Add a price period above, then generate tickets.
          {currentPriceCents !== null && (
            <p className="mt-2 text-primary">
              Today&apos;s price: {formatMoney(currentPriceCents)}
            </p>
          )}
        </div>
      ) : listView === "GRID" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {displayTickets.map((t) => (
            <TicketCard
              key={t.id}
              ticket={t}
              eventName={event.name}
              theme={theme}
              onClick={() => {
                setSelected(t);
                setQrOpen(true);
              }}
            />
          ))}
        </div>
      ) : listView === "COMPACT" ? (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {displayTickets.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-muted/30"
                onClick={() => {
                  setSelected(t);
                  setQrOpen(true);
                }}
              >
                <span className="font-mono">{t.ticketNumber}</span>
                <span className="flex items-center gap-2">
                  <span className="text-sm text-primary">
                    {formatMoney(t.priceCents)}
                  </span>
                  <TicketStatusBadge status={t.status} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : listView === "SHOWCASE" ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {displayTickets.slice(0, 8).map((t) => (
            <div key={t.id} className="w-[min(200px,40vw)] shrink-0">
              <TicketCard
                ticket={t}
                eventName={event.name}
                theme={theme}
                onClick={() => {
                  setSelected(t);
                  setQrOpen(true);
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-muted-foreground">
                <th className="px-4 py-2">#</th>
                <th className="px-4 py-2">Price</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {displayTickets.map((t) => (
                <tr
                  key={t.id}
                  className="cursor-pointer border-b border-border/60 hover:bg-muted/20"
                  onClick={() => {
                    setSelected(t);
                    setQrOpen(true);
                  }}
                >
                  <td className="px-4 py-2 font-mono">{t.ticketNumber}</td>
                  <td className="px-4 py-2">{formatMoney(t.priceCents)}</td>
                  <td className="px-4 py-2">
                    <TicketStatusBadge status={t.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <ScanLine className="size-4" />
            Validate QR token
          </Label>
          <div className="flex gap-2">
            <Input
              placeholder="Paste qr token"
              value={validateToken}
              onChange={(e) => setValidateToken(e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleValidate}
              disabled={validating}
            >
              Scan
            </Button>
          </div>
        </div>

        <div className="flex items-end justify-end">
          <Dialog>
            <DialogTrigger
              render={
                <Button type="button">
                  <Camera className="size-4" />
                  Take photo
                </Button>
              }
            />
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Share ticket list</DialogTitle>
              </DialogHeader>
              <div className="flex flex-wrap gap-2">
                {SHARE_ASPECT_RATIOS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setAspectRatio(r.id)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs",
                      aspectRatio === r.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border"
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <div
                ref={captureRef}
                className="flex justify-center overflow-auto rounded-lg border border-dashed p-4"
              >
                <EventShareCapture
                  eventName={event.name}
                  tenantName={tenantName}
                  venue={event.venue}
                  startDate={event.startDate}
                  ticketQuantity={event.ticketQuantity}
                  winnerCount={event.winnerCount}
                  bannerUrl={event.bannerUrl}
                  designName={designName}
                  theme={theme}
                  listView={listView}
                  aspectRatio={aspectRatio}
                  mockTicketNumbers={
                    shareNumbers.length > 0 ? shareNumbers : ["0001", "0002", "0003"]
                  }
                  ticketPrices={displayTickets.slice(0, 6).map((t) => t.priceCents)}
                />
              </div>
              <Button onClick={handleTakePhoto} disabled={exporting}>
                {exporting ? "Exporting…" : "Download PNG"}
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <TicketQrDialog
        ticket={selected}
        eventName={event.name}
        open={qrOpen}
        onOpenChange={setQrOpen}
        onTicketUpdated={(t) => {
          setTickets((prev) => prev.map((x) => (x.id === t.id ? t : x)));
          setSelected(t);
        }}
      />
    </section>
  );
}
