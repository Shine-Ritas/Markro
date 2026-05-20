import { NextResponse } from "next/server";
import { ApiError, requireApiSession, requireTicketsRead } from "@/lib/api-auth";
import { getTicketById } from "@/services/ticket.service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession();
    requireTicketsRead(session);
    const { id } = await context.params;

    const ticket = await getTicketById(session.user.tenantId!, id);
    if (!ticket) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to load ticket" }, { status: 500 });
  }
}
