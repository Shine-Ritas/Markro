export type BreadcrumbItem = {
  label: string;
  href?: string;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  events: "Events",
  tickets: "Tickets",
  new: "Create event",
  edit: "Edit",
  appearance: "Ticket appearance",
  prizes: "Prizes",
  draws: "Lucky Draw",
  winners: "Winners",
  pos: "POS",
  reports: "Reports",
  team: "Team",
  settings: "Settings",
};

export function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);
  const items: BreadcrumbItem[] = [{ label: "Home", href: "/dashboard" }];

  if (segments[0] === "dashboard") {
    const rest = segments.slice(1);
    if (rest.length === 0) {
      items.push({ label: "Dashboard" });
      return items;
    }

    let path = "/dashboard";
    rest.forEach((seg, i) => {
      path += `/${seg}`;
      const prev = rest[i - 1];
      let label = ROUTE_LABELS[seg] ?? seg;
      if (UUID_RE.test(seg) && prev === "events") {
        label = "Event details";
      }
      items.push({
        label,
        href: i < rest.length - 1 ? path : undefined,
      });
    });
  }

  return items;
}
