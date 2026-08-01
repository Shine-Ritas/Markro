import { NextResponse } from "next/server";

import { ApiError, requireBuyerSession } from "@/lib/api-auth";
import { getBuyerProfile } from "@/services/buyer.service";

import { createModuleLogger } from "@/lib/logger";

const log = createModuleLogger("api.me");

export async function GET() {
  try {
    const session = await requireBuyerSession();
    const profile = await getBuyerProfile(session.user.id);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    return NextResponse.json({ profile });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    log.error({ err: error }, "me GET");
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}
