import { NextResponse } from "next/server";
import { ApiError, requireApiSession, requireEventsWrite } from "@/lib/api-auth";
import { deleteEventPricePeriod } from "@/services/ticket.service";

type RouteContext = { params: Promise<{ id: string; periodId: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession();
    requireEventsWrite(session);
    const { id: eventId, periodId } = await context.params;

    const ok = await deleteEventPricePeriod(session.user.tenantId!, eventId, periodId);

    if (!ok) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
