import { NextResponse } from "next/server";

import { ApiError, requireBuyerSession } from "@/lib/api-auth";
import { listBuyerWins } from "@/services/buyer.service";

import { createModuleLogger } from "@/lib/logger";

const log = createModuleLogger("api.me");

export async function GET(request: Request) {
  try {
    const session = await requireBuyerSession();
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId") ?? undefined;
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Math.min(Number(limitParam), 50) : undefined;

    const wins = await listBuyerWins(session.user.id, tenantId, limit);
    return NextResponse.json({ wins });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    log.error({ err: error }, "me wins GET");
    return NextResponse.json({ error: "Failed to load wins" }, { status: 500 });
  }
}
