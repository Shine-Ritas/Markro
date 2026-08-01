"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AuthDivider } from "@/components/auth/auth-divider";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buyerRegisterSchema } from "@/validators/buyer";
import type { z } from "zod";

type RegisterValues = z.infer<typeof buyerRegisterSchema>;

export function BuyerRegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(buyerRegisterSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  async function onSubmit(values: RegisterValues) {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/buyer/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Registration failed");
        return;
      }
      toast.success(
        json.linkedCustomerCount > 0
          ? `Account created! Linked ${json.linkedCustomerCount} purchase history.`
          : "Account created. Sign in to continue."
      );
      router.push("/account/login");
    } catch {
      toast.error("Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <GoogleSignInButton
        callbackUrl="/account"
        intent="buyer"
        label="Sign up with Google"
        mode="signup"
      />

      <AuthDivider />

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="buyer-name">Full name</Label>
          <Input id="buyer-name" {...form.register("name")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="buyer-reg-email">Email</Label>
          <Input id="buyer-reg-email" type="email" {...form.register("email")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="buyer-reg-password">Password</Label>
          <Input
            id="buyer-reg-password"
            type="password"
            autoComplete="new-password"
            {...form.register("password")}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Organizer?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Create an organization
        </Link>
      </p>
    </div>
  );
}
