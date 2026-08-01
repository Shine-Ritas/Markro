import { NextResponse } from "next/server";
import {
  ApiError,
  requireApiSession,
  requireCustomersRead,
  requireCustomersWrite,
} from "@/lib/api-auth";
import {
  getTenantCustomerById,
  softDeleteCustomer,
  updateTenantCustomer,
} from "@/services/customer.service";
import { customerFormSchema } from "@/validators/customers";

import { createModuleLogger } from "@/lib/logger";

const log = createModuleLogger("api.customers");

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession();
    requireCustomersRead(session);
    const { id } = await context.params;

    const customer = await getTenantCustomerById(session.user.tenantId!, id);
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({ customer });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    log.error({ err: error }, "[customers GET id]");
    return NextResponse.json({ error: "Failed to load customer" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession();
    requireCustomersWrite(session);
    const { id } = await context.params;

    const body = await request.json();
    const parsed = customerFormSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await updateTenantCustomer(
      session.user.tenantId!,
      session.user.id,
      id,
      parsed.data
    );
    if (!result) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }
    if ("error" in result && result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ customer: result.customer });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    log.error({ err: error }, "[customers PATCH]");
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession();
    requireCustomersWrite(session);
    const { id } = await context.params;

    const result = await softDeleteCustomer(
      session.user.tenantId!,
      session.user.id,
      id
    );
    if (!result) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    log.error({ err: error }, "[customers DELETE]");
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 });
  }
}
