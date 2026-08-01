import { NextResponse } from "next/server";
import { prizeFormSchema } from "@/validators/prizes";
import { ApiError, requireApiSession, requireEventsWrite } from "@/lib/api-auth";
import { createTenantPrize, listTenantPrizes } from "@/services/prize.service";

import { createModuleLogger } from "@/lib/logger";

const log = createModuleLogger("api.prizes");

export async function GET() {
  try {
    const session = await requireApiSession();
    requireEventsWrite(session);

    const prizes = await listTenantPrizes(session.user.tenantId!);
    return NextResponse.json({ prizes });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    log.error({ err: error }, "[prizes GET]");
    return NextResponse.json({ error: "Failed to load prizes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireApiSession();
    requireEventsWrite(session);

    const body = await request.json();
    const parsed = prizeFormSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const prize = await createTenantPrize(
      session.user.tenantId!,
      session.user.id,
      parsed.data
    );

    return NextResponse.json({ prize }, { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    log.error({ err: error }, "[prizes POST]");
    return NextResponse.json({ error: "Failed to create prize" }, { status: 500 });
  }
}
