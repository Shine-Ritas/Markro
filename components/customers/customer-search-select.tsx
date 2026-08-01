"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, Search, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { formControlClass } from "@/lib/form-control";
import { cn } from "@/lib/utils";

export type PosCustomerOption = {
  id: string;
  displayName: string;
  phone: string;
  email: string | null;
  isBlacklisted: boolean;
  loyaltyPoints: number;
  globalUserCode?: string | null;
};

type CustomerSearchSelectProps = {
  value: PosCustomerOption | null;
  onChange: (customer: PosCustomerOption | null) => void;
  onManualChange?: () => void;
  placeholder?: string;
  className?: string;
};

export function CustomerSearchSelect({
  value,
  onChange,
  onManualChange,
  placeholder = "Search by name, phone, or LD-XXXXXX…",
  className,
}: CustomerSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<PosCustomerOption[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCustomers = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      params.set("limit", "20");
      const res = await fetch(`/api/pos/customers/search?${params.toString()}`);
      const data = await res.json();
      if (res.ok) setOptions(data.customers ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchCustomers(query);
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [open, query, fetchCustomers]);

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next && options.length === 0) fetchCustomers("");
        if (!next) setQuery("");
      }}
    >
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className={cn(
              formControlClass,
              "h-9 w-full justify-between font-normal",
              !value && "text-muted-foreground",
              className
            )}
          />
        }
      >
        <span className="truncate">
          {value
            ? `${value.displayName} · ${value.phone}${value.globalUserCode ? ` · ${value.globalUserCode}` : ""}`
            : placeholder}
        </span>
        <ChevronDown className="size-4 shrink-0 opacity-50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-(--anchor-width) min-w-72 p-0">
        <div className="border-b border-border p-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name, phone, or LD-XXXXXX…"
              className="h-8 pl-8"
              onKeyDown={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>
        </div>
        <div className="max-h-56 overflow-y-auto p-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : options.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              No customers found
            </p>
          ) : (
            options.map((customer) => (
              <DropdownMenuItem
                key={customer.id}
                className="flex items-start justify-between gap-2"
                onClick={() => {
                  onChange(customer);
                  setOpen(false);
                  setQuery("");
                }}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="truncate font-medium">
                      {customer.displayName}{" "}
                      {customer.globalUserCode
                        ? "( " + customer.globalUserCode + " )"
                        : ""}{" "}
                    </p>
                    {customer.isBlacklisted ? (
                      <Badge variant="destructive" className="text-[10px]">
                        Blacklisted
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">{customer.phone}</p>

                  {customer.email ? (
                    <p className="truncate text-xs text-muted-foreground">
                      {customer.email}
                    </p>
                  ) : null}
                </div>
                {value?.id === customer.id ? (
                  <Check className="size-4 shrink-0 text-primary" />
                ) : null}
              </DropdownMenuItem>
            ))
          )}
        </div>
        <div className="border-t border-border p-1">
          <DropdownMenuItem
            onClick={() => {
              onChange(null);
              onManualChange?.();
              setOpen(false);
              setQuery("");
            }}
          >
            <UserPlus className="size-4" />
            Enter new customer manually
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
