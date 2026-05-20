import { NextResponse } from "next/server";
import { eventFormSchema } from "@/validators/events";
import {
  ApiError,
  requireApiSession,
  requireEventsRead,
  requireEventsWrite,
} from "@/lib/api-auth";
import { createTenantEvent, listTenantEvents } from "@/services/event.service";
import type { EventStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const session = await requireApiSession();
    requireEventsRead(session);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as EventStatus | null;
    const search = searchParams.get("q") ?? undefined;

    const events = await listTenantEvents(session.user.tenantId!, {
      status: status ?? undefined,
      search,
    });

    return NextResponse.json({ events });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[events GET]", error);
    return NextResponse.json({ error: "Failed to load events" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireApiSession();
    requireEventsWrite(session);

    const body = await request.json();
    const parsed = eventFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const event = await createTenantEvent(
      session.user.tenantId!,
      session.user.id,
      parsed.data
    );

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[events POST]", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
