"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import type { ActivityItem, TenantOption } from "@/lib/dashboard";

type DashboardShellProps = {
  children: React.ReactNode;
  userName?: string | null;
  userEmail: string;
  userImage?: string | null;
  userRoleSlug?: string;
  authProviders: string[];
  tenants: TenantOption[];
  activeTenantId?: string;
  activities: ActivityItem[];
};

export function DashboardShell({
  children,
  userName,
  userEmail,
  userImage,
  userRoleSlug,
  authProviders,
  tenants,
  activeTenantId,
  activities,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden h-full lg:flex">
        <AppSidebar userName={userName} userEmail={userEmail} />
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0" showCloseButton>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <AppSidebar userName={userName} userEmail={userEmail} forceExpanded />
        </SheetContent>
      </Sheet>

      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <DashboardHeader
          tenants={tenants}
          activeTenantId={activeTenantId}
          activities={activities}
          user={{
            name: userName,
            email: userEmail,
            image: userImage,
            roleSlug: userRoleSlug,
            authProviders,
          }}
          onMenuClick={() => setMobileOpen(true)}
        />
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
