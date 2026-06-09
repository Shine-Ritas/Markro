import { NextResponse } from "next/server";
import { ApiError, requireApiSession, requireTicketsRead } from "@/lib/api-auth";
import { getPosDailyStats } from "@/services/pos.service";

export async function GET() {
  try {
    const session = await requireApiSession();
    requireTicketsRead(session);

    const stats = await getPosDailyStats(session.user.tenantId!);
    return NextResponse.json({ stats });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
