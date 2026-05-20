import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";
import { authConfig } from "@/auth.config";
import { provisionOAuthUser } from "@/lib/auth-provisioning";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { getPrimaryStaffMembership } from "@/lib/tenant";

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

  return {
    sub: userId,
    isSuperAdmin: dbUser.isSuperAdmin,
    tenantId: membership?.tenantId,
    tenantSlug: membership?.tenantSlug,
    tenantName: membership?.tenantName,
    roleSlug: membership?.roleSlug ?? (dbUser.isSuperAdmin ? "super_admin" : undefined),
    permissions: membership?.permissions ?? (dbUser.isSuperAdmin ? ["*"] : []),
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
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

      if (account?.provider === "google") {
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

      return true;
    },
    async jwt({ token, user }) {
      // Only hit Prisma on sign-in (Node.js). Middleware reads JWT without DB.
      if (user?.id) {
        const enriched = await enrichToken(user.id);
        if (!enriched) return token;
        return { ...token, ...enriched };
      }

      return token;
    },
  },
  events: {
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
