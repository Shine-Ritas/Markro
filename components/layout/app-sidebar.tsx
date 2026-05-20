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
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

const STORAGE_KEY = "luckdraw-sidebar-collapsed";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
};

const mainNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Events", href: "/dashboard/events", icon: Calendar },
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

function navItemClass(collapsed: boolean, isActive: boolean, disabled?: boolean) {
  return cn(
    "flex items-center rounded-lg text-sm transition-colors",
    collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2",
    disabled
      ? "cursor-not-allowed text-sidebar-foreground/40"
      : isActive
        ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
  );
}

function NavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const pathname = usePathname();
  const isActive =
    pathname === item.href ||
    (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
  const Icon = item.icon;
  const title = collapsed ? item.label : undefined;

  if (item.disabled) {
    return (
      <span
        className={navItemClass(collapsed, false, true)}
        title={title ?? "Coming in a later phase"}
      >
        <Icon className="size-5 shrink-0" />
        {!collapsed ? <span className="truncate">{item.label}</span> : null}
      </span>
    );
  }

  return (
    <Link href={item.href} className={navItemClass(collapsed, isActive)} title={title}>
      <Icon className="size-5 shrink-0" />
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
    </Link>
  );
}

type AppSidebarProps = {
  userName?: string | null;
  userEmail?: string | null;
  /** Mobile drawer always shows full labels */
  forceExpanded?: boolean;
};

export function AppSidebar({
  userName,
  userEmail,
  forceExpanded = false,
}: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (forceExpanded) return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") setCollapsed(true);
  }, [forceExpanded]);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      if (!forceExpanded) {
        localStorage.setItem(STORAGE_KEY, String(next));
      }
      return next;
    });
  }

  const isCollapsed = forceExpanded ? false : collapsed;

  const displayName = userName ?? userEmail?.split("@")[0] ?? "User";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ease-in-out",
        isCollapsed ? "w-[4.5rem]" : "w-64"
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center border-b border-sidebar-border",
          isCollapsed ? "justify-center px-2 py-4" : "gap-3 px-4 py-5"
        )}
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary">
          <Sparkles className="size-5 text-primary-foreground" />
        </div>
        {!isCollapsed ? (
          <div className="min-w-0 overflow-hidden">
            <p className="truncate font-heading text-sm font-semibold text-sidebar-foreground">
              {APP_NAME}
            </p>
            <p className="truncate text-xs text-sidebar-foreground/60">{APP_TAGLINE}</p>
          </div>
        ) : null}
      </div>

      <nav
        className={cn(
          "min-h-0 flex-1 overflow-x-hidden overflow-y-auto py-4",
          isCollapsed ? "px-2" : "px-3"
        )}
      >
        <div className="space-y-6">
          <div>
            {!isCollapsed ? (
              <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/50">
                Main
              </p>
            ) : null}
            <div className="space-y-0.5">
              {mainNav.map((item) => (
                <NavLink key={item.label} item={item} collapsed={isCollapsed} />
              ))}
            </div>
          </div>

          {isCollapsed ? (
            <div className="border-t border-sidebar-border" aria-hidden />
          ) : null}

          <div>
            {!isCollapsed ? (
              <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/50">
                Tools
              </p>
            ) : null}
            <div className="space-y-0.5">
              {toolsNav.map((item) => (
                <NavLink key={item.label} item={item} collapsed={isCollapsed} />
              ))}
            </div>
          </div>
        </div>
      </nav>

      <div
        className={cn(
          "shrink-0 border-t border-sidebar-border bg-sidebar",
          isCollapsed ? "p-2" : "p-3"
        )}
      >
        <button
          type="button"
          onClick={toggleCollapsed}
          className={cn(
            "flex w-full rounded-lg text-sm transition-colors hover:bg-sidebar-accent/60",
            isCollapsed
              ? "flex-col items-center gap-1 p-2"
              : "items-center gap-3 px-2 py-2 text-left"
          )}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isCollapsed ? displayName : undefined}
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/80 text-xs font-semibold text-primary-foreground">
            {initial}
          </div>
          {!isCollapsed ? (
            <>
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="truncate font-medium text-sidebar-foreground">
                  {displayName}
                </p>
                <p className="truncate text-xs text-sidebar-foreground/50">
                  {userEmail ?? ""}
                </p>
              </div>
              <ChevronLeft className="size-4 shrink-0 text-sidebar-foreground/50" />
            </>
          ) : (
            <ChevronLeft className="size-4 shrink-0 rotate-180 text-sidebar-foreground/50" />
          )}
        </button>
      </div>
    </aside>
  );
}
