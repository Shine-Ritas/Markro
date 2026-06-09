import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { EventTicketAppearanceForm } from "@/components/events/event-ticket-appearance-form";
import { getTenantEventById } from "@/services/event.service";
import {
  getDefaultTicketDesignId,
  listTicketDesignPresets,
} from "@/services/ticket-design.service";

type PageProps = { params: Promise<{ id: string }> };

export default async function EventTicketAppearancePage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");

  const { id } = await params;
  const tenantId = session.user.tenantId;

  const [event, designPresets, defaultDesignId] = await Promise.all([
    getTenantEventById(tenantId, id),
    listTicketDesignPresets(),
    getDefaultTicketDesignId(),
  ]);

  if (!event) notFound();

  return (
    <EventTicketAppearanceForm
      event={event}
      designPresets={designPresets}
      defaultDesignId={defaultDesignId}
    />
  );
}
