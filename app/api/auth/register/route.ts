import { NextResponse } from "next/server";

import { registerSchema } from "@/validators/auth";
import { createOrganizationWithOwner } from "@/lib/auth-provisioning";
import { createAuditLog } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

import { createModuleLogger } from "@/lib/logger";

const log = createModuleLogger("api.auth");

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const { tenant, userId } = await createOrganizationWithOwner({
      organizationName: parsed.data.organizationName,
      email,
      password: parsed.data.password,
      name: parsed.data.name,
    });

    await createAuditLog({
      action: "auth.register",
      entity: "tenant",
      entityId: tenant.id,
      actorId: userId,
      tenantId: tenant.id,
      metadata: { email },
    });

    return NextResponse.json(
      {
        message: "Account created. You can sign in now.",
        tenantSlug: tenant.slug,
      },
      { status: 201 }
    );
  } catch (error) {
    log.error({ err: error }, "register");
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
