"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Gift,
  LayoutDashboard,
  Receipt,
  Settings,
  ShoppingCart,
  Sparkles,
  Ticket,
  Trophy,
  Users,
  UserCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { APP_NAME, APP_TAGLINE, shellTopBarClassName } from "@/lib/constants";

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
  { label: "Tickets", href: "/dashboard/tickets", icon: Ticket },
  { label: "Prizes", href: "/dashboard/prizes", icon: Gift },
  { label: "Lucky Draw", href: "/dashboard/draws", icon: Sparkles },
  { label: "Winners", href: "/dashboard/winners", icon: Trophy },
];

const toolsNav: NavItem[] = [
  { label: "POS", href: "/dashboard/pos", icon: ShoppingCart },
  { label: "Sales", href: "/dashboard/sales", icon: Receipt },
  { label: "Customers", href: "/dashboard/customers", icon: UserCircle },
  { label: "Reports", href: "/dashboard/reports", icon: BarChart3, disabled: true },
  { label: "Team", href: "/dashboard/team", icon: Users, disabled: true },
  { label: "Settings", href: "/dashboard/settings", icon: Settings, disabled: true },
];

function navItemClass(collapsed: boolean, isActive: boolean, disabled?: boolean) {
  return cn(
    "flex items-center text-sm transition-colors",
    collapsed
      ? "justify-center rounded-lg px-2 py-2.5"
      : cn(
          "gap-3 rounded-r-lg border-l-2 py-2 pr-3",
          isActive ? "border-l-primary pl-[10px]" : "border-l-transparent pl-3"
        ),
    disabled
      ? "cursor-not-allowed text-sidebar-foreground/40"
      : isActive
        ? "bg-primary/10 font-medium text-sidebar-foreground"
        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
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
          shellTopBarClassName,
          isCollapsed ? "justify-center gap-0 px-2" : "gap-2.5 px-4"
        )}
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary">
          <Sparkles className="size-4 text-primary-foreground" />
        </div>
        {!isCollapsed ? (
          <div className="min-w-0 overflow-hidden leading-tight">
            <p className="truncate font-heading text-sm font-semibold text-sidebar-foreground">
              {APP_NAME}
            </p>
            <p className="truncate text-[10px] text-sidebar-foreground/55">{APP_TAGLINE}</p>
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
              <p className="mb-1.5 px-3 text-[10px] font-semibold tracking-widest text-sidebar-foreground/40 uppercase">
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
              <p className="mb-1.5 px-3 text-[10px] font-semibold tracking-widest text-sidebar-foreground/40 uppercase">
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
          isCollapsed ? "flex flex-col items-stretch gap-1 p-2" : "p-3"
        )}
      >
        {!forceExpanded && isCollapsed ? (
          <button
            type="button"
            onClick={toggleCollapsed}
            className={cn(
              "flex w-full items-center justify-center rounded-lg px-2 py-2.5 text-sm transition-colors",
              "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
            )}
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <ChevronRight className="size-5 shrink-0" />
          </button>
        ) : null}

        <div
          className={cn(
            "flex items-center",
            isCollapsed ? "justify-center py-1" : "gap-3 px-1 py-0.5"
          )}
          title={isCollapsed ? displayName : undefined}
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {initial}
          </div>
          {!isCollapsed ? (
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {displayName}
              </p>
              {userEmail ? (
                <p className="truncate text-xs text-sidebar-foreground/50">{userEmail}</p>
              ) : null}
            </div>
          ) : null}
        </div>

        {!forceExpanded && !isCollapsed ? (
          <button
            type="button"
            onClick={toggleCollapsed}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <ChevronLeft className="size-5 shrink-0" />
            <span>Collapse</span>
          </button>
        ) : null}
      </div>
    </aside>
  );
}
