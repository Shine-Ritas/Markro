import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PosClient } from "@/components/pos/pos-client";
import { listPosDrafts, listPosEvents } from "@/services/pos.service";

export default async function PosPage() {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");

  const tenantId = session.user.tenantId;

  const [events, drafts] = await Promise.all([
    listPosEvents(tenantId),
    listPosDrafts(tenantId),
  ]);

  return (
    <PosClient
      staffName={session.user.name ?? session.user.email ?? "Staff"}
      initialEvents={events}
      initialDrafts={drafts}
    />
  );
}
