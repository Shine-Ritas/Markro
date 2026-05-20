import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config (no Prisma).
 * Used by middleware — do not import @/lib/prisma here.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  providers: [],
  callbacks: {
    jwt({ token }) {
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.isSuperAdmin = Boolean(token.isSuperAdmin);
        session.user.tenantId = token.tenantId as string | undefined;
        session.user.tenantSlug = token.tenantSlug as string | undefined;
        session.user.tenantName = token.tenantName as string | undefined;
        session.user.roleSlug = token.roleSlug as string | undefined;
        session.user.permissions = (token.permissions as string[]) ?? [];
        session.user.authProviders = (token.authProviders as string[]) ?? [];
      }
      return session;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
