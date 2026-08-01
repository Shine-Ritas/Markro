import NextAuth from "next-auth";

import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import { cookies } from "next/headers";
import { z } from "zod";
import { authConfig } from "@/auth.config";
import { createGoogleProvider } from "@/lib/auth-google";
import { provisionOAuthUser } from "@/lib/auth-provisioning";
import { assignGlobalUserCode } from "@/lib/global-user-code";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { claimCustomersByEmail } from "@/services/buyer.service";
import { getPrimaryStaffMembership } from "@/lib/tenant";

import { createModuleLogger } from "@/lib/logger";

const log = createModuleLogger("auth");

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

async function enrichToken(userId: string) {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isSuperAdmin: true, deletedAt: true },
  });

  if (!dbUser || dbUser.deletedAt) return null;

  const membership = await getPrimaryStaffMembership(userId);

  const accounts = await prisma.account.findMany({
    where: { userId },
    select: { provider: true },
  });
  const providers = new Set(accounts.map((a) => a.provider));
  const userAuth = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (userAuth?.passwordHash) providers.add("credentials");

  return {
    sub: userId,
    isSuperAdmin: dbUser.isSuperAdmin,
    tenantId: membership?.tenantId,
    tenantSlug: membership?.tenantSlug,
    tenantName: membership?.tenantName,
    roleSlug: membership?.roleSlug ?? (dbUser.isSuperAdmin ? "super_admin" : undefined),
    permissions: membership?.permissions ?? (dbUser.isSuperAdmin ? ["*"] : []),
    authProviders: Array.from(providers),
  };
}

const googleProvider = createGoogleProvider();

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    ...(googleProvider ? [googleProvider] : []),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });

        if (!user?.passwordHash || user.deletedAt) return null;

        const valid = await verifyPassword(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          isSuperAdmin: user.isSuperAdmin,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (!user.email) return false;

      try {
        if (account?.provider === "google") {
          const cookieStore = await cookies();
          const intent = cookieStore.get("auth_intent")?.value ?? "staff";

          if (intent === "buyer") {
            if (user.id) await claimCustomersByEmail(user.id);
            return true;
          }

          const staffCount = await prisma.staff.count({
            where: { userId: user.id!, deletedAt: null },
          });
          if (staffCount === 0) {
            await provisionOAuthUser({
              id: user.id!,
              email: user.email,
              name: user.name,
            });
          }
        }

        if (user.id && account?.provider === "credentials") {
          await claimCustomersByEmail(user.id);
        }
      } catch (error) {
        log.error({ err: error }, "auth signIn callback");
      }

      return true;
    },
    async jwt({ token, user }) {
      // Only hit Prisma on sign-in (Node.js). Middleware reads JWT without DB.
      if (user?.id) {
        await assignGlobalUserCode(user.id);
        const enriched = await enrichToken(user.id);
        if (!enriched) return token;
        return { ...token, ...enriched };
      }

      return token;
    },
  },
  events: {
    async createUser({ user }) {
      if (user.id) {
        await assignGlobalUserCode(user.id);
      }
    },
    async signIn({ user, account }) {
      if (user.id && account?.provider) {
        await prisma.auditLog.create({
          data: {
            action: "auth.sign_in",
            entity: "user",
            entityId: user.id,
            actorId: user.id,
            metadata: { provider: account.provider },
          },
        });
      }
    },
  },
});
