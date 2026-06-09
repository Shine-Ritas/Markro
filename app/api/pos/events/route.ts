import { NextResponse } from "next/server";
import { ApiError, requireApiSession, requireTicketsRead } from "@/lib/api-auth";
import { listPosEvents } from "@/services/pos.service";

export async function GET() {
  try {
    const session = await requireApiSession();
    requireTicketsRead(session);

    const events = await listPosEvents(session.user.tenantId!);
    return NextResponse.json({ events });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to load POS events" }, { status: 500 });
  }
}
