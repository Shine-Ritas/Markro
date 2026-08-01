import { NextResponse } from "next/server";

import { ApiError, requireApiSession, requireTicketsWrite } from "@/lib/api-auth";
import { listTenantCustomers } from "@/services/customer.service";

import { createModuleLogger } from "@/lib/logger";

const log = createModuleLogger("api.pos");

export async function GET(request: Request) {
  try {
    const session = await requireApiSession();
    requireTicketsWrite(session);

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? undefined;
    const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);

    const result = await listTenantCustomers(session.user.tenantId!, {
      q,
      limit,
      offset: 0,
    });

    return NextResponse.json({
      customers: result.customers.map((c) => ({
        id: c.id,
        displayName: c.displayName,
        phone: c.phone,
        email: c.email,
        isBlacklisted: c.isBlacklisted,
        loyaltyPoints: c.loyaltyPoints,
        globalUserCode: c.globalUserCode,
      })),
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    log.error({ err: error }, "pos customers search GET");
    return NextResponse.json({ error: "Failed to search customers" }, { status: 500 });
  }
}
