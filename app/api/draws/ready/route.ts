import { NextResponse } from "next/server";
import { ApiError, requireApiSession, requireEventsRead } from "@/lib/api-auth";
import { listDrawReadyEvents } from "@/services/prize.service";

export async function GET() {
  try {
    const session = await requireApiSession();
    requireEventsRead(session);

    const events = await listDrawReadyEvents(session.user.tenantId!);
    return NextResponse.json({ events });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[draws ready GET]", error);
    return NextResponse.json(
      { error: "Failed to load draw-ready events" },
      { status: 500 }
    );
  }
}
