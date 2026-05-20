import { auth } from "@/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getRecentActivity, getUserTenants } from "@/lib/dashboard";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { user } = session;

  const [tenants, activities] = await Promise.all([
    getUserTenants(user.id),
    getRecentActivity(user.tenantId),
  ]);

  return (
    <DashboardShell
      userName={user.name}
      userEmail={user.email}
      userImage={user.image}
      userRoleSlug={user.roleSlug}
      authProviders={user.authProviders ?? []}
      tenants={tenants}
      activeTenantId={user.tenantId}
      activities={activities}
    >
      {children}
    </DashboardShell>
  );
}
