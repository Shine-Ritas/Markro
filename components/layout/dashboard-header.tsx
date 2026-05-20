"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { NotificationDropdown } from "@/components/layout/notification-dropdown";
import { TenantSwitcher } from "@/components/layout/tenant-switcher";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { getBreadcrumbs } from "@/lib/breadcrumbs";
import type { ActivityItem, TenantOption } from "@/lib/dashboard";

const PAGE_DESCRIPTIONS: Record<string, string> = {
  "/dashboard": "Welcome back! Here's what's happening with your events.",
  "/dashboard/events": "Create and manage lucky draw events for your organization.",
  "/dashboard/tickets": "View and validate tickets across all events.",
  "/dashboard/events/new": "Set up a new event with schedule, tickets, and rules.",
};

export type DashboardHeaderProps = {
  title?: string;
  description?: string;
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
  title,
  description,
  tenants,
  activeTenantId,
  activities,
  user,
  onMenuClick,
}: DashboardHeaderProps) {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname);
  const resolvedTitle =
    title ?? breadcrumbs[breadcrumbs.length - 1]?.label ?? "Dashboard";
  const resolvedDescription = description ?? PAGE_DESCRIPTIONS[pathname];

  return (
    <header className="flex shrink-0 flex-col gap-3 border-b border-border px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </Button>
          <TenantSwitcher tenants={tenants} activeTenantId={activeTenantId} />
        </div>
        <div className="flex items-center gap-2">
          <NotificationDropdown activities={activities} />
          <UserMenu
            name={user.name}
            email={user.email}
            roleSlug={user.roleSlug}
            authProviders={user.authProviders}
            image={user.image}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Breadcrumbs items={breadcrumbs} />
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          {resolvedTitle}
        </h1>
        {resolvedDescription ? (
          <p className="text-sm text-muted-foreground">{resolvedDescription}</p>
        ) : null}
      </div>
    </header>
  );
}
