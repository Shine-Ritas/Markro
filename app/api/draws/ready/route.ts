import { NextResponse } from "next/server";

import { ApiError, requireApiSession, requireEventsRead } from "@/lib/api-auth";
import { listDrawReadyEvents } from "@/services/prize.service";

import { createModuleLogger } from "@/lib/logger";

const log = createModuleLogger("api.draws");

export async function GET() {
  try {
    const session = await requireApiSession();
    requireEventsRead(session);

    const events = await listDrawReadyEvents(session.user.tenantId!);
    return NextResponse.json({ events });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    log.error({ err: error }, "draws ready GET");
    return NextResponse.json(
      { error: "Failed to load draw-ready events" },
      { status: 500 }
    );
  }
}
