import { NextResponse } from "next/server";
import { eventFormSchema } from "@/validators/events";
import {
  ApiError,
  requireApiSession,
  requireEventsRead,
  requireEventsWrite,
} from "@/lib/api-auth";
import {
  deleteTenantEvent,
  getTenantEventById,
  updateTenantEvent,
} from "@/services/event.service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession();
    requireEventsRead(session);
    const { id } = await context.params;

    const event = await getTenantEventById(session.user.tenantId!, id);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[events GET id]", error);
    return NextResponse.json({ error: "Failed to load event" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession();
    requireEventsWrite(session);
    const { id } = await context.params;

    const body = await request.json();
    const parsed = eventFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const event = await updateTenantEvent(
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
    if (error instanceof Error && error.message) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[events PATCH]", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession();
    requireEventsWrite(session);
    const { id } = await context.params;

    const event = await deleteTenantEvent(session.user.tenantId!, session.user.id, id);

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[events DELETE]", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
