import { NextResponse } from "next/server";
import { ApiError, requireApiSession, requireTicketsWrite } from "@/lib/api-auth";
import { completePosSale } from "@/services/pos.service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession();
    requireTicketsWrite(session);
    const { id } = await context.params;

    const result = await completePosSale(session.user.tenantId!, id, session.user.id);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ sale: result.sale });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to complete sale" }, { status: 500 });
  }
}
