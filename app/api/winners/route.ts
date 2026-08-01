import { NextResponse } from "next/server";

import { ApiError, requireApiSession, requireEventsRead } from "@/lib/api-auth";
import { listTenantWinners } from "@/services/draw.service";
import { winnersHistoryQuerySchema } from "@/validators/draws";

import { createModuleLogger } from "@/lib/logger";

const log = createModuleLogger("api.winners");

export async function GET(request: Request) {
  try {
    const session = await requireApiSession();
    requireEventsRead(session);

    const { searchParams } = new URL(request.url);
    const parsed = winnersHistoryQuerySchema.safeParse({
      eventId: searchParams.get("eventId") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      q: searchParams.get("q") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      offset: searchParams.get("offset") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await listTenantWinners(session.user.tenantId!, parsed.data);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    log.error({ err: error }, "winners GET");
    return NextResponse.json({ error: "Failed to load winners" }, { status: 500 });
  }
}
