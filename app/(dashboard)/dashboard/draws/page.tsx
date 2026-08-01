import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DrawsListClient } from "@/components/draws/draws-list-client";
import { listDrawReadyEvents } from "@/services/prize.service";

export default async function DrawsPage() {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");

  const events = await listDrawReadyEvents(session.user.tenantId);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Lucky Draw
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Published events ready for live draw. Assign all prizes before starting.
        </p>
      </div>

      <DrawsListClient initialEvents={events} />
    </div>
  );
}
