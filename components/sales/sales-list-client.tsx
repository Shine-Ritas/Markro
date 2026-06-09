"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Receipt, Search, ShoppingCart } from "lucide-react";
import { PosReceiptDialog } from "@/components/pos/pos-receipt-dialog";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { formatMoney } from "@/lib/tickets";
import type {
  PosEventFilterOption,
  PosSaleDto,
  PosSalesHistoryResult,
} from "@/types/pos";

type DatePreset = "today" | "7d" | "all" | "custom";

type DateRange = { from?: string; to?: string };

type SalesListClientProps = {
  initialData: PosSalesHistoryResult;
  eventOptions: PosEventFilterOption[];
};

function startOfDayIso(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function endOfDayIso(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

function parseDateInput(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function dateRangeForPreset(
  preset: DatePreset,
  customFrom: string,
  customTo: string
): DateRange {
  if (preset === "all") return {};
  if (preset === "today") {
    return { from: startOfDayIso(new Date()) };
  }
  if (preset === "7d") {
    const from = new Date();
    from.setDate(from.getDate() - 7);
    return { from: startOfDayIso(from) };
  }

  const fromDate = customFrom ? parseDateInput(customFrom) : null;
  const toDate = customTo ? parseDateInput(customTo) : null;

  return {
    ...(fromDate ? { from: startOfDayIso(fromDate) } : {}),
    ...(toDate ? { to: endOfDayIso(toDate) } : {}),
  };
}

function buildHistoryUrl(options: {
  eventId?: string;
  preset: DatePreset;
  customFrom: string;
  customTo: string;
  q?: string;
}) {
  const params = new URLSearchParams();
  const range = dateRangeForPreset(
    options.preset,
    options.customFrom,
    options.customTo
  );

  if (options.eventId) params.set("eventId", options.eventId);
  if (range.from) params.set("from", range.from);
  if (range.to) params.set("to", range.to);
  if (options.q?.trim()) params.set("q", options.q.trim());

  const query = params.toString();
  return query ? `/api/pos/sales/history?${query}` : "/api/pos/sales/history";
}

export function SalesListClient({ initialData, eventOptions }: SalesListClientProps) {
  const [data, setData] = useState(initialData);
  const [preset, setPreset] = useState<DatePreset>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [eventId, setEventId] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [receiptSale, setReceiptSale] = useState<PosSaleDto | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  const fetchSales = useCallback(
    async (options: {
      eventId: string;
      preset: DatePreset;
      customFrom: string;
      customTo: string;
      q: string;
    }) => {
      setLoading(true);
      try {
        const res = await fetch(
          buildHistoryUrl({
            eventId: options.eventId || undefined,
            preset: options.preset,
            customFrom: options.customFrom,
            customTo: options.customTo,
            q: options.q || undefined,
          })
        );
        const json = (await res.json()) as PosSalesHistoryResult & { error?: string };
        if (!res.ok) {
          console.error(json.error ?? "Failed to load sales");
          return;
        }
        setData(json);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const customRangeInvalid = useMemo(() => {
    if (preset !== "custom" || !customFrom || !customTo) return false;
    return customFrom > customTo;
  }, [preset, customFrom, customTo]);

  useEffect(() => {
    if (customRangeInvalid) return;
    void fetchSales({ eventId, preset, customFrom, customTo, q: appliedQuery });
  }, [
    eventId,
    preset,
    customFrom,
    customTo,
    appliedQuery,
    customRangeInvalid,
    fetchSales,
  ]);

  const hasActiveFilters =
    preset !== "all" || eventId !== "" || appliedQuery.trim().length > 0;

  const summaryRevenue = useMemo(
    () => formatMoney(data.summary.revenueCents),
    [data.summary.revenueCents]
  );

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAppliedQuery(searchInput);
  }

  async function openReceipt(saleId: string) {
    const res = await fetch(`/api/pos/sales/${saleId}`);
    const json = (await res.json()) as { sale?: PosSaleDto; error?: string };
    if (!res.ok || !json.sale) {
      console.error(json.error ?? "Failed to load receipt");
      return;
    }
    setReceiptSale(json.sale);
    setReceiptOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <form className="relative max-w-md flex-1" onSubmit={handleSearchSubmit}>
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search receipt, customer, phone…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>
        <Link
          href="/dashboard/pos"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ShoppingCart className="size-4" />
          Open POS
        </Link>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-border p-0.5">
            {(
              [
                ["today", "Today"],
                ["7d", "7 days"],
                ["all", "All time"],
                ["custom", "Date range"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  preset === value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setPreset(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <select
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
          >
            <option value="">All events</option>
            {eventOptions.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
        </div>

        {preset === "custom" ? (
          <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-muted/20 p-3">
            <div className="space-y-1.5">
              <Label htmlFor="sales-from" className="text-xs text-muted-foreground">
                From
              </Label>
              <Input
                id="sales-from"
                type="date"
                className="h-9 w-[min(100%,11rem)]"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sales-to" className="text-xs text-muted-foreground">
                To
              </Label>
              <Input
                id="sales-to"
                type="date"
                className="h-9 w-[min(100%,11rem)]"
                value={customTo}
                min={customFrom || undefined}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </div>
            {customRangeInvalid ? (
              <p className="text-xs text-destructive">
                End date must be on or after start date.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Sales"
          value={String(data.summary.saleCount)}
          subtext={loading ? "Updating…" : "Matching filters"}
          icon={Receipt}
        />
        <StatCard
          label="Tickets sold"
          value={String(data.summary.ticketCount)}
          subtext="Across completed sales"
          icon={ShoppingCart}
        />
        <StatCard
          label="Revenue"
          value={summaryRevenue}
          subtext="Total for current filters"
          icon={Receipt}
        />
      </div>

      {data.sales.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <p className="font-medium">
            {hasActiveFilters
              ? "No sales match your filters"
              : "No completed sales yet"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasActiveFilters
              ? "Try a wider date range or clear your search."
              : "Complete a sale in POS to see it here."}
          </p>
          {!hasActiveFilters ? (
            <Link
              href="/dashboard/pos"
              className="mt-4 inline-block text-sm text-primary hover:underline"
            >
              Go to POS →
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Tickets</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-mono text-xs">
                    {sale.receiptNumber ?? "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {sale.completedAt ? formatDateTime(sale.completedAt) : "—"}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/dashboard/events/${sale.eventId}`}
                      className="font-medium hover:text-primary"
                    >
                      {sale.eventName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p>{sale.customerName ?? "—"}</p>
                      {sale.customerPhone ? (
                        <p className="text-xs text-muted-foreground">
                          {sale.customerPhone}
                        </p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {sale.quantity}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatMoney(sale.totalCents, sale.currencyCode)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {sale.actorName ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => void openReceipt(sale.id)}
                    >
                      <Eye className="size-3.5" />
                      View receipt
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <PosReceiptDialog
        sale={receiptSale}
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
      />
    </div>
  );
}
