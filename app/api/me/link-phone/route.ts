import { NextResponse } from "next/server";
import { ApiError, requireBuyerSession } from "@/lib/api-auth";
import {
  confirmPhoneVerification,
  requestPhoneVerification,
} from "@/services/buyer.service";
import { linkPhoneSchema } from "@/validators/buyer";

export async function POST(request: Request) {
  try {
    const session = await requireBuyerSession();
    const body = await request.json();
    const parsed = linkPhoneSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    if (parsed.data.action === "request") {
      const result = await requestPhoneVerification(session.user.id, parsed.data.phone);
      return NextResponse.json(result);
    }

    const result = await confirmPhoneVerification(
      session.user.id,
      parsed.data.phone,
      parsed.data.code
    );

    if ("error" in result && result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, linkedCount: result.linkedCount });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[me link-phone POST]", error);
    return NextResponse.json(
      { error: "Failed to process phone link" },
      { status: 500 }
    );
  }
}
