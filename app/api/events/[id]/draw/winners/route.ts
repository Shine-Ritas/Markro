import { NextResponse } from "next/server";
import { ApiError, requireApiSession, requireEventsRead } from "@/lib/api-auth";
import { listEventWinners } from "@/services/draw.service";

import { createModuleLogger } from "@/lib/logger";

const log = createModuleLogger("api.draws");

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession();
    requireEventsRead(session);
    const { id } = await context.params;

    const winners = await listEventWinners(session.user.tenantId!, id);

    return NextResponse.json({ winners });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    log.error({ err: error }, "[event winners GET]");
    return NextResponse.json({ error: "Failed to load winners" }, { status: 500 });
  }
}
