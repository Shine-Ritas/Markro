import { auth } from "@/auth";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar userName={session.user.name} userEmail={session.user.email} />
      <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
