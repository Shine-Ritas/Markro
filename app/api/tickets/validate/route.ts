import { NextResponse } from "next/server";
import { ApiError, requireApiSession, requireTicketsWrite } from "@/lib/api-auth";
import { validateTicketSchema } from "@/validators/tickets";
import { validateTicketByQrToken } from "@/services/ticket.service";

export async function POST(request: Request) {
  try {
    const session = await requireApiSession();
    requireTicketsWrite(session);

    const body = await request.json();
    const parsed = validateTicketSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await validateTicketByQrToken(
      session.user.tenantId!,
      parsed.data.qrToken,
      session.user.id
    );

    return NextResponse.json(result, {
      status: result.valid ? 200 : result.duplicate ? 409 : 400,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[tickets validate]", error);
    return NextResponse.json({ error: "Validation failed" }, { status: 500 });
  }
}
