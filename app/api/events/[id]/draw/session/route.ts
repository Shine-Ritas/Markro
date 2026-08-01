import { NextResponse } from "next/server";
import { ApiError, requireApiSession, requireDrawsRun } from "@/lib/api-auth";
import { getActiveDrawSession } from "@/services/draw.service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession();
    requireDrawsRun(session);
    const { id } = await context.params;

    const drawSession = await getActiveDrawSession(session.user.tenantId!, id);

    return NextResponse.json({ session: drawSession });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[draw session GET]", error);
    return NextResponse.json({ error: "Failed to load draw session" }, { status: 500 });
  }
}
