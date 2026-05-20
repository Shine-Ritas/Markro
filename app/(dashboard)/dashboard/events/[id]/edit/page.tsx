import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { EventForm } from "@/components/events/event-form";
import { getTenantEventById } from "@/services/event.service";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditEventPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");

  const { id } = await params;
  const event = await getTenantEventById(session.user.tenantId, id);
  if (!event) notFound();

  return (
    <div className="px-4 pb-8 sm:px-6">
      <EventForm mode="edit" event={event} />
    </div>
  );
}
