import { NextResponse } from "next/server";
import { ApiError, requireApiSession, requireCustomersWrite } from "@/lib/api-auth";
import { lookupGlobalUsers } from "@/services/customer.service";

export async function GET(request: Request) {
  try {
    const session = await requireApiSession();
    requireCustomersWrite(session);

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";
    if (!q) {
      return NextResponse.json({ users: [] });
    }

    const users = await lookupGlobalUsers(q);
    return NextResponse.json({ users });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[customers lookup-global GET]", error);
    return NextResponse.json(
      { error: "Failed to search global users" },
      { status: 500 }
    );
  }
}
