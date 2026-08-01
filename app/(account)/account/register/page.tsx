import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { BuyerRegisterForm } from "@/components/account/buyer-register-form";

export default function AccountRegisterPage() {
  return (
    <AuthCard
      title="Create your account"
      description="Track tickets and wins across all organizers"
      footer={
        <p>
          Already have an account?{" "}
          <Link
            href="/account/login"
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <BuyerRegisterForm />
    </AuthCard>
  );
}
