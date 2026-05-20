import { prisma } from "@/lib/prisma";

export type TenantOption = {
  id: string;
  name: string;
  slug: string;
  roleSlug: string;
};

export type ActivityItem = {
  id: string;
  action: string;
  entity: string | null;
  createdAt: Date;
  metadata?: unknown;
};

export async function getUserTenants(userId: string): Promise<TenantOption[]> {
  const staff = await prisma.staff.findMany({
    where: {
      userId,
      status: "ACTIVE",
      deletedAt: null,
      tenant: { deletedAt: null, status: "ACTIVE" },
    },
    include: { tenant: true, role: true },
    orderBy: { createdAt: "asc" },
  });

  return staff.map((s) => ({
    id: s.tenantId,
    name: s.tenant.name,
    slug: s.tenant.slug,
    roleSlug: s.role.slug,
  }));
}

export async function getRecentActivity(
  tenantId: string | undefined,
  limit = 8
): Promise<ActivityItem[]> {
  const logs = await prisma.auditLog.findMany({
    where: tenantId ? { tenantId } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      action: true,
      entity: true,
      createdAt: true,
      metadata: true,
    },
  });

  return logs;
}

/** Placeholder chart data until Phase 4+ events/tickets exist */
export function getPlaceholderChartData() {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  return months.map((name) => ({
    name,
    revenue: 0,
    tickets: 0,
  }));
}

export const EVENT_STATUS_PLACEHOLDER = [
  { label: "Draft", count: 0, color: "bg-zinc-500" },
  { label: "Active", count: 0, color: "bg-emerald-500" },
  { label: "Scheduled", count: 0, color: "bg-blue-500" },
  { label: "Completed", count: 0, color: "bg-primary" },
] as const;
