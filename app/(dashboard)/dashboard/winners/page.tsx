import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { WinnersListClient } from "@/components/winners/winners-list-client";
import { listDrawEventFilterOptions, listTenantWinners } from "@/services/draw.service";

export default async function WinnersPage() {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");

  const tenantId = session.user.tenantId;

  const [initialData, eventOptions] = await Promise.all([
    listTenantWinners(tenantId, { limit: 50, offset: 0 }),
    listDrawEventFilterOptions(tenantId),
  ]);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Winners</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Lucky draw winner history across all events.
        </p>
      </div>

      <WinnersListClient initialData={initialData} eventOptions={eventOptions} />
    </div>
  );
}
