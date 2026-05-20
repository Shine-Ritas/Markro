import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { EventForm } from "@/components/events/event-form";
import { getTenantEventById } from "@/services/event.service";
import { listTicketDesignPresets } from "@/services/ticket-design.service";
import { getDefaultTicketDesignId } from "@/services/ticket-design.service";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditEventPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");

  const { id } = await params;
  const [event, designPresets, defaultDesignId] = await Promise.all([
    getTenantEventById(session.user.tenantId, id),
    listTicketDesignPresets(),
    getDefaultTicketDesignId(),
  ]);
  if (!event) notFound();

  return (
    <div className="px-4 pb-8 sm:px-6">
      <EventForm
        mode="edit"
        event={event}
        designPresets={designPresets}
        defaultDesignId={defaultDesignId}
      />
    </div>
  );
}
