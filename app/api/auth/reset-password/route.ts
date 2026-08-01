import { NextResponse } from "next/server";

import { resetPasswordSchema } from "@/validators/auth";
import { hashPassword } from "@/lib/password";
import { createAuditLog } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

import { createModuleLogger } from "@/lib/logger";

const log = createModuleLogger("api.auth");

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();
    const identifier = `reset:${email}`;

    const verification = await prisma.verificationToken.findFirst({
      where: {
        identifier,
        token: parsed.data.token,
        expires: { gt: new Date() },
      },
    });

    if (!verification) {
      return NextResponse.json(
        { error: "Invalid or expired reset link" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.deletedAt) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const passwordHash = await hashPassword(parsed.data.password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: verification.identifier,
            token: verification.token,
          },
        },
      }),
    ]);

    await createAuditLog({
      action: "auth.password_reset",
      entity: "user",
      entityId: user.id,
      actorId: user.id,
    });

    return NextResponse.json({
      message: "Password updated. You can sign in now.",
    });
  } catch (error) {
    log.error({ err: error }, "reset-password");
    return NextResponse.json({ error: "Unable to reset password" }, { status: 500 });
  }
}
