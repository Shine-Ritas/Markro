"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { AuthDivider } from "@/components/auth/auth-divider";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerSchema } from "@/validators/auth";

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      organizationName: "",
      name: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: RegisterFormValues) {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Registration failed");
        setLoading(false);
        return;
      }

      toast.success("Account created! Signing you in…");

      const signInResult = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (signInResult?.error || !signInResult?.ok) {
        toast.info("Account created. Please sign in.");
        router.push("/login");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <GoogleSignInButton
        label="Sign up with Google"
        callbackUrl="/dashboard"
        mode="signup"
        intent="staff"
      />

      <AuthDivider />

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="organizationName">Organization name</Label>
          <Input id="organizationName" {...form.register("organizationName")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Your name</Label>
          <Input id="name" {...form.register("name")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            {...form.register("email")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...form.register("password")}
          />
          {form.formState.errors.password ? (
            <p className="text-xs text-destructive">
              {form.formState.errors.password.message}
            </p>
          ) : null}
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </div>
  );
}
