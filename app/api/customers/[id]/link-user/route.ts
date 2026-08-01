import { NextResponse } from "next/server";
import { ApiError, requireApiSession, requireCustomersWrite } from "@/lib/api-auth";
import { linkCustomerToUser } from "@/services/customer.service";
import { linkCustomerUserSchema } from "@/validators/customers";

import { createModuleLogger } from "@/lib/logger";

const log = createModuleLogger("api.customers");

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession();
    requireCustomersWrite(session);

    const { id } = await context.params;
    const body = await request.json();
    const parsed = linkCustomerUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await linkCustomerToUser(
      session.user.tenantId!,
      id,
      parsed.data.userId,
      session.user.id
    );

    if ("error" in result && result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ customer: result.customer });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    log.error({ err: error }, "[customers link-user POST]");
    return NextResponse.json({ error: "Failed to link customer" }, { status: 500 });
  }
}
