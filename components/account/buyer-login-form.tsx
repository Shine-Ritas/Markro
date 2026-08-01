"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
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
  CredentialsSignin: "Invalid email or password.",
  Default: "Sign in failed. Please try again.",
};

export function BuyerLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/account";
  const authError = searchParams.get("error");
  const [loading, setLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (authError && authError !== "session") {
      toast.error(AUTH_ERRORS[authError] ?? AUTH_ERRORS.Default);
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
      <GoogleSignInButton callbackUrl={callbackUrl} intent="buyer" />

      <AuthDivider />

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="buyer-email">Email</Label>
          <Input
            id="buyer-email"
            type="email"
            autoComplete="email"
            {...form.register("email")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="buyer-password">Password</Label>
          <Input
            id="buyer-password"
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
