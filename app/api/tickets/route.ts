import { NextResponse } from "next/server";
import { ApiError, requireApiSession, requireTicketsRead } from "@/lib/api-auth";
import { listTenantTickets } from "@/services/ticket.service";

export async function GET(request: Request) {
  try {
    const session = await requireApiSession();
    requireTicketsRead(session);

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId") ?? undefined;

    const tickets = await listTenantTickets(session.user.tenantId!, { eventId });
    return NextResponse.json({ tickets });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to load tickets" }, { status: 500 });
  }
}
