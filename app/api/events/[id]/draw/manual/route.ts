import { NextResponse } from "next/server";
import { ApiError, requireApiSession, requireDrawsRun } from "@/lib/api-auth";
import { getActiveDrawSession, pickManualWinner } from "@/services/draw.service";
import { manualPickSchema } from "@/validators/draws";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession();
    requireDrawsRun(session);
    const { id: eventId } = await context.params;

    const body = await request.json();
    const parsed = manualPickSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const active = await getActiveDrawSession(session.user.tenantId!, eventId);
    if (!active) {
      return NextResponse.json({ error: "No active draw session" }, { status: 400 });
    }

    const result = await pickManualWinner(
      session.user.tenantId!,
      active.id,
      session.user.id,
      parsed.data.ticketNumber
    );

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ winner: result.winner, session: result.session });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[draw manual]", error);
    return NextResponse.json({ error: "Failed to pick winner" }, { status: 500 });
  }
}
