import { NextResponse } from "next/server";

import { ApiError, requireBuyerSession } from "@/lib/api-auth";
import { listExplorePublishedEvents } from "@/services/buyer.service";

import { createModuleLogger } from "@/lib/logger";

const log = createModuleLogger("api.me");

export async function GET(request: Request) {
  try {
    await requireBuyerSession();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);
    const offset = Math.max(Number(searchParams.get("offset") ?? 0), 0);

    const result = await listExplorePublishedEvents({ limit, offset });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    log.error({ err: error }, "me events explore GET");
    return NextResponse.json({ error: "Failed to load events" }, { status: 500 });
  }
}
