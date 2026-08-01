"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AuthDivider } from "@/components/auth/auth-divider";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema } from "@/validators/auth";
import type { z } from "zod";

type LoginFormValues = z.infer<typeof loginSchema>;

const AUTH_ERRORS: Record<string, string> = {
  Configuration:
    "Google sign-in failed (redirect URI mismatch). In Google Cloud Console, set the redirect URI to http://localhost:3000/api/auth/callback/google",
  CredentialsSignin: "Invalid email or password.",
  OAuthAccountNotLinked:
    "This email is registered with a password. Sign in with email first, then link Google from settings (Phase 3).",
  OAuthSignin: "Google sign-in failed. Check OAuth credentials and redirect URI.",
  AccessDenied: "Access denied.",
  Default: "Sign in failed. Please try again.",
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const authError = searchParams.get("error");
  const [loading, setLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (authError && authError !== "session") {
      const message = AUTH_ERRORS[authError] ?? AUTH_ERRORS.Default;
      toast.error(message);
    }
  }, [authError]);

  async function onSubmit(values: LoginFormValues) {
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error(AUTH_ERRORS[result.error] ?? AUTH_ERRORS.CredentialsSignin);
        return;
      }

      if (!result?.ok) {
        toast.error(AUTH_ERRORS.Default);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      toast.error(AUTH_ERRORS.Default);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <GoogleSignInButton callbackUrl={callbackUrl} intent="staff" />

      <AuthDivider />

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            {...form.register("email")}
          />
          {form.formState.errors.email ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.email.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...form.register("password")}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
