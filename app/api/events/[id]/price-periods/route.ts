import { NextResponse } from "next/server";
import {
  ApiError,
  requireApiSession,
  requireEventsRead,
  requireEventsWrite,
} from "@/lib/api-auth";
import { ticketPricePeriodSchema } from "@/validators/tickets";
import {
  createEventPricePeriod,
  listEventPricePeriods,
} from "@/services/ticket.service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession();
    requireEventsRead(session);
    const { id: eventId } = await context.params;

    const periods = await listEventPricePeriods(session.user.tenantId!, eventId);
    return NextResponse.json({ periods });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to load prices" }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession();
    requireEventsWrite(session);
    const { id: eventId } = await context.params;

    const body = await request.json();
    const parsed = ticketPricePeriodSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const period = await createEventPricePeriod(
      session.user.tenantId!,
      eventId,
      parsed.data
    );

    return NextResponse.json({ period }, { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: "Failed to create price period" },
      { status: 500 }
    );
  }
}
