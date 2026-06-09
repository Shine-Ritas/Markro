import { EventForm } from "@/components/events/event-form";
import { getDefaultTicketDesignId } from "@/services/ticket-design.service";

export default async function NewEventPage() {
  const defaultDesignId = await getDefaultTicketDesignId();

  return (
    <div className="px-4 pb-8 sm:px-6">
      <EventForm mode="create" defaultDesignId={defaultDesignId} />
    </div>
  );
}
