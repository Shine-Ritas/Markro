import { formatActionLabel, timeAgo } from "@/lib/format";
import type { ActivityItem } from "@/lib/dashboard";
import { Activity } from "lucide-react";

export function ActivityFeed({
  items,
  tenantName,
}: {
  items: ActivityItem[];
  tenantName?: string;
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-10 text-center">
        <Activity className="mb-3 size-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No recent activity yet</p>
        {tenantName ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Organization: {tenantName}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5"
        >
          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15">
            <Activity className="size-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium capitalize">
              {formatActionLabel(item.action)}
            </p>
            <p className="text-xs text-muted-foreground">
              {item.entity ?? "system"} · {timeAgo(item.createdAt)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
