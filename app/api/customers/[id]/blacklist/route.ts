import { NextResponse } from "next/server";
import { ApiError, requireApiSession, requireCustomersWrite } from "@/lib/api-auth";
import { setCustomerBlacklist } from "@/services/customer.service";
import { customerBlacklistSchema } from "@/validators/customers";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession();
    requireCustomersWrite(session);
    const { id } = await context.params;

    const body = await request.json();
    const parsed = customerBlacklistSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await setCustomerBlacklist(
      session.user.tenantId!,
      session.user.id,
      id,
      parsed.data
    );
    if (!result) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({ customer: result.customer });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[customer blacklist POST]", error);
    return NextResponse.json({ error: "Failed to update blacklist" }, { status: 500 });
  }
}
