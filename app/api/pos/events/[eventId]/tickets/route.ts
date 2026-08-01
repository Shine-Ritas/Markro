import { NextResponse } from "next/server";

import { ApiError, requireApiSession, requireTicketsRead } from "@/lib/api-auth";
import { listPosAvailableTickets } from "@/services/pos.service";

import { createModuleLogger } from "@/lib/logger";

const log = createModuleLogger("api.pos");

type RouteContext = { params: Promise<{ eventId: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession();
    requireTicketsRead(session);

    const { eventId } = await context.params;
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") ?? undefined;
    const limit = Math.min(
      500,
      Math.max(1, Number(searchParams.get("limit") ?? "200") || 200)
    );
    const offset = Math.max(0, Number(searchParams.get("offset") ?? "0") || 0);

    const result = await listPosAvailableTickets(session.user.tenantId!, eventId, {
      search: q,
      limit,
      offset,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({ tickets: result.tickets });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    log.error({ err: error }, "pos event tickets GET");
    return NextResponse.json({ error: "Failed to load tickets" }, { status: 500 });
  }
}
