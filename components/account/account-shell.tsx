"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Home, LogOut, Ticket, Trophy, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BuyerProfileDto } from "@/types/buyer";

const NAV = [
  { href: "/account", label: "Home", icon: Home },
  { href: "/account/tickets", label: "Tickets", icon: Ticket },
  { href: "/account/purchases", label: "Purchases", icon: Wallet },
  { href: "/account/wins", label: "Wins", icon: Trophy },
];

type AccountShellProps = {
  profile: BuyerProfileDto;
  children: React.ReactNode;
};

export function AccountShell({ profile, children }: AccountShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <div>
            <p className="font-heading text-sm font-semibold">
              {pathname === "/account" ? "Home" : "My Account"}
            </p>
            <p className="text-xs text-muted-foreground">{profile.email}</p>
          </div>
          <div className="flex items-center gap-1">
            {profile.hasStaffAccess ? (
              <Button variant="ghost" size="icon" render={<Link href="/dashboard" />}>
                <LayoutDashboard className="size-4" />
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut({ callbackUrl: "/account/login" })}
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6">{children}</main>

      <nav className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto grid max-w-lg grid-cols-4 gap-1 px-2 py-2">
          {NAV.map((item) => {
            const active =
              item.href === "/account"
                ? pathname === "/account"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-lg px-2 py-2 text-[10px] font-medium",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/60"
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
