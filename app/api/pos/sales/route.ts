import { NextResponse } from "next/server";
import { ApiError, requireApiSession, requireTicketsWrite } from "@/lib/api-auth";
import { createPosDraft, listPosDrafts } from "@/services/pos.service";
import { posSaleDraftSchema } from "@/validators/pos";

export async function GET() {
  try {
    const session = await requireApiSession();
    requireTicketsWrite(session);

    const drafts = await listPosDrafts(session.user.tenantId!);
    return NextResponse.json({ drafts });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to load drafts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireApiSession();
    requireTicketsWrite(session);

    const body = await request.json();
    const parsed = posSaleDraftSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const result = await createPosDraft(
      session.user.tenantId!,
      session.user.id,
      parsed.data
    );

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ sale: result.sale }, { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to create draft" }, { status: 500 });
  }
}
