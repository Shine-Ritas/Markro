import { NextResponse } from "next/server";
import { ApiError, requireApiSession, requireTicketsWrite } from "@/lib/api-auth";
import { markTicketsSold } from "@/services/ticket.service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession();
    requireTicketsWrite(session);
    const { id } = await context.params;

    const count = await markTicketsSold(session.user.tenantId!, session.user.id, [id]);

    if (count === 0) {
      return NextResponse.json(
        { error: "Ticket not available for sale" },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to mark sold" }, { status: 500 });
  }
}
