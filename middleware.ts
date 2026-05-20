import { NextResponse } from "next/server";

// Phase 2: tenant isolation + auth guards
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
