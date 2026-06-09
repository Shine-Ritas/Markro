import { NextResponse } from "next/server";
import { ApiError, requireApiSession, requireTicketsWrite } from "@/lib/api-auth";
import { cancelPosDraft, getPosSaleById, updatePosDraft } from "@/services/pos.service";
import { posSaleUpdateSchema } from "@/validators/pos";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession();
    requireTicketsWrite(session);
    const { id } = await context.params;

    const sale = await getPosSaleById(session.user.tenantId!, id);
    if (!sale) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ sale });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to load sale" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession();
    requireTicketsWrite(session);
    const { id } = await context.params;

    const body = await request.json();
    const parsed = posSaleUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const result = await updatePosDraft(session.user.tenantId!, id, parsed.data);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ sale: result.sale });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to update draft" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession();
    requireTicketsWrite(session);
    const { id } = await context.params;

    const result = await cancelPosDraft(session.user.tenantId!, id);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to cancel draft" }, { status: 500 });
  }
}
