import { NextResponse } from "next/server";
import {
  ApiError,
  requireApiSession,
  requireTicketsRead,
  requireTicketsWrite,
} from "@/lib/api-auth";
import { generateTicketsSchema } from "@/validators/tickets";
import { generateEventTickets, listEventTickets } from "@/services/ticket.service";
import type { TicketStatus } from "@prisma/client";

import { createModuleLogger } from "@/lib/logger";

const log = createModuleLogger("api.events");

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession();
    requireTicketsRead(session);
    const { id: eventId } = await context.params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as TicketStatus | null;
    const search = searchParams.get("q") ?? undefined;

    const tickets = await listEventTickets(session.user.tenantId!, eventId, {
      status: status ?? undefined,
      search,
    });

    return NextResponse.json({ tickets });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    log.error({ err: error }, "[event tickets GET]");
    return NextResponse.json({ error: "Failed to load tickets" }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession();
    requireTicketsWrite(session);
    const { id: eventId } = await context.params;

    const body = await request.json();
    const parsed = generateTicketsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await generateEventTickets(
      session.user.tenantId!,
      eventId,
      session.user.id,
      parsed.data
    );

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ tickets: result.tickets }, { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    log.error({ err: error }, "[event tickets POST]");
    return NextResponse.json({ error: "Failed to generate tickets" }, { status: 500 });
  }
}
