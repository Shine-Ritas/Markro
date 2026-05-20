import { Ticket } from "lucide-react";
import { cn } from "@/lib/utils";
import { ticketDesignCardStyle } from "@/lib/ticket-designs";
import type { TicketDesignTheme } from "@/types/ticket-designs";

type TicketPreviewCardProps = {
  number: string;
  eventName?: string;
  theme: TicketDesignTheme;
  compact?: boolean;
  className?: string;
};

export function TicketPreviewCard({
  number,
  eventName,
  theme,
  compact = false,
  className,
}: TicketPreviewCardProps) {
  const style = ticketDesignCardStyle(theme);

  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-xl p-4",
        compact ? "min-h-[88px]" : "min-h-[120px]",
        className
      )}
      style={style}
    >
      <div className="flex items-start justify-between gap-2">
        <Ticket
          className="size-4 shrink-0 opacity-70"
          style={{ color: theme.accentColor }}
        />
        <span
          className="font-mono font-bold tracking-tight"
          style={{
            color: theme.accentColor,
            fontSize: compact ? "1.25rem" : (theme.numberSize ?? "2rem"),
          }}
        >
          {number}
        </span>
      </div>
      {eventName && !compact ? (
        <p
          className="mt-3 truncate text-xs"
          style={{ color: theme.mutedColor ?? "oklch(0.65 0.02 285)" }}
        >
          {eventName}
        </p>
      ) : null}
    </div>
  );
}
