import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type QuickActionCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  iconClassName: string;
  disabled?: boolean;
  href?: string;
};

export function QuickActionCard({
  title,
  description,
  icon: Icon,
  iconClassName,
  disabled,
  href,
}: QuickActionCardProps) {
  const className = cn(
    "flex w-full items-start gap-3 rounded-xl border border-border bg-card/50 p-4 text-left transition-colors",
    disabled ? "cursor-not-allowed opacity-60" : "hover:border-primary/30 hover:bg-card"
  );

  const inner = (
    <>
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg",
          iconClassName
        )}
      >
        <Icon className="size-5 text-white" />
      </div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </>
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      className={className}
      title={disabled ? "Coming in a later phase" : undefined}
    >
      {inner}
    </button>
  );
}
