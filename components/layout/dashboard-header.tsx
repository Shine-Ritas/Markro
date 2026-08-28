"use client";

import Link from "next/link";
import { Menu, Ticket } from "lucide-react";
import { NotificationDropdown } from "@/components/layout/notification-dropdown";
import { TenantSwitcher } from "@/components/layout/tenant-switcher";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import type { ActivityItem, TenantOption } from "@/lib/dashboard";
import { shellTopBarClassName } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type DashboardHeaderProps = {
  tenants: TenantOption[];
  activeTenantId?: string;
  activities: ActivityItem[];
  user: {
    name?: string | null;
    email: string;
    image?: string | null;
    roleSlug?: string;
    authProviders: string[];
  };
  onMenuClick?: () => void;
};

export function DashboardHeader({
  tenants,
  activeTenantId,
  activities,
  user,
  onMenuClick,
}: DashboardHeaderProps) {
  return (
    <header
      className={cn(
        shellTopBarClassName,
        "sticky top-0 z-20 justify-between gap-3 border-border/80 bg-background/90 px-4 backdrop-blur-md sm:px-6"
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </Button>
        <TenantSwitcher tenants={tenants} activeTenantId={activeTenantId} />
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="hidden gap-2 sm:inline-flex"
          render={<Link href="/account" />}
        >
          <Ticket className="size-4" />
          My tickets
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden"
          render={<Link href="/account" aria-label="My tickets" />}
        >
          <Ticket className="size-4" />
        </Button>
        <NotificationDropdown activities={activities} />
        <UserMenu
          name={user.name}
          email={user.email}
          roleSlug={user.roleSlug}
          authProviders={user.authProviders}
          image={user.image}
        />
      </div>
    </header>
  );
}
