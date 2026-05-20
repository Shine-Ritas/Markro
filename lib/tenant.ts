import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export type TenantContext = {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  roleSlug: string;
  permissions: string[];
};

export async function getPrimaryStaffMembership(
  userId: string
): Promise<TenantContext | null> {
  const staff = await prisma.staff.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      deletedAt: null,
      tenant: { deletedAt: null, status: "ACTIVE" },
    },
    orderBy: { createdAt: "asc" },
    include: {
      tenant: true,
      role: {
        include: {
          rolePermissions: {
            include: { permission: true },
          },
        },
      },
    },
  });

  if (!staff) return null;

  return {
    tenantId: staff.tenantId,
    tenantSlug: staff.tenant.slug,
    tenantName: staff.tenant.name,
    roleSlug: staff.role.slug,
    permissions: staff.role.rolePermissions.map((rp) => rp.permission.slug),
  };
}

export function tenantWhere<T extends { tenantId?: string }>(
  tenantId: string,
  where?: T
): T & { tenantId: string } {
  return { ...where, tenantId } as T & { tenantId: string };
}

export function createTenantScopedClient(tenantId: string) {
  return {
    tenantId,
    where: <T extends { tenantId?: string }>(where?: T) => tenantWhere(tenantId, where),
  };
}

export async function assertTenantAccess(
  userId: string,
  tenantId: string,
  isSuperAdmin: boolean
): Promise<TenantContext> {
  if (isSuperAdmin) {
    const tenant = await prisma.tenant.findFirst({
      where: { id: tenantId, deletedAt: null },
    });
    if (!tenant) throw new Error("Tenant not found");
    return {
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      tenantName: tenant.name,
      roleSlug: "super_admin",
      permissions: ["*"],
    };
  }

  const staff = await prisma.staff.findFirst({
    where: {
      userId,
      tenantId,
      status: "ACTIVE",
      deletedAt: null,
    },
    include: {
      tenant: true,
      role: {
        include: {
          rolePermissions: { include: { permission: true } },
        },
      },
    },
  });

  if (!staff || staff.tenant.deletedAt) {
    throw new Error("Forbidden");
  }

  return {
    tenantId: staff.tenantId,
    tenantSlug: staff.tenant.slug,
    tenantName: staff.tenant.name,
    roleSlug: staff.role.slug,
    permissions: staff.role.rolePermissions.map((rp) => rp.permission.slug),
  };
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export async function uniqueTenantSlug(base: string): Promise<string> {
  const slug = slugify(base) || "organization";
  let suffix = 0;

  while (true) {
    const candidate = suffix === 0 ? slug : `${slug}-${suffix}`;
    const existing = await prisma.tenant.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
    suffix += 1;
  }
}

export async function createAuditLog(
  data: Prisma.AuditLogCreateInput & {
    tenantId?: string | null;
    actorId?: string | null;
  }
) {
  return prisma.auditLog.create({
    data: {
      action: data.action,
      entity: data.entity,
      entityId: data.entityId,
      metadata: data.metadata,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      tenant: data.tenantId ? { connect: { id: data.tenantId } } : undefined,
      actor: data.actorId ? { connect: { id: data.actorId } } : undefined,
    },
  });
}
