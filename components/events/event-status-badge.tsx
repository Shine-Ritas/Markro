import { Badge } from "@/components/ui/badge";
import { EVENT_STATUS_LABELS } from "@/lib/events";
import { cn } from "@/lib/utils";
import type { EventStatus } from "@prisma/client";

const STATUS_STYLES: Record<EventStatus, string> = {
  DRAFT: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
  PUBLISHED: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  ARCHIVED: "bg-blue-500/20 text-blue-300 border-blue-500/30",
};

export function EventStatusBadge({ status }: { status: EventStatus }) {
  return (
    <Badge variant="outline" className={cn("font-medium", STATUS_STYLES[status])}>
      {EVENT_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
