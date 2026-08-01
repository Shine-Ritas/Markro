"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, RefreshCw, Search, UserCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  CUSTOMER_SOURCE_LABELS,
  type CustomerListItem,
  type CustomerListResult,
  type GlobalUserLookupResult,
} from "@/types/customers";
import { GlobalUserSearch } from "@/components/customers/global-user-search";

type CustomersListClientProps = {
  initialData: CustomerListResult;
};

type FormState = {
  displayName: string;
  phone: string;
  email: string;
};

const emptyForm: FormState = { displayName: "", phone: "", email: "" };

export function CustomersListClient({ initialData }: CustomersListClientProps) {
  const [data, setData] = useState(initialData);
  const [searchInput, setSearchInput] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [blacklistedOnly, setBlacklistedOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [linkedUser, setLinkedUser] = useState<GlobalUserLookupResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [backfilling, setBackfilling] = useState(false);

  const fetchCustomers = useCallback(
    async (opts: { q: string; blacklisted: boolean }) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (opts.q) params.set("q", opts.q);
        if (opts.blacklisted) params.set("blacklisted", "true");
        const res = await fetch(`/api/customers?${params.toString()}`);
        const json = await res.json();
        if (res.ok) setData(json);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchCustomers({ q: appliedQuery, blacklisted: blacklistedOnly });
  }, [appliedQuery, blacklistedOnly, fetchCustomers]);

  async function handleCreate() {
    setSaving(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: form.displayName,
          phone: form.phone,
          email: form.email || null,
          source: "MANUAL",
          userId: linkedUser?.id ?? null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        const message =
          res.status === 403
            ? "You don't have permission to create customers. Refresh the page and try again."
            : (json.error ?? "Failed to create customer");
        toast.error(message);
        return;
      }
      toast.success("Customer created");
      setOpen(false);
      setForm(emptyForm);
      setLinkedUser(null);
      fetchCustomers({ q: appliedQuery, blacklisted: blacklistedOnly });
    } finally {
      setSaving(false);
    }
  }

  async function handleBackfill() {
    setBackfilling(true);
    try {
      const res = await fetch("/api/customers", { method: "PUT" });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Backfill failed");
        return;
      }
      toast.success(
        `Linked ${json.linked} sales (${json.created} new customers), ${json.winnersLinked} winners`
      );
      fetchCustomers({ q: appliedQuery, blacklisted: blacklistedOnly });
    } finally {
      setBackfilling(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
          <div className="space-y-2 sm:min-w-[240px] sm:flex-1">
            <Label htmlFor="customer-search">Search</Label>
            <div className="flex gap-2">
              <Input
                id="customer-search"
                placeholder="Name, phone, email, referral code"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setAppliedQuery(searchInput);
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setAppliedQuery(searchInput)}
                disabled={loading}
              >
                <Search className="size-4" />
              </Button>
            </div>
          </div>
          <Button
            type="button"
            variant={blacklistedOnly ? "default" : "outline"}
            onClick={() => setBlacklistedOnly((v) => !v)}
          >
            Blacklisted only
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleBackfill}
            disabled={backfilling}
          >
            {backfilling ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Backfill from sales
          </Button>
          <Button type="button" onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            Add customer
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Loyalty</TableHead>
              <TableHead>Purchases</TableHead>
              <TableHead>Wins</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.customers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-muted-foreground"
                >
                  <UserCircle className="mx-auto mb-2 size-8 opacity-40" />
                  No customers found.
                </TableCell>
              </TableRow>
            ) : (
              data.customers.map((customer) => (
                <CustomerRow key={customer.id} customer={customer} />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-sm text-muted-foreground">
        Showing {data.customers.length} of {data.total} customers
      </p>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <GlobalUserSearch
              selected={linkedUser}
              onSelect={(user) => {
                setLinkedUser(user);
                if (user) {
                  setForm((f) => ({
                    ...f,
                    displayName: user.name ?? f.displayName,
                    email: user.email,
                    phone: user.phone ?? f.phone,
                  }));
                }
              }}
            />
            <div className="space-y-2">
              <Label htmlFor="customer-name">Name</Label>
              <Input
                id="customer-name"
                value={form.displayName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, displayName: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-phone">Phone</Label>
              <Input
                id="customer-phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-email">Email</Label>
              <Input
                id="customer-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleCreate}
              disabled={saving || !form.displayName.trim() || !form.phone.trim()}
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              Create customer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CustomerRow({ customer }: { customer: CustomerListItem }) {
  return (
    <TableRow>
      <TableCell>
        <Link
          href={`/dashboard/customers/${customer.id}`}
          className="font-medium hover:text-primary hover:underline"
        >
          {customer.displayName}
        </Link>
        {customer.email ? (
          <p className="text-xs text-muted-foreground">{customer.email}</p>
        ) : null}
      </TableCell>
      <TableCell>{customer.phone}</TableCell>
      <TableCell>{customer.loyaltyPoints}</TableCell>
      <TableCell>{customer.purchaseCount}</TableCell>
      <TableCell>{customer.winCount}</TableCell>
      <TableCell className="text-muted-foreground">
        {CUSTOMER_SOURCE_LABELS[customer.source]}
      </TableCell>
      <TableCell>
        {customer.isBlacklisted ? (
          <Badge variant="destructive">Blacklisted</Badge>
        ) : (
          <Badge variant="outline">Active</Badge>
        )}
      </TableCell>
    </TableRow>
  );
}
