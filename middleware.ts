import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

const publicPaths = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/design-system",
  "/account/login",
  "/account/register",
];

function isPublicPath(pathname: string) {
  if (publicPaths.includes(pathname)) return true;
  if (pathname.startsWith("/api/auth")) return true;
  if (pathname.startsWith("/api/")) return true;
  if (pathname.startsWith("/org/")) return true;
  return false;
}

function isStaffAuthPath(pathname: string) {
  return ["/login", "/register", "/forgot-password", "/reset-password"].includes(
    pathname
  );
}

function isBuyerAuthPath(pathname: string) {
  return ["/account/login", "/account/register"].includes(pathname);
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user?.id;
  const isPublic = isPublicPath(pathname);
  const hasTenant = Boolean(req.auth?.user?.tenantId);
  const isSuperAdmin = Boolean(req.auth?.user?.isSuperAdmin);
  const canUseDashboard = hasTenant || isSuperAdmin;

  if (!isLoggedIn && !isPublic) {
    const loginUrl = new URL(
      pathname.startsWith("/account") ? "/account/login" : "/login",
      req.nextUrl.origin
    );
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && isStaffAuthPath(pathname)) {
    return NextResponse.redirect(
      new URL(canUseDashboard ? "/dashboard" : "/account", req.nextUrl.origin)
    );
  }

  if (isLoggedIn && isBuyerAuthPath(pathname)) {
    return NextResponse.redirect(new URL("/account", req.nextUrl.origin));
  }

  const response = NextResponse.next();

  if (isLoggedIn && req.auth?.user?.tenantId) {
    response.headers.set("x-tenant-id", req.auth.user.tenantId);
  }

  return response;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
