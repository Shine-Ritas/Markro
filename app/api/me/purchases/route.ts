import { NextResponse } from "next/server";

import { ApiError, requireBuyerSession } from "@/lib/api-auth";
import { listBuyerPurchases } from "@/services/buyer.service";

import { createModuleLogger } from "@/lib/logger";

const log = createModuleLogger("api.me");

export async function GET(request: Request) {
  try {
    const session = await requireBuyerSession();
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId") ?? undefined;

    const purchases = await listBuyerPurchases(session.user.id, tenantId);
    return NextResponse.json({ purchases });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    log.error({ err: error }, "me purchases GET");
    return NextResponse.json({ error: "Failed to load purchases" }, { status: 500 });
  }
}
