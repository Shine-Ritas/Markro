import { NextResponse } from "next/server";
import { ApiError, requireApiSession, requireCustomersWrite } from "@/lib/api-auth";
import { lookupGlobalUsers } from "@/services/customer.service";

import { createModuleLogger } from "@/lib/logger";

const log = createModuleLogger("api.customers");

export async function GET(request: Request) {
  try {
    const session = await requireApiSession();
    requireCustomersWrite(session);

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";
    if (!q) {
      return NextResponse.json({ users: [] });
    }

    const users = await lookupGlobalUsers(q);
    return NextResponse.json({ users });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    log.error({ err: error }, "[customers lookup-global GET]");
    return NextResponse.json(
      { error: "Failed to search global users" },
      { status: 500 }
    );
  }
}
