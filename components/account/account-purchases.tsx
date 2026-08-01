"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { formatMoney } from "@/lib/tickets";
import { formatDateTime } from "@/lib/format";
import type { BuyerPurchaseDto } from "@/types/buyer";

export function AccountPurchasesClient() {
  const [purchases, setPurchases] = useState<BuyerPurchaseDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/me/purchases");
        const json = await res.json();
        if (res.ok) setPurchases(json.purchases ?? []);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const grouped = purchases.reduce<Record<string, BuyerPurchaseDto[]>>((acc, p) => {
    if (!acc[p.tenantName]) acc[p.tenantName] = [];
    acc[p.tenantName].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-xl font-bold">My purchases</h1>
      {purchases.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No purchases found yet.
        </p>
      ) : (
        Object.entries(grouped).map(([org, items]) => (
          <section key={org} className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground">{org}</h2>
            {items.map((purchase) => (
              <div
                key={purchase.id}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{purchase.eventName}</p>
                    <p className="text-xs text-muted-foreground">
                      {purchase.receiptNumber
                        ? `Receipt ${purchase.receiptNumber}`
                        : "POS sale"}
                      {purchase.completedAt
                        ? ` · ${formatDateTime(purchase.completedAt)}`
                        : ""}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Tickets: {purchase.ticketNumbers.map((n) => `#${n}`).join(", ")}
                    </p>
                  </div>
                  <p className="font-semibold">{formatMoney(purchase.totalCents)}</p>
                </div>
              </div>
            ))}
          </section>
        ))
      )}
    </div>
  );
}
