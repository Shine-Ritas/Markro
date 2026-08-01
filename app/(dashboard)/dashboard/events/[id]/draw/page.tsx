import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { DrawSessionClient } from "@/components/draws/draw-session-client";
import { getTenantEventById } from "@/services/event.service";
import { listEventPrizes } from "@/services/prize.service";

type PageProps = { params: Promise<{ id: string }> };

export default async function EventDrawPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");

  const { id } = await params;
  const tenantId = session.user.tenantId;
  const [event, eventPrizes] = await Promise.all([
    getTenantEventById(tenantId, id),
    listEventPrizes(tenantId, id),
  ]);

  if (!event) notFound();

  if (eventPrizes.length < event.winnerCount) {
    redirect(`/dashboard/events/${id}`);
  }

  if (event.status === "COMPLETED") {
    redirect(`/dashboard/events/${id}`);
  }

  if (event.status !== "PUBLISHED") {
    redirect(`/dashboard/events/${id}`);
  }

  return (
    <DrawSessionClient
      event={event}
      initialEventPrizes={eventPrizes.map((p) => ({
        rank: p.rank,
        prize: { name: p.prize.name, imageUrl: p.prize.imageUrl },
      }))}
    />
  );
}
