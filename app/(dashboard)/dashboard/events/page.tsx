import { auth } from "@/auth";
import { EventsListClient } from "@/components/events/events-list-client";
import { listTenantEvents } from "@/services/event.service";
import { redirect } from "next/navigation";

export default async function EventsPage() {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");

  const events = await listTenantEvents(session.user.tenantId);

  return (
    <EventsListClient
      events={events}
      tenantSlug={session.user.tenantSlug ?? "demo-org"}
    />
  );
}
