"use client";

import { cn } from "@/lib/utils";
import { TicketPreviewCard } from "@/components/tickets/ticket-preview-card";
import type { TicketDesignPresetDto } from "@/types/ticket-designs";

type TicketDesignPickerProps = {
  presets: TicketDesignPresetDto[];
  value: string | null;
  onChange: (designId: string) => void;
  eventName?: string;
};

export function TicketDesignPicker({
  presets,
  value,
  onChange,
  eventName = "Your Event",
}: TicketDesignPickerProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {presets.map((preset) => {
        const selected = value === preset.id;
        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => onChange(preset.id)}
            className={cn(
              "rounded-xl border-2 p-3 text-left transition-all",
              selected
                ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                : "border-border bg-card/40 hover:border-primary/40"
            )}
          >
            <p className="mb-2 font-medium">{preset.name}</p>
            <p className="mb-3 text-xs text-muted-foreground line-clamp-2">
              {preset.description}
            </p>
            <TicketPreviewCard
              number="0001"
              eventName={eventName}
              theme={preset.theme}
              compact
            />
          </button>
        );
      })}
    </div>
  );
}
