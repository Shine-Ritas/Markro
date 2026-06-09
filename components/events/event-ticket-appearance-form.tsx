"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Palette } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TicketDesignPicker } from "@/components/tickets/ticket-design-picker";
import { TicketPreviewCard } from "@/components/tickets/ticket-preview-card";
import { parseTicketDesignTheme } from "@/lib/ticket-designs";
import {
  ticketAppearanceSchema,
  type TicketAppearanceValues,
} from "@/validators/ticket-appearance";
import { TICKET_LIST_VIEW_LABELS, TICKET_LIST_VIEWS } from "@/types/ticket-designs";
import type { TicketDesignPresetDto } from "@/types/ticket-designs";
import type { EventDto } from "@/types/events";

type EventTicketAppearanceFormProps = {
  event: EventDto;
  designPresets: TicketDesignPresetDto[];
  defaultDesignId: string;
};

export function EventTicketAppearanceForm({
  event,
  designPresets,
  defaultDesignId,
}: EventTicketAppearanceFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TicketAppearanceValues>({
    resolver: zodResolver(ticketAppearanceSchema),
    defaultValues: {
      ticketDesignId: event.ticketDesignId ?? defaultDesignId,
      ticketListViewDefault: event.ticketListViewDefault,
    },
  });

  const ticketDesignId = watch("ticketDesignId");
  const ticketListViewDefault = watch("ticketListViewDefault");
  const selectedPreset =
    designPresets.find((p) => p.id === ticketDesignId) ??
    designPresets.find((p) => p.id === defaultDesignId) ??
    designPresets[0];

  async function onSubmit(values: TicketAppearanceValues) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/events/${event.id}/appearance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to save ticket appearance");
        return;
      }
      toast.success("Ticket appearance saved");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const theme = selectedPreset
    ? parseTicketDesignTheme(selectedPreset.theme)
    : parseTicketDesignTheme({});

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 px-4 pb-10 sm:px-6">
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 w-fit"
            render={<Link href={`/dashboard/events/${event.id}`} />}
          >
            <ArrowLeft className="size-4" />
            Back to event
          </Button>
          <div className="flex items-center gap-2">
            <Palette className="size-5 text-primary" />
            <h1 className="font-heading text-2xl font-bold">Ticket appearance</h1>
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Choose a card design and default list layout for{" "}
            <span className="font-medium text-foreground">{event.name}</span>. Advanced
            customization tools will be added here later.
          </p>
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
          Save appearance
        </Button>
      </div>

      <section className="grid gap-8 lg:grid-cols-[1fr_minmax(280px,360px)]">
        <div className="space-y-6">
          <div>
            <h2 className="font-heading text-lg font-semibold">Card design</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Preset themes apply to every ticket card for this event.
            </p>
          </div>
          <TicketDesignPicker
            presets={designPresets}
            value={ticketDesignId}
            onChange={(id) => setValue("ticketDesignId", id, { shouldValidate: true })}
            eventName={event.name}
          />
          {errors.ticketDesignId ? (
            <p className="text-sm text-destructive">{errors.ticketDesignId.message}</p>
          ) : null}

          <div className="space-y-2 max-w-md">
            <Label>Default ticket list view</Label>
            <Select
              value={ticketListViewDefault}
              onValueChange={(v) =>
                setValue(
                  "ticketListViewDefault",
                  v as TicketAppearanceValues["ticketListViewDefault"],
                  {
                    shouldValidate: true,
                  }
                )
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select view" />
              </SelectTrigger>
              <SelectContent>
                {TICKET_LIST_VIEWS.map((view) => (
                  <SelectItem key={view} value={view}>
                    {TICKET_LIST_VIEW_LABELS[view]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Used on the event tickets panel and tickets dashboard until the user
              switches view.
            </p>
          </div>
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-xl border border-border bg-card/50 p-5">
            <h3 className="font-heading text-sm font-semibold">Live preview</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {selectedPreset?.name ?? "Classic"}
            </p>
            <div className="mt-4">
              <TicketPreviewCard number="0042" eventName={event.name} theme={theme} />
            </div>
          </div>
          <p className="mt-4 rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            Coming soon: custom colors, borders, and layout tools on this page.
          </p>
        </aside>
      </section>
    </form>
  );
}
