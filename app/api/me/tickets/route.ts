import { NextResponse } from "next/server";
import { ApiError, requireBuyerSession } from "@/lib/api-auth";
import { listBuyerTickets } from "@/services/buyer.service";

export async function GET(request: Request) {
  try {
    const session = await requireBuyerSession();
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId") ?? undefined;

    const tickets = await listBuyerTickets(session.user.id, tenantId);
    return NextResponse.json({ tickets });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[me tickets GET]", error);
    return NextResponse.json({ error: "Failed to load tickets" }, { status: 500 });
  }
}
