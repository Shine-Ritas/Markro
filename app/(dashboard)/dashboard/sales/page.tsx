import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SalesListClient } from "@/components/sales/sales-list-client";
import { listPosEventFilterOptions, listTenantPosSales } from "@/services/pos.service";

export default async function SalesPage() {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");

  const tenantId = session.user.tenantId;

  const [initialData, eventOptions] = await Promise.all([
    listTenantPosSales(tenantId, { limit: 50, offset: 0 }),
    listPosEventFilterOptions(tenantId),
  ]);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Sales</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Completed POS transactions. Draft sales remain on the POS screen.
        </p>
      </div>

      <SalesListClient initialData={initialData} eventOptions={eventOptions} />
    </div>
  );
}
