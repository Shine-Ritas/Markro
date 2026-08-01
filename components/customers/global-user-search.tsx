"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Search, UserCheck, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { GlobalUserLookupResult } from "@/types/customers";

type GlobalUserSearchProps = {
  selected: GlobalUserLookupResult | null;
  onSelect: (user: GlobalUserLookupResult | null) => void;
  label?: string;
};

export function GlobalUserSearch({
  selected,
  onSelect,
  label = "Link global account (optional)",
}: GlobalUserSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalUserLookupResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ q });
      const res = await fetch(`/api/customers/lookup-global?${params.toString()}`);
      const data = await res.json();
      if (res.ok) setResults(data.users ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selected) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search, selected]);

  if (selected) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2">
          <div className="flex items-center gap-2">
            <UserCheck className="size-4 text-primary" />
            <div>
              <p className="text-sm font-medium">{selected.name ?? selected.email}</p>
              <p className="text-xs text-muted-foreground">
                {selected.globalUserCode} · {selected.email}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              onSelect(null);
              setQuery("");
              setResults([]);
            }}
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by LD-XXXXXX or email…"
          className="pl-9"
        />
        {loading ? (
          <Loader2 className="absolute right-2.5 top-2.5 size-4 animate-spin text-muted-foreground" />
        ) : null}
      </div>
      {results.length > 0 ? (
        <div className="max-h-40 overflow-y-auto rounded-md border">
          {results.map((user) => (
            <button
              key={user.id}
              type="button"
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted/60"
              onClick={() => {
                onSelect(user);
                setQuery("");
                setResults([]);
              }}
            >
              <span>
                {user.name ?? user.email}
                <span className="block text-xs text-muted-foreground">
                  {user.email}
                </span>
              </span>
              <Badge variant="secondary">{user.globalUserCode}</Badge>
            </button>
          ))}
        </div>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Search by global user code or email. Leave empty to create without linking.
      </p>
    </div>
  );
}
