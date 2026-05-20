import { cn } from "@/lib/utils";

type StatusItem = {
  label: string;
  count: number;
  color: string;
};

export function EventStatusCards({ items }: { items: readonly StatusItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-border bg-card/60 p-4 transition-colors hover:bg-card"
        >
          <div className="flex items-center gap-2">
            <span className={cn("size-2.5 rounded-full", item.color)} />
            <span className="text-sm text-muted-foreground">{item.label}</span>
          </div>
          <p className="mt-2 font-heading text-2xl font-bold">{item.count}</p>
        </div>
      ))}
    </div>
  );
}
