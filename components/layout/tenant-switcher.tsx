"use client";

import { Building2, ChevronsUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { TenantOption } from "@/lib/dashboard";
import { formatRoleLabel } from "@/lib/dashboard-page-meta";
import { cn } from "@/lib/utils";

type TenantSwitcherProps = {
  tenants: TenantOption[];
  activeTenantId?: string;
};

export function TenantSwitcher({ tenants, activeTenantId }: TenantSwitcherProps) {
  const active = tenants.find((t) => t.id === activeTenantId) ?? tenants[0] ?? null;

  if (!active) {
    return (
      <div className="flex max-w-[220px] items-center gap-2 rounded-lg border border-dashed border-border/80 px-2.5 py-1.5 text-sm text-muted-foreground">
        <Building2 className="size-4 shrink-0 opacity-60" />
        <span className="truncate">No workspace</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-auto max-w-[240px] gap-2 rounded-lg border border-border/60 bg-muted/30 px-2.5 py-1.5",
              "hover:bg-muted/50 hover:text-foreground"
            )}
          />
        }
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
          <Building2 className="size-3.5" />
        </span>
        <span className="min-w-0 text-left">
          <span className="block truncate text-sm font-medium leading-tight">
            {active.name}
          </span>
          <span className="block truncate text-[10px] capitalize text-muted-foreground">
            {formatRoleLabel(active.roleSlug) ?? "Workspace"}
          </span>
        </span>
        <ChevronsUpDown className="size-3.5 shrink-0 opacity-40" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Your workspaces
          </DropdownMenuLabel>
          {tenants.map((tenant) => (
            <DropdownMenuItem
              key={tenant.id}
              disabled={tenant.id === active.id}
              className="flex flex-col items-start gap-0.5 py-2"
            >
              <span className="font-medium">{tenant.name}</span>
              <span className="text-xs capitalize text-muted-foreground">
                {formatRoleLabel(tenant.roleSlug)}
                {tenant.id === active.id ? " · current" : ""}
              </span>
            </DropdownMenuItem>
          ))}
          {tenants.length <= 1 ? (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">
              Multi-workspace switching in a later phase
            </p>
          ) : null}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
