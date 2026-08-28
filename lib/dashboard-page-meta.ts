import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Calendar,
  CalendarPlus,
  Gift,
  LayoutDashboard,
  Palette,
  Pencil,
  Receipt,
  Settings,
  ShoppingCart,
  Sparkles,
  Ticket,
  Trophy,
  UserCircle,
  Users,
} from "lucide-react";

export type DashboardPageMeta = {
  title: string;
  description?: string;
  icon: LucideIcon;
  section: "Overview" | "Operations" | "Tools";
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const STATIC_PAGES: Record<string, DashboardPageMeta> = {
  "/dashboard": {
    title: "Dashboard",
    description: "Overview of events, sales, and activity across your organization.",
    icon: LayoutDashboard,
    section: "Overview",
  },
  "/dashboard/events": {
    title: "Events",
    description: "Create and manage lucky draw events for your organization.",
    icon: Calendar,
    section: "Operations",
  },
  "/dashboard/events/new": {
    title: "Create event",
    description: "Set up schedule, tickets, and rules for a new lucky draw.",
    icon: CalendarPlus,
    section: "Operations",
  },
  "/dashboard/tickets": {
    title: "Tickets",
    description: "View, validate, and export tickets across all events.",
    icon: Ticket,
    section: "Operations",
  },
  "/dashboard/prizes": {
    title: "Prizes",
    description: "Manage prize catalog and assignments for your draws.",
    icon: Gift,
    section: "Operations",
  },
  "/dashboard/draws": {
    title: "Lucky Draw",
    description: "Start draw sessions and run live lucky draws.",
    icon: Sparkles,
    section: "Operations",
  },
  "/dashboard/winners": {
    title: "Winners",
    description: "Review announced winners and export results.",
    icon: Trophy,
    section: "Operations",
  },
  "/dashboard/pos": {
    title: "POS",
    description: "Sell tickets at the counter with a tablet-friendly checkout.",
    icon: ShoppingCart,
    section: "Tools",
  },
  "/dashboard/sales": {
    title: "Sales",
    description: "Completed sales history, receipts, and daily totals.",
    icon: Receipt,
    section: "Tools",
  },
  "/dashboard/customers": {
    title: "Customers",
    description: "Customer profiles, loyalty, and purchase history.",
    icon: UserCircle,
    section: "Tools",
  },
  "/dashboard/reports": {
    title: "Reports",
    description: "Analytics and performance insights for your events.",
    icon: BarChart3,
    section: "Tools",
  },
  "/dashboard/team": {
    title: "Team",
    description: "Invite staff and manage roles for your workspace.",
    icon: Users,
    section: "Tools",
  },
  "/dashboard/settings": {
    title: "Settings",
    description: "Organization preferences and workspace configuration.",
    icon: Settings,
    section: "Tools",
  },
};

export function getDashboardPageMeta(pathname: string): DashboardPageMeta {
  const exact = STATIC_PAGES[pathname];
  if (exact) return exact;

  const segments = pathname.split("/").filter(Boolean);

  if (segments[0] === "dashboard" && segments[1] === "events" && segments[2]) {
    const eventId = segments[2];
    if (UUID_RE.test(eventId)) {
      const action = segments[3];
      if (action === "edit") {
        return {
          title: "Edit event",
          description: "Update schedule, ticket rules, and event details.",
          icon: Pencil,
          section: "Operations",
        };
      }
      if (action === "appearance") {
        return {
          title: "Ticket appearance",
          description: "Choose card design and default list layout for this event.",
          icon: Palette,
          section: "Operations",
        };
      }
      if (action === "draw") {
        return {
          title: "Draw session",
          description: "Live lucky draw controls for this event.",
          icon: Sparkles,
          section: "Operations",
        };
      }
      return {
        title: "Event details",
        description: "Manage status, tickets, and draw setup for this event.",
        icon: Calendar,
        section: "Operations",
      };
    }
  }

  if (segments[0] === "dashboard" && segments[1] === "customers" && segments[2]) {
    return {
      title: "Customer profile",
      description: "Purchase history, notes, and loyalty for this customer.",
      icon: UserCircle,
      section: "Tools",
    };
  }

  return {
    title: "Dashboard",
    description: undefined,
    icon: LayoutDashboard,
    section: "Overview",
  };
}

export function formatRoleLabel(roleSlug?: string): string | undefined {
  if (!roleSlug) return undefined;
  return roleSlug.replace(/_/g, " ");
}
