import { NextResponse } from "next/server";
import { ApiError, requireApiSession, requireDrawsRun } from "@/lib/api-auth";
import { startDrawSession } from "@/services/draw.service";

import { createModuleLogger } from "@/lib/logger";

const log = createModuleLogger("api.draws");

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession();
    requireDrawsRun(session);
    const { id } = await context.params;

    const result = await startDrawSession(session.user.tenantId!, id, session.user.id);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ session: result.session });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    log.error({ err: error }, "[draw start]");
    return NextResponse.json({ error: "Failed to start draw" }, { status: 500 });
  }
}
