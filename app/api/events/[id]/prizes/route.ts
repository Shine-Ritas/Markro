import { NextResponse } from "next/server";
import { eventPrizesSchema } from "@/validators/prizes";
import {
  ApiError,
  requireApiSession,
  requireEventsRead,
  requireEventsWrite,
} from "@/lib/api-auth";
import { listEventPrizes, setEventPrizes } from "@/services/prize.service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession();
    requireEventsRead(session);
    const { id } = await context.params;

    const prizes = await listEventPrizes(session.user.tenantId!, id);
    return NextResponse.json({ prizes });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[event prizes GET]", error);
    return NextResponse.json({ error: "Failed to load event prizes" }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession();
    requireEventsWrite(session);
    const { id } = await context.params;

    const body = await request.json();
    const parsed = eventPrizesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await setEventPrizes(
      session.user.tenantId!,
      session.user.id,
      id,
      parsed.data
    );

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ prizes: result.prizes });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[event prizes PUT]", error);
    return NextResponse.json({ error: "Failed to save event prizes" }, { status: 500 });
  }
}
