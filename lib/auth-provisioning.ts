import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { createAuditLog, uniqueTenantSlug } from "@/lib/tenant";

const OWNER_PERMISSIONS = [
  "tenant.manage",
  "events.read",
  "events.write",
  "tickets.read",
  "tickets.write",
  "draws.run",
  "customers.read",
  "analytics.view",
  "staff.manage",
  "settings.manage",
];

export async function ensurePermissions() {
  for (const slug of OWNER_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { slug },
      create: {
        name: slug.replace(".", " "),
        slug,
        description: `Permission: ${slug}`,
      },
      update: {},
    });
  }
}

export async function createOrganizationWithOwner(input: {
  organizationName: string;
  email: string;
  password?: string;
  name?: string;
  userId?: string;
}) {
  await ensurePermissions();

  const slug = await uniqueTenantSlug(input.organizationName);
  const freePlan = await prisma.plan.findFirst({ where: { slug: "free" } });
  if (!freePlan) throw new Error("Free plan not seeded. Run: npm run db:seed");

  return prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        name: input.organizationName,
        slug,
        status: "ACTIVE",
      },
    });

    const ownerRole = await tx.role.create({
      data: {
        tenantId: tenant.id,
        name: "Owner",
        slug: "owner",
        description: "Full organization access",
        isSystem: true,
      },
    });

    const permissions = await tx.permission.findMany({
      where: { slug: { in: OWNER_PERMISSIONS } },
    });

    await tx.rolePermission.createMany({
      data: permissions.map((p) => ({
        roleId: ownerRole.id,
        permissionId: p.id,
      })),
    });

    let userId = input.userId;

    if (!userId) {
      const user = await tx.user.create({
        data: {
          email: input.email.toLowerCase(),
          name: input.name ?? input.organizationName,
          passwordHash: input.password ? await hashPassword(input.password) : null,
          emailVerified: new Date(),
        },
      });
      userId = user.id;
    }

    await tx.staff.create({
      data: {
        tenantId: tenant.id,
        userId,
        roleId: ownerRole.id,
        status: "ACTIVE",
      },
    });

    await tx.subscription.create({
      data: {
        tenantId: tenant.id,
        planId: freePlan.id,
        status: "ACTIVE",
      },
    });

    return { tenant, userId, ownerRole };
  });
}

export async function provisionOAuthUser(user: {
  id: string;
  email: string;
  name?: string | null;
}) {
  const existingStaff = await prisma.staff.count({
    where: { userId: user.id, deletedAt: null },
  });

  if (existingStaff > 0) return;

  const orgName = user.name
    ? `${user.name}'s Organization`
    : `${user.email.split("@")[0]}'s Organization`;

  const result = await createOrganizationWithOwner({
    organizationName: orgName,
    email: user.email,
    name: user.name ?? undefined,
    userId: user.id,
  });

  await createAuditLog({
    action: "auth.oauth_register",
    entity: "tenant",
    entityId: result.tenant.id,
    actorId: user.id,
    tenantId: result.tenant.id,
    metadata: { provider: "google" },
  });
}
