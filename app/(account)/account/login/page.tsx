import { Suspense } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { BuyerLoginForm } from "@/components/account/buyer-login-form";

export default function AccountLoginPage() {
  return (
    <AuthCard
      title="Sign in to your account"
      description="View your tickets, purchases, and wins"
      footer={
        <p>
          No account?{" "}
          <Link
            href="/account/register"
            className="font-medium text-primary hover:underline"
          >
            Create one
          </Link>
        </p>
      }
    >
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <BuyerLoginForm />
      </Suspense>
    </AuthCard>
  );
}
