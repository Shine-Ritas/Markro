import { NextResponse } from "next/server";

import { ApiError, requireApiSession, requireTicketsRead } from "@/lib/api-auth";
import { listTenantPosSales } from "@/services/pos.service";
import { posSalesHistoryQuerySchema } from "@/validators/pos";

import { createModuleLogger } from "@/lib/logger";

const log = createModuleLogger("api.pos");

export async function GET(request: Request) {
  try {
    const session = await requireApiSession();
    requireTicketsRead(session);

    const { searchParams } = new URL(request.url);
    const parsed = posSalesHistoryQuerySchema.safeParse({
      eventId: searchParams.get("eventId") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      q: searchParams.get("q") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      offset: searchParams.get("offset") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await listTenantPosSales(session.user.tenantId!, parsed.data);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    log.error({ err: error }, "pos/sales/history GET");
    return NextResponse.json(
      { error: "Failed to load sales history" },
      { status: 500 }
    );
  }
}
