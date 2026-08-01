import { NextResponse } from "next/server";
import { buyerRegisterSchema } from "@/validators/buyer";
import { createUserWithCode } from "@/lib/user";
import { claimCustomersByEmail } from "@/services/buyer.service";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = buyerRegisterSchema.safeParse(body);

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

    const user = await createUserWithCode({
      email,
      name: parsed.data.name,
      password: parsed.data.password,
      emailVerified: new Date(),
    });

    const linkedCount = await claimCustomersByEmail(user.id);

    return NextResponse.json(
      {
        message: "Account created. You can sign in now.",
        globalUserCode: user.globalUserCode,
        linkedCustomerCount: linkedCount,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[buyer register]", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
