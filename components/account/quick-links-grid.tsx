"use client";

import Link from "next/link";
import { Ticket, Trophy, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  {
    href: "/account/tickets",
    label: "Tickets",
    description: "Your numbers",
    icon: Ticket,
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    href: "/account/purchases",
    label: "Purchases",
    description: "Receipts",
    icon: Wallet,
    color: "bg-emerald-500/10 text-emerald-600",
  },
  {
    href: "/account/wins",
    label: "Wins",
    description: "Prizes",
    icon: Trophy,
    color: "bg-amber-500/10 text-amber-600",
  },
] as const;

export function QuickLinksGrid() {
  return (
    <section className="space-y-3">
      <h2 className="font-heading text-sm font-semibold">Quick access</h2>
      <div className="grid grid-cols-3 gap-2">
        {LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition-colors hover:border-primary/40 hover:bg-muted/30"
            >
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-full",
                  link.color
                )}
              >
                <Icon className="size-5" />
              </div>
              <div>
                <p className="text-sm font-medium">{link.label}</p>
                <p className="text-[10px] text-muted-foreground">{link.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
