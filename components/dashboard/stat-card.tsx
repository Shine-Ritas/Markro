import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string;
  subtext: string;
  trend?: string;
  icon: LucideIcon;
  className?: string;
};

export function StatCard({
  label,
  value,
  subtext,
  trend,
  icon: Icon,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn("rounded-xl border border-border bg-card p-5 shadow-sm", className)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="font-heading text-3xl font-bold tracking-tight">{value}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{subtext}</span>
            {trend ? (
              <span className="rounded-md bg-success/15 px-1.5 py-0.5 font-medium text-success">
                {trend}
              </span>
            ) : null}
          </div>
        </div>
        <div className="rounded-lg bg-muted/80 p-2.5 text-muted-foreground">
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}
