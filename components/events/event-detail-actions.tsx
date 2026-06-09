"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, Globe, Palette, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { EventDto } from "@/types/events";

type EventDetailActionsProps = {
  event: EventDto;
  tenantSlug: string;
};

export function EventDetailActions({ event, tenantSlug }: EventDetailActionsProps) {
  const router = useRouter();

  async function postAction(path: "publish" | "archive", label: string) {
    const res = await fetch(`/api/events/${event.id}/${path}`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? `Failed to ${label}`);
      return;
    }
    toast.success(`Event ${label}`);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Delete this event?")) return;
    const res = await fetch(`/api/events/${event.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "Failed to delete");
      return;
    }
    toast.success("Event deleted");
    router.push("/dashboard/events");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        render={<Link href={`/dashboard/events/${event.id}/appearance`} />}
      >
        <Palette className="size-4" />
        Ticket appearance
      </Button>
      <Button
        variant="outline"
        render={<Link href={`/dashboard/events/${event.id}/edit`} />}
      >
        <Pencil className="size-4" />
        Edit
      </Button>
      {event.status === "PUBLISHED" ? (
        <Button
          variant="outline"
          render={
            <a
              href={`/org/${tenantSlug}/events/${event.slug}`}
              target="_blank"
              rel="noopener noreferrer"
            />
          }
        >
          <Globe className="size-4" />
          Public page
        </Button>
      ) : null}
      {event.status === "DRAFT" ? (
        <Button onClick={() => postAction("publish", "published")}>Publish</Button>
      ) : null}
      {event.status !== "ARCHIVED" ? (
        <Button variant="outline" onClick={() => postAction("archive", "archived")}>
          <Archive className="size-4" />
          Archive
        </Button>
      ) : null}
      <Button variant="destructive" onClick={handleDelete}>
        <Trash2 className="size-4" />
        Delete
      </Button>
    </div>
  );
}
