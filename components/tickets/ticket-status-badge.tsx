import { Badge } from "@/components/ui/badge";
import { TICKET_STATUS_LABELS } from "@/types/tickets";
import { cn } from "@/lib/utils";
import type { TicketStatus } from "@prisma/client";

const STYLES: Record<TicketStatus, string> = {
  AVAILABLE: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
  SOLD: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  VALIDATED: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  CANCELLED: "bg-red-500/20 text-red-300 border-red-500/30",
};

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return (
    <Badge variant="outline" className={cn("text-xs", STYLES[status])}>
      {TICKET_STATUS_LABELS[status]}
    </Badge>
  );
}
