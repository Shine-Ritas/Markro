import { NextResponse } from "next/server";
import {
  ApiError,
  requireApiSession,
  requireCustomersRead,
  requireCustomersWrite,
} from "@/lib/api-auth";
import { addCustomerNote, listCustomerNotes } from "@/services/customer.service";
import { customerNoteSchema } from "@/validators/customers";

import { createModuleLogger } from "@/lib/logger";

const log = createModuleLogger("api.customers");

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession();
    requireCustomersRead(session);
    const { id } = await context.params;

    const notes = await listCustomerNotes(session.user.tenantId!, id);
    if (!notes) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({ notes });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    log.error({ err: error }, "[customer notes GET]");
    return NextResponse.json({ error: "Failed to load notes" }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession();
    requireCustomersWrite(session);
    const { id } = await context.params;

    const body = await request.json();
    const parsed = customerNoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const note = await addCustomerNote(
      session.user.tenantId!,
      session.user.id,
      id,
      parsed.data
    );
    if (!note) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    log.error({ err: error }, "[customer notes POST]");
    return NextResponse.json({ error: "Failed to add note" }, { status: 500 });
  }
}
