import { NextResponse } from "next/server";
import { ApiError, requireApiSession, requireEventsRead } from "@/lib/api-auth";
import { listEventWinners } from "@/services/draw.service";

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
    console.error("[event winners GET]", error);
    return NextResponse.json({ error: "Failed to load winners" }, { status: 500 });
  }
}
