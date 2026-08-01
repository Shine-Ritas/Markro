"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
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
import type { PrizeDto } from "@/types/prizes";

type PrizeSearchSelectProps = {
  prizes: PrizeDto[];
  value: string;
  onChange: (prizeId: string) => void;
  excludeIds?: string[];
  placeholder?: string;
  className?: string;
};

export function PrizeSearchSelect({
  prizes,
  value,
  onChange,
  excludeIds = [],
  placeholder = "Search prizes…",
  className,
}: PrizeSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = prizes.find((p) => p.id === value);

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    return prizes
      .filter((p) => p.isActive)
      .filter((p) => p.id === value || !excludeIds.includes(p.id))
      .filter((p) => {
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          (p.description?.toLowerCase().includes(q) ?? false)
        );
      });
  }, [prizes, query, excludeIds, value]);

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
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
              !selected && "text-muted-foreground",
              className
            )}
          />
        }
      >
        <span className="truncate">{selected?.name ?? placeholder}</span>
        <ChevronDown className="size-4 shrink-0 opacity-50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-(--anchor-width) min-w-64 p-0">
        <div className="border-b border-border p-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name…"
              className="h-8 pl-8"
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
        </div>
        <div className="max-h-56 overflow-y-auto p-1">
          {options.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              No prizes found
            </p>
          ) : (
            options.map((prize) => (
              <DropdownMenuItem
                key={prize.id}
                className="flex items-start justify-between gap-2"
                onClick={() => {
                  onChange(prize.id);
                  setOpen(false);
                  setQuery("");
                }}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{prize.name}</p>
                  {prize.description ? (
                    <p className="line-clamp-1 text-xs text-muted-foreground">
                      {prize.description}
                    </p>
                  ) : null}
                </div>
                {value === prize.id ? (
                  <Check className="size-4 shrink-0 text-primary" />
                ) : null}
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
