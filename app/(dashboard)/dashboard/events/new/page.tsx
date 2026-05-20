import { EventForm } from "@/components/events/event-form";

export default function NewEventPage() {
  return (
    <div className="px-4 pb-8 sm:px-6">
      <EventForm mode="create" />
    </div>
  );
}
