import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Forgot password"
      description="We'll generate a reset link (email delivery in a later phase)"
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
