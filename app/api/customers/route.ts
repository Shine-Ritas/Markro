import { NextResponse } from "next/server";
import {
  ApiError,
  requireApiSession,
  requireCustomersRead,
  requireCustomersWrite,
} from "@/lib/api-auth";
import {
  backfillCustomersFromPosSales,
  createTenantCustomer,
  listTenantCustomers,
} from "@/services/customer.service";
import { customerFormSchema, customerListQuerySchema } from "@/validators/customers";

import { createModuleLogger } from "@/lib/logger";

const log = createModuleLogger("api.customers");

export async function GET(request: Request) {
  try {
    const session = await requireApiSession();
    requireCustomersRead(session);

    const { searchParams } = new URL(request.url);
    const parsed = customerListQuerySchema.safeParse(Object.fromEntries(searchParams));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await listTenantCustomers(session.user.tenantId!, parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    log.error({ err: error }, "[customers GET]");
    return NextResponse.json({ error: "Failed to load customers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireApiSession();
    requireCustomersWrite(session);

    const body = await request.json();
    const parsed = customerFormSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await createTenantCustomer(
      session.user.tenantId!,
      session.user.id,
      parsed.data
    );
    if ("error" in result && result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ customer: result.customer }, { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    log.error({ err: error }, "[customers POST]");
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}

export async function PUT() {
  try {
    const session = await requireApiSession();
    requireCustomersWrite(session);

    const result = await backfillCustomersFromPosSales(session.user.tenantId!);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    log.error({ err: error }, "[customers backfill PUT]");
    return NextResponse.json(
      { error: "Failed to backfill customers" },
      { status: 500 }
    );
  }
}
