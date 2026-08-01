import { NextResponse } from "next/server";
import {
  ApiError,
  requireApiSession,
  requireCustomersRead,
  requireCustomersWrite,
} from "@/lib/api-auth";
import { createReferral, listCustomerReferrals } from "@/services/customer.service";
import { referralCreateSchema } from "@/validators/customers";

import { createModuleLogger } from "@/lib/logger";

const log = createModuleLogger("api.customers");

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession();
    requireCustomersRead(session);
    const { id } = await context.params;

    const referrals = await listCustomerReferrals(session.user.tenantId!, id);
    if (!referrals) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({ referrals });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    log.error({ err: error }, "[customer referrals GET]");
    return NextResponse.json({ error: "Failed to load referrals" }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession();
    requireCustomersWrite(session);
    const { id } = await context.params;

    const body = await request.json();
    const parsed = referralCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const referral = await createReferral(
      session.user.tenantId!,
      session.user.id,
      id,
      parsed.data
    );
    if (!referral) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({ referral }, { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    log.error({ err: error }, "[customer referrals POST]");
    return NextResponse.json({ error: "Failed to create referral" }, { status: 500 });
  }
}
