import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { forgotPasswordSchema } from "@/validators/auth";
import { prisma } from "@/lib/prisma";

const RESET_EXPIRY_HOURS = 1;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to avoid email enumeration
    if (!user?.passwordHash || user.deletedAt) {
      return NextResponse.json({
        message:
          "If an account exists for this email, a reset link has been generated.",
      });
    }

    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + RESET_EXPIRY_HOURS * 60 * 60 * 1000);

    await prisma.verificationToken.deleteMany({
      where: { identifier: `reset:${email}` },
    });

    await prisma.verificationToken.create({
      data: {
        identifier: `reset:${email}`,
        token,
        expires,
      },
    });

    const baseUrl = process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL;
    const resetUrl = `${baseUrl}/reset-password?email=${encodeURIComponent(email)}&token=${token}`;

    const isDev = process.env.NODE_ENV === "development";

    return NextResponse.json({
      message: "If an account exists for this email, a reset link has been generated.",
      ...(isDev ? { resetUrl } : {}),
    });
  } catch (error) {
    console.error("[forgot-password]", error);
    return NextResponse.json({ error: "Unable to process request" }, { status: 500 });
  }
}
