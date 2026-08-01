import { NextResponse } from "next/server";

import { ApiError, requireBuyerSession } from "@/lib/api-auth";
import { listFeaturedPublishedEvents } from "@/services/buyer.service";

import { createModuleLogger } from "@/lib/logger";

const log = createModuleLogger("api.me");

export async function GET(request: Request) {
  try {
    await requireBuyerSession();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? 3), 10);

    const events = await listFeaturedPublishedEvents(limit);
    return NextResponse.json({ events });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    log.error({ err: error }, "me events featured GET");
    return NextResponse.json(
      { error: "Failed to load featured events" },
      { status: 500 }
    );
  }
}
