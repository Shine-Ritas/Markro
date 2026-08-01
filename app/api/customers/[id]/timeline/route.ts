import { NextResponse } from "next/server";
import { ApiError, requireApiSession, requireCustomersRead } from "@/lib/api-auth";
import { getCustomerTimeline } from "@/services/customer.service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession();
    requireCustomersRead(session);
    const { id } = await context.params;

    const timeline = await getCustomerTimeline(session.user.tenantId!, id);
    if (!timeline) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({ timeline });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[customer timeline GET]", error);
    return NextResponse.json({ error: "Failed to load timeline" }, { status: 500 });
  }
}
