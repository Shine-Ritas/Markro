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
import { shellToolbarButtonClass } from "@/lib/constants";
import { cn } from "@/lib/utils";

type TenantSwitcherProps = {
  tenants: TenantOption[];
  activeTenantId?: string;
};

export function TenantSwitcher({ tenants, activeTenantId }: TenantSwitcherProps) {
  const active = tenants.find((t) => t.id === activeTenantId) ?? tenants[0] ?? null;

  if (!active) {
    return (
      <span
        className={cn(
          shellToolbarButtonClass,
          "inline-flex max-w-[200px] items-center gap-2 text-sm text-muted-foreground"
        )}
      >
        <Building2 className="size-4 shrink-0 opacity-50" />
        <span className="truncate">No workspace</span>
      </span>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className={cn(shellToolbarButtonClass, "max-w-[200px] font-medium")}
          />
        }
      >
        <Building2 className="size-4 shrink-0 text-primary" />
        <span className="truncate">{active.name}</span>
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
