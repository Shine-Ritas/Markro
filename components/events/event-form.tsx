"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { eventFormSchema, type EventFormValues } from "@/validators/events";
import { toDateInputValue, toTimeInputValue } from "@/lib/format";
import { TicketDesignPicker } from "@/components/tickets/ticket-design-picker";
import { TICKET_LIST_VIEW_LABELS, TICKET_LIST_VIEWS } from "@/types/ticket-designs";
import type { TicketDesignPresetDto } from "@/types/ticket-designs";
import type { EventDto } from "@/types/events";
import type { TicketListView } from "@prisma/client";

type EventFormProps = {
  mode: "create" | "edit";
  event?: EventDto;
  designPresets: TicketDesignPresetDto[];
  defaultDesignId: string;
};

function defaultValues(
  event: EventDto | undefined,
  defaultDesignId: string
): EventFormValues {
  if (!event) {
    return {
      name: "",
      description: "",
      bannerUrl: "",
      rules: "",
      venue: "",
      startDate: "",
      startTime: "18:00",
      endDate: "",
      endTime: "",
      drawScheduledAt: "",
      drawScheduledTime: "",
      ticketQuantity: 100,
      winnerCount: 1,
      ticketDesignId: defaultDesignId,
      ticketListViewDefault: "GRID",
      status: "DRAFT",
    };
  }

  return {
    name: event.name,
    description: event.description ?? "",
    bannerUrl: event.bannerUrl ?? "",
    rules: event.rules ?? "",
    venue: event.venue ?? "",
    startDate: toDateInputValue(event.startDate),
    startTime: toTimeInputValue(event.startDate),
    endDate: toDateInputValue(event.endDate),
    endTime: toTimeInputValue(event.endDate),
    drawScheduledAt: toDateInputValue(event.drawScheduledAt),
    drawScheduledTime: toTimeInputValue(event.drawScheduledAt),
    ticketQuantity: event.ticketQuantity,
    winnerCount: event.winnerCount,
    ticketDesignId: event.ticketDesignId ?? defaultDesignId,
    ticketListViewDefault: event.ticketListViewDefault,
    status: event.status,
  };
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-border py-8 first:pt-0 last:border-b-0">
      <div className="mb-6">
        <h2 className="font-heading text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

export function EventForm({
  mode,
  event,
  designPresets,
  defaultDesignId,
}: EventFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: defaultValues(event, defaultDesignId),
  });

  const status = watch("status");
  const eventName = watch("name");
  const ticketDesignId = watch("ticketDesignId");
  const ticketListViewDefault = watch("ticketListViewDefault");

  async function onSubmit(values: EventFormValues) {
    setSubmitting(true);
    try {
      const url = mode === "create" ? "/api/events" : `/api/events/${event!.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Failed to save event");
        return;
      }

      toast.success(mode === "create" ? "Event created" : "Event updated");
      router.push(`/dashboard/events/${data.event.id}`);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full">
      <FormSection
        title="Event details"
        description="Basic information about your event"
      >
        <div className="space-y-2">
          <Label htmlFor="name">Event name</Label>
          <Input id="name" placeholder="Summer Lucky Draw 2026" {...register("name")} />
          {errors.name ? (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={4}
            placeholder="Tell participants what this event is about…"
            {...register("description")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bannerUrl">Banner image URL</Label>
          <Input
            id="bannerUrl"
            type="url"
            placeholder="https://…"
            {...register("bannerUrl")}
          />
          {errors.bannerUrl ? (
            <p className="text-sm text-destructive">{errors.bannerUrl.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="venue">Venue / location</Label>
          <Input
            id="venue"
            placeholder="Bangkok Convention Center"
            {...register("venue")}
          />
        </div>
      </FormSection>

      <FormSection title="Date & time" description="When will your event take place?">
        <div className="space-y-2">
          <Label htmlFor="startDate">Event date</Label>
          <Input
            id="startDate"
            type="date"
            className="max-w-md"
            {...register("startDate")}
          />
          {errors.startDate ? (
            <p className="text-sm text-destructive">{errors.startDate.message}</p>
          ) : null}
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:max-w-2xl">
          <div className="space-y-2">
            <Label htmlFor="startTime">Start time</Label>
            <Input id="startTime" type="time" {...register("startTime")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endTime">End time</Label>
            <Input id="endTime" type="time" {...register("endTime")} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End date (optional)</Label>
          <Input
            id="endDate"
            type="date"
            className="max-w-md"
            {...register("endDate")}
          />
          {errors.endDate ? (
            <p className="text-sm text-destructive">{errors.endDate.message}</p>
          ) : null}
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:max-w-2xl">
          <div className="space-y-2">
            <Label htmlFor="drawScheduledAt">Draw date (optional)</Label>
            <Input id="drawScheduledAt" type="date" {...register("drawScheduledAt")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="drawScheduledTime">Draw time</Label>
            <Input
              id="drawScheduledTime"
              type="time"
              {...register("drawScheduledTime")}
            />
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Tickets & draw"
        description="Capacity and how many winners will be selected."
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:max-w-2xl">
          <div className="space-y-2">
            <Label htmlFor="ticketQuantity">Ticket quantity</Label>
            <Input
              id="ticketQuantity"
              type="number"
              min={0}
              {...register("ticketQuantity", { valueAsNumber: true })}
            />
            {errors.ticketQuantity ? (
              <p className="text-sm text-destructive">
                {errors.ticketQuantity.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="winnerCount">Winner count</Label>
            <Input
              id="winnerCount"
              type="number"
              min={1}
              {...register("winnerCount", { valueAsNumber: true })}
            />
            {errors.winnerCount ? (
              <p className="text-sm text-destructive">{errors.winnerCount.message}</p>
            ) : null}
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Ticket appearance"
        description="Card design and default list layout for this event (used when tickets go live)"
      >
        <TicketDesignPicker
          presets={designPresets}
          value={ticketDesignId ?? defaultDesignId}
          onChange={(id) => setValue("ticketDesignId", id, { shouldValidate: true })}
          eventName={eventName || "Your Event"}
        />
        <div className="space-y-2 max-w-md">
          <Label>Default ticket list view</Label>
          <Select
            value={ticketListViewDefault ?? "GRID"}
            onValueChange={(v) =>
              setValue("ticketListViewDefault", v as TicketListView, {
                shouldValidate: true,
              })
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
        </div>
      </FormSection>

      <FormSection title="Rules" description="Participation rules and prize details">
        <div className="space-y-2">
          <Label htmlFor="rules">Rules</Label>
          <Textarea
            id="rules"
            rows={5}
            placeholder="Eligibility, how to enter, prize details…"
            {...register("rules")}
          />
        </div>
      </FormSection>

      <FormSection title="Status" description="Control the visibility of your event">
        <div className="space-y-2 max-w-md">
          <Label>Status</Label>
          <Select
            value={status}
            onValueChange={(v) =>
              setValue("status", v as EventFormValues["status"], {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">Draft — Not visible to public</SelectItem>
              <SelectItem value="PUBLISHED">
                Published — Visible on public page
              </SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FormSection>

      <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving…
            </>
          ) : mode === "create" ? (
            "Create event"
          ) : (
            "Save changes"
          )}
        </Button>
      </div>
    </form>
  );
}
