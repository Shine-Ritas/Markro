import { NextResponse } from "next/server";
import { ticketAppearanceSchema } from "@/validators/ticket-appearance";
import { ApiError, requireApiSession, requireEventsWrite } from "@/lib/api-auth";
import { updateTenantEventTicketAppearance } from "@/services/event.service";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession();
    requireEventsWrite(session);
    const { id } = await context.params;

    const body = await request.json();
    const parsed = ticketAppearanceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const event = await updateTenantEventTicketAppearance(
      session.user.tenantId!,
      session.user.id,
      id,
      parsed.data
    );

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[events appearance PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update ticket appearance" },
      { status: 500 }
    );
  }
}
