import { NextResponse } from "next/server";
import { prizeFormSchema } from "@/validators/prizes";
import { ApiError, requireApiSession, requireEventsWrite } from "@/lib/api-auth";
import {
  deleteTenantPrize,
  getTenantPrizeById,
  updateTenantPrize,
} from "@/services/prize.service";

import { createModuleLogger } from "@/lib/logger";

const log = createModuleLogger("api.prizes");

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession();
    requireEventsWrite(session);
    const { id } = await context.params;

    const prize = await getTenantPrizeById(session.user.tenantId!, id);
    if (!prize) {
      return NextResponse.json({ error: "Prize not found" }, { status: 404 });
    }

    return NextResponse.json({ prize });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    log.error({ err: error }, "[prizes GET id]");
    return NextResponse.json({ error: "Failed to load prize" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession();
    requireEventsWrite(session);
    const { id } = await context.params;

    const body = await request.json();
    const parsed = prizeFormSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const prize = await updateTenantPrize(
      session.user.tenantId!,
      session.user.id,
      id,
      parsed.data
    );

    if (!prize) {
      return NextResponse.json({ error: "Prize not found" }, { status: 404 });
    }

    return NextResponse.json({ prize });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    log.error({ err: error }, "[prizes PATCH]");
    return NextResponse.json({ error: "Failed to update prize" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession();
    requireEventsWrite(session);
    const { id } = await context.params;

    const prize = await deleteTenantPrize(session.user.tenantId!, session.user.id, id);
    if (!prize) {
      return NextResponse.json({ error: "Prize not found" }, { status: 404 });
    }

    return NextResponse.json({ prize });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    log.error({ err: error }, "[prizes DELETE]");
    return NextResponse.json({ error: "Failed to delete prize" }, { status: 500 });
  }
}
