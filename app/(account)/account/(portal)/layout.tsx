import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AccountShell } from "@/components/account/account-shell";
import { getBuyerProfile } from "@/services/buyer.service";

export default async function AccountPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/account/login");
  }

  const profile = await getBuyerProfile(session.user.id);
  if (!profile) {
    redirect("/account/login");
  }

  return <AccountShell profile={profile}>{children}</AccountShell>;
}
