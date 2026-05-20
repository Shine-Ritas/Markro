import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-background to-background"
        aria-hidden
      />
      <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="font-heading text-lg font-semibold tracking-tight">
          {APP_NAME}
        </span>
        <ThemeToggle />
      </header>

      <main className="relative z-10 mx-auto flex max-w-5xl flex-col gap-8 px-6 pb-20 pt-8">
        <section className="space-y-4">
          <p className="text-sm font-medium text-primary">Phase 1 · Foundation</p>
          <h1 className="max-w-2xl font-heading text-4xl font-bold tracking-tight sm:text-5xl">
            Enterprise lucky draw & raffle management
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">{APP_DESCRIPTION}</p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/design-system" className={cn(buttonVariants())}>
              View design system
            </Link>
            <Button variant="outline" disabled>
              Dashboard (Phase 3)
            </Button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "Multi-tenant SaaS",
              description: "Organization isolation with PostgreSQL and Prisma.",
            },
            {
              title: "Tickets & POS",
              description: "QR tickets, inventory, and fast point-of-sale selling.",
            },
            {
              title: "Lucky draw engine",
              description: "Fair draws, winner logs, and fullscreen audience mode.",
            },
          ].map((item) => (
            <Card
              key={item.title}
              className="border-border/60 bg-card/80 backdrop-blur"
            >
              <CardHeader>
                <CardTitle className="text-base">{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Coming in later phases</p>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>
    </div>
  );
}
