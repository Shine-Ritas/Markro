import Google from "next-auth/providers/google";

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
}

/** Standard Auth.js Google callback — must match Google Cloud Console redirect URI. */
export function getGoogleOAuthCallbackUrl(): string {
  const base =
    process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/api/auth/callback/google`;
}

export function createGoogleProvider() {
  if (!isGoogleOAuthConfigured()) return null;

  return Google({
    clientId: process.env.AUTH_GOOGLE_ID!,
    clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    allowDangerousEmailAccountLinking: true,
  });
}
