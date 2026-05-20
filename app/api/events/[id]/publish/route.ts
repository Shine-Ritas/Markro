import { NextResponse } from "next/server";
import { ApiError, requireApiSession, requireEventsWrite } from "@/lib/api-auth";
import { publishTenantEvent } from "@/services/event.service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession();
    requireEventsWrite(session);
    const { id } = await context.params;

    const event = await publishTenantEvent(session.user.tenantId!, session.user.id, id);

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[events publish]", error);
    return NextResponse.json({ error: "Failed to publish event" }, { status: 500 });
  }
}
