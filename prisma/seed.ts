import { hashPassword } from "../lib/password";
import { ensurePermissions } from "../lib/auth-provisioning";
import { prisma } from "../lib/prisma";
import { seedTicketDesignPresets } from "./seeds/ticket-designs";

async function main() {
  console.log("Seeding database…");

  await ensurePermissions();

  const ownerRoles = await prisma.role.findMany({
    where: { slug: "owner", isSystem: true },
    select: { id: true },
  });
  const allPerms = await prisma.permission.findMany();
  for (const role of ownerRoles) {
    const existing = await prisma.rolePermission.findMany({
      where: { roleId: role.id },
      select: { permissionId: true },
    });
    const existingIds = new Set(existing.map((e) => e.permissionId));
    const missing = allPerms.filter((p) => !existingIds.has(p.id));
    if (missing.length > 0) {
      await prisma.rolePermission.createMany({
        data: missing.map((p) => ({ roleId: role.id, permissionId: p.id })),
      });
    }
  }

  await seedTicketDesignPresets();

  const plans = [
    {
      slug: "free",
      name: "Free",
      description: "Get started with core lucky draw features",
      priceMonthly: 0,
      maxEvents: 3,
      maxTickets: 500,
      maxStaff: 2,
      features: ["events", "tickets", "draws"],
    },
    {
      slug: "pro",
      name: "Pro",
      description: "Growing organizations with higher limits",
      priceMonthly: 49,
      maxEvents: 25,
      maxTickets: 10000,
      maxStaff: 10,
      features: ["events", "tickets", "draws", "analytics", "pos"],
    },
    {
      slug: "enterprise",
      name: "Enterprise",
      description: "Unlimited scale and priority support",
      priceMonthly: 199,
      maxEvents: 999,
      maxTickets: 999999,
      maxStaff: 100,
      features: ["events", "tickets", "draws", "analytics", "pos", "api"],
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      create: {
        ...plan,
        features: plan.features,
      },
      update: {
        name: plan.name,
        description: plan.description,
        priceMonthly: plan.priceMonthly,
        maxEvents: plan.maxEvents,
        maxTickets: plan.maxTickets,
        maxStaff: plan.maxStaff,
        features: plan.features,
      },
    });
  }

  const superEmail = "superadmin@luckdraw.app";
  const superPassword = "SuperAdmin123!";

  await prisma.user.upsert({
    where: { email: superEmail },
    create: {
      email: superEmail,
      name: "Super Admin",
      passwordHash: await hashPassword(superPassword),
      isSuperAdmin: true,
      emailVerified: new Date(),
    },
    update: {
      isSuperAdmin: true,
      passwordHash: await hashPassword(superPassword),
    },
  });

  const demoEmail = "demo@demo.com";
  const demoPassword = "Demo1234!";
  const freePlan = await prisma.plan.findUniqueOrThrow({ where: { slug: "free" } });

  let demoUser = await prisma.user.findUnique({ where: { email: demoEmail } });

  if (!demoUser) {
    demoUser = await prisma.user.create({
      data: {
        email: demoEmail,
        name: "Demo Owner",
        passwordHash: await hashPassword(demoPassword),
        emailVerified: new Date(),
      },
    });
  } else {
    await prisma.user.update({
      where: { id: demoUser.id },
      data: { passwordHash: await hashPassword(demoPassword) },
    });
  }

  let demoTenant = await prisma.tenant.findUnique({ where: { slug: "demo-org" } });

  if (!demoTenant) {
    demoTenant = await prisma.tenant.create({
      data: {
        name: "Demo Organization",
        slug: "demo-org",
        status: "ACTIVE",
      },
    });
  }

  const ownerPerms = await prisma.permission.findMany();
  let ownerRole = await prisma.role.findFirst({
    where: { tenantId: demoTenant.id, slug: "owner" },
  });

  if (!ownerRole) {
    ownerRole = await prisma.role.create({
      data: {
        tenantId: demoTenant.id,
        name: "Owner",
        slug: "owner",
        isSystem: true,
        rolePermissions: {
          create: ownerPerms.map((p) => ({ permissionId: p.id })),
        },
      },
    });
  }

  await prisma.staff.upsert({
    where: {
      tenantId_userId: { tenantId: demoTenant.id, userId: demoUser.id },
    },
    create: {
      tenantId: demoTenant.id,
      userId: demoUser.id,
      roleId: ownerRole.id,
      status: "ACTIVE",
    },
    update: { roleId: ownerRole.id, status: "ACTIVE" },
  });

  const existingSub = await prisma.subscription.findFirst({
    where: { tenantId: demoTenant.id },
  });
  if (!existingSub) {
    await prisma.subscription.create({
      data: {
        tenantId: demoTenant.id,
        planId: freePlan.id,
        status: "ACTIVE",
      },
    });
  }

  console.log("\nSeed complete.\n");
  console.log("Super Admin:", superEmail, "/", superPassword);
  console.log("Demo User:   ", demoEmail, "/", demoPassword);
  console.log("Demo Tenant: ", demoTenant.slug);
  console.log(
    "\nGoogle OAuth: set AUTH_GOOGLE_ID + AUTH_GOOGLE_SECRET + NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true"
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
