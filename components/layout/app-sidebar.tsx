"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Calendar,
  ChevronLeft,
  Gift,
  LayoutDashboard,
  Settings,
  ShoppingCart,
  Sparkles,
  Ticket,
  Trophy,
  Users,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
};

const mainNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Events", href: "/dashboard/events", icon: Calendar, disabled: true },
  { label: "Tickets", href: "/dashboard/tickets", icon: Ticket, disabled: true },
  { label: "Prizes", href: "/dashboard/prizes", icon: Gift, disabled: true },
  { label: "Lucky Draw", href: "/dashboard/draws", icon: Sparkles, disabled: true },
  { label: "Winners", href: "/dashboard/winners", icon: Trophy, disabled: true },
];

const toolsNav: NavItem[] = [
  { label: "POS", href: "/dashboard/pos", icon: ShoppingCart, disabled: true },
  { label: "Reports", href: "/dashboard/reports", icon: BarChart3, disabled: true },
  { label: "Team", href: "/dashboard/team", icon: Users, disabled: true },
  { label: "Settings", href: "/dashboard/settings", icon: Settings, disabled: true },
];

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const isActive = pathname === item.href;
  const Icon = item.icon;

  if (item.disabled) {
    return (
      <span
        className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/40"
        title="Coming in a later phase"
      >
        <Icon className="size-4 shrink-0" />
        {item.label}
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
      )}
    >
      <Icon className="size-4 shrink-0" />
      {item.label}
    </Link>
  );
}

type AppSidebarProps = {
  userName?: string | null;
  userEmail?: string | null;
};

export function AppSidebar({ userName, userEmail }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const displayName = userName ?? userEmail?.split("@")[0] ?? "User";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      <div className="flex items-center gap-3 border-b border-sidebar-border px-4 py-5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary">
          <Sparkles className="size-5 text-primary-foreground" />
        </div>
        {!collapsed ? (
          <div className="min-w-0">
            <p className="truncate font-heading text-sm font-semibold text-sidebar-foreground">
              {APP_NAME}
            </p>
            <p className="truncate text-xs text-sidebar-foreground/60">{APP_TAGLINE}</p>
          </div>
        ) : null}
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        <div>
          {!collapsed ? (
            <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/50">
              Main
            </p>
          ) : null}
          <div className="space-y-0.5">
            {mainNav.map((item) => (
              <NavLink key={item.label} item={item} />
            ))}
          </div>
        </div>
        <div>
          {!collapsed ? (
            <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/50">
              Tools
            </p>
          ) : null}
          <div className="space-y-0.5">
            {toolsNav.map((item) => (
              <NavLink key={item.label} item={item} />
            ))}
          </div>
        </div>
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm hover:bg-sidebar-accent/60"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/80 text-xs font-semibold text-primary-foreground">
            {initial}
          </div>
          {!collapsed ? (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-sidebar-foreground">
                  {displayName}
                </p>
                <p className="truncate text-xs text-sidebar-foreground/50">
                  {userEmail ?? ""}
                </p>
              </div>
              <ChevronLeft
                className={cn(
                  "size-4 shrink-0 text-sidebar-foreground/50 transition-transform",
                  collapsed && "rotate-180"
                )}
              />
            </>
          ) : null}
        </button>
      </div>
    </aside>
  );
}
