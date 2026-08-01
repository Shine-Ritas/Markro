import { NextResponse } from "next/server";

import { ApiError, requireApiSession, requireEventsRead } from "@/lib/api-auth";
import { listTicketDesignPresets } from "@/services/ticket-design.service";

import { createModuleLogger } from "@/lib/logger";

const log = createModuleLogger("api.ticket-designs");

export async function GET() {
  try {
    const session = await requireApiSession();
    requireEventsRead(session);

    const presets = await listTicketDesignPresets();
    return NextResponse.json({ presets });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    log.error({ err: error }, "ticket-designs GET");
    return NextResponse.json(
      { error: "Failed to load ticket designs" },
      { status: 500 }
    );
  }
}
