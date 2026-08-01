"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Filter,
  LayoutGrid,
  List,
  Loader2,
  Plus,
  Rows3,
  ScanLine,
  Table2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { TicketsAggregatedTable } from "@/components/tickets/tickets-aggregated-table";
import { groupTicketsForTable } from "@/lib/ticket-groups";
import { EventShareCapture } from "@/components/events/event-share-capture";
import { cn } from "@/lib/utils";
import { parseTicketDesignTheme } from "@/lib/ticket-designs";
import { formatMoney } from "@/lib/tickets";
import {
  MAX_SHARE_TICKET_COUNT,
  SHARE_ASPECT_RATIOS,
  TICKET_LIST_VIEW_LABELS,
  type ShareAspectRatio,
} from "@/types/ticket-designs";
import type { EventDto } from "@/types/events";
import { TICKET_STATUS_LABELS, type TicketDto } from "@/types/tickets";
import type { TicketListView, TicketStatus } from "@prisma/client";

const VIEW_ICONS: Record<TicketListView, typeof LayoutGrid> = {
  GRID: LayoutGrid,
  COMPACT: List,
  SHOWCASE: Rows3,
  TABLE: Table2,
};

const TICKET_LIST_SCROLL = "max-h-[60vh] overflow-y-auto";

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
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "ALL">("ALL");
  const [priceFilter, setPriceFilter] = useState<number | "ALL">("ALL");

  const theme = parseTicketDesignTheme(event.ticketDesign?.theme ?? {});
  const designName = event.ticketDesign?.name ?? "Classic";

  const stats = useMemo(() => {
    const counts = { AVAILABLE: 0, SOLD: 0, VALIDATED: 0, WINNER: 0, CANCELLED: 0 };
    for (const t of tickets) counts[t.status] += 1;
    return counts;
  }, [tickets]);

  const priceOptions = useMemo(
    () => [...new Set(tickets.map((t) => t.priceCents))].sort((a, b) => a - b),
    [tickets]
  );

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
      if (priceFilter !== "ALL" && t.priceCents !== priceFilter) return false;
      return true;
    });
  }, [tickets, statusFilter, priceFilter]);

  const tableGroups = useMemo(
    () =>
      groupTicketsForTable(
        filteredTickets.map((t) => ({ ...t, currencyCode: event.currencyCode })),
        event.name
      ),
    [filteredTickets, event.name, event.currencyCode]
  );

  const hasActiveFilters = statusFilter !== "ALL" || priceFilter !== "ALL";

  function clearFilters() {
    setStatusFilter("ALL");
    setPriceFilter("ALL");
  }

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

  const displayTickets = filteredTickets;

  const shareTickets = useMemo(() => {
    const source =
      displayTickets.length > 0
        ? displayTickets
        : Array.from({ length: Math.min(12, event.ticketQuantity) }, (_, i) => ({
            ticketNumber: String(i + 1).padStart(4, "0"),
            priceCents: currentPriceCents ?? 0,
          }));

    return source.slice(0, MAX_SHARE_TICKET_COUNT).map((t) => ({
      number: t.ticketNumber,
      priceCents: t.priceCents,
    }));
  }, [displayTickets, event.ticketQuantity, currentPriceCents]);

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

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
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

        {tickets.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="size-3.5 text-muted-foreground" />
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as TicketStatus | "ALL")}
            >
              <SelectTrigger size="sm" className="min-w-[130px]">
                <SelectValue placeholder="Status">
                  {statusFilter === "ALL"
                    ? "All statuses"
                    : TICKET_STATUS_LABELS[statusFilter]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                {(Object.keys(TICKET_STATUS_LABELS) as TicketStatus[]).map((status) => (
                  <SelectItem key={status} value={status}>
                    {TICKET_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={priceFilter === "ALL" ? "ALL" : String(priceFilter)}
              onValueChange={(v) => setPriceFilter(v === "ALL" ? "ALL" : Number(v))}
            >
              <SelectTrigger size="sm" className="min-w-[120px]">
                <SelectValue placeholder="Price">
                  {priceFilter === "ALL"
                    ? "All prices"
                    : formatMoney(priceFilter, event.currencyCode)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All prices</SelectItem>
                {priceOptions.map((priceCents) => (
                  <SelectItem key={priceCents} value={String(priceCents)}>
                    {formatMoney(priceCents, event.currencyCode)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasActiveFilters ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={clearFilters}
              >
                <X className="size-3.5" />
                Clear
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {hasActiveFilters && tickets.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          Showing {filteredTickets.length} of {tickets.length} tickets
        </p>
      ) : null}

      {tickets.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          No tickets yet. Add a price period above, then generate tickets.
          {currentPriceCents !== null && (
            <p className="mt-2 text-primary">
              Today&apos;s price: {formatMoney(currentPriceCents, event.currencyCode)}
            </p>
          )}
        </div>
      ) : displayTickets.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          No tickets match the current filters.
          <Button
            type="button"
            variant="link"
            className="mt-2 h-auto p-0 text-sm"
            onClick={clearFilters}
          >
            Clear filters
          </Button>
        </div>
      ) : listView === "GRID" ? (
        <div
          className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", TICKET_LIST_SCROLL)}
        >
          {displayTickets.map((t) => (
            <TicketCard
              key={t.id}
              ticket={t}
              eventName={event.name}
              theme={theme}
              currencyCode={event.currencyCode}
              onClick={() => {
                setSelected(t);
                setQrOpen(true);
              }}
            />
          ))}
        </div>
      ) : listView === "COMPACT" ? (
        <ul
          className={cn(
            "divide-y divide-border rounded-lg border border-border",
            TICKET_LIST_SCROLL
          )}
        >
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
                    {formatMoney(t.priceCents, event.currencyCode)}
                  </span>
                  <TicketStatusBadge status={t.status} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : listView === "SHOWCASE" ? (
        <div className={cn("flex gap-3 overflow-x-auto pb-2", TICKET_LIST_SCROLL)}>
          {displayTickets.slice(0, 8).map((t) => (
            <div key={t.id} className="w-[min(200px,40vw)] shrink-0">
              <TicketCard
                ticket={t}
                eventName={event.name}
                theme={theme}
                currencyCode={event.currencyCode}
                onClick={() => {
                  setSelected(t);
                  setQrOpen(true);
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className={TICKET_LIST_SCROLL}>
          <TicketsAggregatedTable
            groups={tableGroups}
            showEventColumn
            onViewGroup={(group) => {
              const firstTicket = (group.tickets ?? [])[0];
              if (!firstTicket) return;
              setSelected(firstTicket);
              setQrOpen(true);
            }}
            modifyHref={() => `/dashboard/events/${event.id}/edit`}
          />
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
            <DialogContent className="max-h-[92vh] w-[min(96vw,56rem)] max-w-[min(96vw,56rem)] overflow-y-auto overflow-x-hidden sm:max-w-[min(96vw,56rem)]">
              <DialogHeader>
                <DialogTitle>Share preview</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Full-width promo with up to {MAX_SHARE_TICKET_COUNT} tickets. Screenshot
                this view to share on social media.
              </p>
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
              <div className="w-full min-w-0">
                <EventShareCapture
                  eventName={event.name}
                  tenantName={tenantName}
                  venue={event.venue}
                  startDate={event.startDate}
                  ticketQuantity={event.ticketQuantity}
                  winnerCount={event.winnerCount}
                  bannerUrl={event.bannerUrl}
                  theme={theme}
                  aspectRatio={aspectRatio}
                  tickets={shareTickets}
                  currencyCode={event.currencyCode}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <TicketQrDialog
        ticket={selected}
        eventName={event.name}
        currencyCode={event.currencyCode}
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
