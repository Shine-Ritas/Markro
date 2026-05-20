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

type TenantSwitcherProps = {
  tenants: TenantOption[];
  activeTenantId?: string;
};

export function TenantSwitcher({ tenants, activeTenantId }: TenantSwitcherProps) {
  const active = tenants.find((t) => t.id === activeTenantId) ?? tenants[0] ?? null;

  if (!active) {
    return (
      <Button variant="outline" size="sm" disabled className="max-w-[200px]">
        <Building2 className="size-4 shrink-0" />
        <span className="truncate">No workspace</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="sm" className="max-w-[220px] gap-2" />}
      >
        <Building2 className="size-4 shrink-0 text-primary" />
        <span className="truncate">{active.name}</span>
        <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          {tenants.map((tenant) => (
            <DropdownMenuItem
              key={tenant.id}
              disabled={tenant.id === active.id}
              className="flex flex-col items-start gap-0.5"
            >
              <span className="font-medium">{tenant.name}</span>
              <span className="text-xs text-muted-foreground capitalize">
                {tenant.roleSlug.replace("_", " ")}
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
