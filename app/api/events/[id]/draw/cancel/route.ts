import { NextResponse } from "next/server";
import { ApiError, requireApiSession, requireDrawsRun } from "@/lib/api-auth";
import { cancelDrawSession, getActiveDrawSession } from "@/services/draw.service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession();
    requireDrawsRun(session);
    const { id: eventId } = await context.params;

    const active = await getActiveDrawSession(session.user.tenantId!, eventId);
    if (!active) {
      return NextResponse.json({ error: "No active draw session" }, { status: 400 });
    }

    const result = await cancelDrawSession(
      session.user.tenantId!,
      active.id,
      session.user.id
    );

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[draw cancel]", error);
    return NextResponse.json({ error: "Failed to cancel draw" }, { status: 500 });
  }
}
