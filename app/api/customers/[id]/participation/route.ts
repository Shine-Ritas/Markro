import { NextResponse } from "next/server";
import { ApiError, requireApiSession, requireCustomersRead } from "@/lib/api-auth";
import { getCustomerParticipation } from "@/services/customer.service";

import { createModuleLogger } from "@/lib/logger";

const log = createModuleLogger("api.customers");

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession();
    requireCustomersRead(session);
    const { id } = await context.params;

    const participation = await getCustomerParticipation(session.user.tenantId!, id);
    if (!participation) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({ participation });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    log.error({ err: error }, "[customer participation GET]");
    return NextResponse.json(
      { error: "Failed to load participation" },
      { status: 500 }
    );
  }
}
