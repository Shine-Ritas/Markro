import { EventForm } from "@/components/events/event-form";
import { listTicketDesignPresets } from "@/services/ticket-design.service";
import { getDefaultTicketDesignId } from "@/services/ticket-design.service";

export default async function NewEventPage() {
  const [designPresets, defaultDesignId] = await Promise.all([
    listTicketDesignPresets(),
    getDefaultTicketDesignId(),
  ]);

  return (
    <div className="px-4 pb-8 sm:px-6">
      <EventForm
        mode="create"
        designPresets={designPresets}
        defaultDesignId={defaultDesignId}
      />
    </div>
  );
}
