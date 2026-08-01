import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PrizesListClient } from "@/components/prizes/prizes-list-client";
import { listTenantPrizes } from "@/services/prize.service";

export default async function PrizesPage() {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");

  const prizes = await listTenantPrizes(session.user.tenantId);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Prizes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tenant prize catalog. Assign prizes to events — one per winner rank.
        </p>
      </div>

      <PrizesListClient initialPrizes={prizes} />
    </div>
  );
}
