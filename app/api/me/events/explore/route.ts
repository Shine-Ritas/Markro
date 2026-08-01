import { NextResponse } from "next/server";
import { ApiError, requireBuyerSession } from "@/lib/api-auth";
import { listExplorePublishedEvents } from "@/services/buyer.service";

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
    console.error("[me events explore GET]", error);
    return NextResponse.json({ error: "Failed to load events" }, { status: 500 });
  }
}
