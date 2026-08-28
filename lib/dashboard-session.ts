import { redirect } from "next/navigation";
import type { Session } from "next-auth";

/** Active workspace for staff dashboard routes and tenant-scoped APIs. */
export function getWorkspaceTenantId(session: Session | null): string | undefined {
  return session?.user?.tenantId;
}

export function requireWorkspaceTenantId(session: Session | null): string {
  if (!session?.user) redirect("/login");
  const tenantId = getWorkspaceTenantId(session);
  if (!tenantId) redirect("/dashboard");
  return tenantId;
}
