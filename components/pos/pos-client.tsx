"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShoppingCart, User } from "lucide-react";
import { toast } from "sonner";
import { PosReceiptDialog } from "@/components/pos/pos-receipt-dialog";
import { PosTicketPicker } from "@/components/pos/pos-ticket-picker";
import {
  CustomerSearchSelect,
  type PosCustomerOption,
} from "@/components/customers/customer-search-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMoney } from "@/lib/tickets";
import { cn } from "@/lib/utils";
import type { PosAvailableTicket, PosEventOption, PosSaleDto } from "@/types/pos";

type PosClientProps = {
  staffName: string;
  initialEvents: PosEventOption[];
  initialDrafts: PosSaleDto[];
};

export function PosClient({ staffName, initialEvents, initialDrafts }: PosClientProps) {
  const router = useRouter();
  const [events, setEvents] = useState(initialEvents);
  const [drafts, setDrafts] = useState(initialDrafts);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(
    initialEvents[0]?.id ?? null
  );
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [selectedTickets, setSelectedTickets] = useState<PosAvailableTicket[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<PosCustomerOption | null>(
    null
  );
  const [manualCustomer, setManualCustomer] = useState(false);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<PosSaleDto | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [ticketPickerRefreshKey, setTicketPickerRefreshKey] = useState(0);

  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId) ?? null,
    [events, selectedEventId]
  );

  const estimatedTotal = useMemo(
    () => selectedTickets.reduce((sum, t) => sum + t.priceCents, 0),
    [selectedTickets]
  );

  const canComplete =
    selectedTicketIds.length > 0 &&
    customerName.trim().length > 0 &&
    customerPhone.trim().length > 0 &&
    !selectedCustomer?.isBlacklisted;

  async function refreshData() {
    const [eventsRes, draftsRes] = await Promise.all([
      fetch("/api/pos/events"),
      fetch("/api/pos/sales"),
    ]);

    if (eventsRes.ok) {
      const data = await eventsRes.json();
      setEvents(data.events);
    }
    if (draftsRes.ok) {
      const data = await draftsRes.json();
      setDrafts(data.drafts);
    }
    router.refresh();
  }

  function handleTicketSelection(ids: string[], tickets: PosAvailableTicket[]) {
    setSelectedTicketIds(ids);
    setSelectedTickets(tickets);
  }

  function loadDraft(draft: PosSaleDto) {
    setActiveDraftId(draft.id);
    setSelectedEventId(draft.eventId);
    setSelectedTicketIds(draft.lines.map((line) => line.ticketId));
    setSelectedTickets(
      draft.lines.map((line) => ({
        id: line.ticketId,
        ticketNumber: line.ticketNumber,
        priceCents: line.priceCents,
      }))
    );
    setCustomerName(draft.customerName ?? "");
    setCustomerPhone(draft.customerPhone ?? "");
    setCustomerEmail(draft.customerEmail ?? "");
    setSelectedCustomer(null);
    setManualCustomer(Boolean(draft.customerName || draft.customerPhone));
  }

  function selectCustomer(customer: PosCustomerOption | null) {
    setSelectedCustomer(customer);
    if (customer) {
      setCustomerName(customer.displayName);
      setCustomerPhone(customer.phone);
      setCustomerEmail(customer.email ?? "");
      setManualCustomer(false);
    }
  }

  function resetCart() {
    setActiveDraftId(null);
    setSelectedTicketIds([]);
    setSelectedTickets([]);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setSelectedCustomer(null);
    setManualCustomer(false);
  }

  function selectEvent(eventId: string) {
    if (eventId === selectedEventId) return;
    setSelectedEventId(eventId);
    setSelectedTicketIds([]);
    setSelectedTickets([]);
    if (activeDraftId) setActiveDraftId(null);
  }

  function buildPayload() {
    return {
      eventId: selectedEventId!,
      ticketIds: selectedTicketIds,
      customerName: customerName.trim() || null,
      customerPhone: customerPhone.trim() || null,
      customerEmail: customerEmail.trim() || null,
    };
  }

  async function saveDraft() {
    if (!selectedEventId) {
      toast.error("Select an event");
      return;
    }
    if (selectedTicketIds.length === 0) {
      toast.error("Select at least one ticket number");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(
        activeDraftId ? `/api/pos/sales/${activeDraftId}` : "/api/pos/sales",
        {
          method: activeDraftId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildPayload()),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(
          typeof data.error === "string" ? data.error : "Failed to save draft"
        );
        return;
      }

      setActiveDraftId(data.sale.id);
      toast.success("Draft saved");
      await refreshData();
    } finally {
      setBusy(false);
    }
  }

  async function completeSale() {
    if (!selectedEventId) {
      toast.error("Select an event");
      return;
    }
    if (selectedTicketIds.length === 0) {
      toast.error("Select at least one ticket number");
      return;
    }
    if (!customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (!customerPhone.trim()) {
      toast.error("Customer phone is required");
      return;
    }
    if (selectedCustomer?.isBlacklisted) {
      toast.error("This customer is blacklisted and cannot purchase tickets");
      return;
    }

    setBusy(true);
    try {
      let saleId = activeDraftId;

      if (!saleId) {
        const createRes = await fetch("/api/pos/sales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildPayload()),
        });
        const createData = await createRes.json();
        if (!createRes.ok) {
          toast.error(
            typeof createData.error === "string"
              ? createData.error
              : "Failed to start sale"
          );
          return;
        }
        saleId = createData.sale.id;
      } else {
        const patchRes = await fetch(`/api/pos/sales/${saleId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildPayload()),
        });
        if (!patchRes.ok) {
          const patchData = await patchRes.json();
          toast.error(
            typeof patchData.error === "string"
              ? patchData.error
              : "Failed to update draft"
          );
          return;
        }
      }

      const completeRes = await fetch(`/api/pos/sales/${saleId}/complete`, {
        method: "POST",
      });
      const completeData = await completeRes.json();
      if (!completeRes.ok) {
        toast.error(
          typeof completeData.error === "string"
            ? completeData.error
            : "Failed to complete sale"
        );
        return;
      }

      toast.success("Sale completed");
      setReceipt(completeData.sale);
      setReceiptOpen(true);
      resetCart();
      setTicketPickerRefreshKey((k) => k + 1);
      await refreshData();
    } finally {
      setBusy(false);
    }
  }

  async function cancelDraft(draftId: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/pos/sales/${draftId}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Failed to cancel draft");
        return;
      }
      if (activeDraftId === draftId) resetCart();
      toast.success("Draft cancelled");
      await refreshData();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Pick lucky ticket numbers for the customer, then complete the sale.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/sales"
            className="text-sm text-primary hover:underline"
          >
            View all sales →
          </Link>
          <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-sm">
            <User className="size-4 text-primary" />
            <span className="text-muted-foreground">Staff:</span>
            <span className="font-medium">{staffName}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <section className="space-y-4">
          <h2 className="font-heading text-lg font-semibold">Events</h2>
          {events.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
              No published events with tickets. Publish an event first.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {events.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => selectEvent(event.id)}
                  className={cn(
                    "rounded-xl border p-4 text-left transition-colors",
                    selectedEventId === event.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card/40 hover:bg-muted/30"
                  )}
                >
                  <p className="font-medium">{event.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {event.venue ?? "No venue"} · {event.availableCount} available
                  </p>
                  <p className="mt-2 text-sm text-primary">
                    {event.currentPriceCents !== null
                      ? formatMoney(event.currentPriceCents, event.currencyCode)
                      : "Varies by ticket"}
                    <span className="text-muted-foreground"> / ticket</span>
                  </p>
                </button>
              ))}
            </div>
          )}

          {selectedEvent ? (
            <div className="rounded-xl border border-border bg-card/40 p-4">
              <h3 className="font-heading font-semibold">Pick ticket numbers</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {selectedEvent.name} · {selectedEvent.availableCount} available
              </p>
              <div className="mt-4">
                <PosTicketPicker
                  key={selectedEvent.id}
                  eventId={selectedEvent.id}
                  selectedIds={selectedTicketIds}
                  onChange={handleTicketSelection}
                  disabled={busy}
                  refreshKey={ticketPickerRefreshKey}
                />
              </div>
            </div>
          ) : null}

          {drafts.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Draft sales</h3>
              <ul className="divide-y divide-border rounded-xl border border-border">
                {drafts.map((draft) => (
                  <li
                    key={draft.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{draft.eventName}</p>
                      <p className="text-xs text-muted-foreground">
                        {draft.lines.length > 0
                          ? draft.lines.map((l) => `#${l.ticketNumber}`).join(", ")
                          : `${draft.quantity} tickets`}
                        {draft.customerName ? ` · ${draft.customerName}` : ""}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => loadDraft(draft)}
                      >
                        Resume
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => cancelDraft(draft.id)}
                        disabled={busy}
                      >
                        Cancel
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <aside className="h-fit space-y-4 rounded-xl border border-border bg-card/50 p-5 xl:sticky xl:top-4">
          <h2 className="font-heading text-lg font-semibold">Cart</h2>

          {selectedEvent ? (
            <>
              <div className="rounded-lg bg-muted/30 p-3 text-sm">
                <p className="font-medium">{selectedEvent.name}</p>
                <p className="text-muted-foreground">
                  {selectedTicketIds.length} ticket
                  {selectedTicketIds.length === 1 ? "" : "s"} selected
                </p>
              </div>

              {selectedTickets.length > 0 ? (
                <ul className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-border px-3 py-2 font-mono text-sm">
                  {selectedTickets.map((ticket) => (
                    <li key={ticket.id} className="flex justify-between">
                      <span>#{ticket.ticketNumber}</span>
                      <span className="text-muted-foreground">
                        {formatMoney(ticket.priceCents, selectedEvent?.currencyCode)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Select ticket numbers from the grid.
                </p>
              )}

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Customer</Label>
                  <CustomerSearchSelect
                    value={selectedCustomer}
                    onChange={selectCustomer}
                    onManualChange={() => setManualCustomer(true)}
                  />
                </div>

                {selectedCustomer?.isBlacklisted ? (
                  <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    This customer is blacklisted and cannot complete a sale.
                  </p>
                ) : null}

                {manualCustomer || !selectedCustomer ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="pos-customer-name">
                        Customer name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="pos-customer-name"
                        value={customerName}
                        onChange={(e) => {
                          setCustomerName(e.target.value);
                          setSelectedCustomer(null);
                        }}
                        placeholder="Required"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pos-customer-phone">
                        Phone <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="pos-customer-phone"
                        value={customerPhone}
                        onChange={(e) => {
                          setCustomerPhone(e.target.value);
                          setSelectedCustomer(null);
                        }}
                        placeholder="Required"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pos-customer-email">Email</Label>
                      <Input
                        id="pos-customer-email"
                        type="email"
                        value={customerEmail}
                        onChange={(e) => {
                          setCustomerEmail(e.target.value);
                          setSelectedCustomer(null);
                        }}
                        placeholder="Optional"
                      />
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
                    <p className="font-medium">{selectedCustomer.displayName}</p>
                    <p className="text-muted-foreground">{selectedCustomer.phone}</p>
                    {selectedCustomer.email ? (
                      <p className="text-muted-foreground">{selectedCustomer.email}</p>
                    ) : null}
                    {selectedCustomer.loyaltyPoints > 0 ? (
                      <p className="mt-1 text-xs text-primary">
                        {selectedCustomer.loyaltyPoints} loyalty points
                      </p>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-border pt-4 text-lg font-semibold">
                <span>Total</span>
                <span className="text-primary">
                  {formatMoney(estimatedTotal, selectedEvent?.currencyCode)}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={saveDraft}
                  disabled={busy || selectedTicketIds.length === 0}
                >
                  {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                  Save draft
                </Button>
                <Button
                  type="button"
                  className="h-11 text-base"
                  onClick={completeSale}
                  disabled={busy || !canComplete}
                >
                  {busy ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ShoppingCart className="size-4" />
                  )}
                  Complete sale
                </Button>
              </div>

              {activeDraftId ? (
                <p className="text-center text-xs text-muted-foreground">
                  Editing draft · ID {activeDraftId.slice(0, 8)}…
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Select a published event to start selling tickets.
            </p>
          )}
        </aside>
      </div>

      <PosReceiptDialog
        sale={receipt}
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
      />
    </div>
  );
}
