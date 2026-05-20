import { auth, signOut } from "@/auth";
import { QuickActionCard } from "@/components/dashboard/quick-action-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  CalendarDays,
  DollarSign,
  PanelLeft,
  Ticket,
  Trophy,
} from "lucide-react";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { user } = session;

  return (
    <>
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <PanelLeft className="size-5 text-muted-foreground md:hidden" />
          <div>
            <p className="text-sm text-muted-foreground">Dashboard</p>
            <h1 className="font-heading text-2xl font-bold tracking-tight">
              Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Welcome back! Here&apos;s what&apos;s happening with your events.
            </p>
          </div>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <Button type="submit" variant="outline" size="sm">
            Sign out
          </Button>
        </form>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total Events"
              value="0"
              subtext="0 active"
              trend="+12%"
              icon={Calendar}
            />
            <StatCard
              label="Tickets Sold"
              value="0"
              subtext="All time"
              trend="+8%"
              icon={Ticket}
            />
            <StatCard
              label="Total Revenue"
              value="$0"
              subtext="All events"
              trend="+23%"
              icon={DollarSign}
            />
            <StatCard
              label="Total Winners"
              value="0"
              subtext="Lucky draw winners"
              trend="+5%"
              icon={Trophy}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-heading text-lg font-semibold">Quick Actions</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Common tasks to manage your events
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <QuickActionCard
                  title="Create Event"
                  description="Start a new lucky draw event"
                  icon={Calendar}
                  iconClassName="bg-blue-600"
                  disabled
                />
                <QuickActionCard
                  title="Sell Tickets"
                  description="Open POS for ticket sales"
                  icon={Ticket}
                  iconClassName="bg-emerald-600"
                  disabled
                />
                <QuickActionCard
                  title="Run Draw"
                  description="Start a lucky draw session"
                  icon={Trophy}
                  iconClassName="bg-amber-600"
                  disabled
                />
                <QuickActionCard
                  title="View Tickets"
                  description="Manage all tickets"
                  icon={Ticket}
                  iconClassName="bg-primary"
                  disabled
                />
              </div>
            </section>

            <section className="flex flex-col rounded-xl border border-border bg-card p-5">
              <h2 className="font-heading text-lg font-semibold">Upcoming Events</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Events scheduled in the next 30 days
              </p>
              <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
                <CalendarDays className="mb-4 size-12 text-muted-foreground/40" />
                <p className="font-medium">No upcoming events</p>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                  Create your first event to get started
                </p>
                <Button className="mt-6" disabled>
                  Create Event →
                </Button>
              </div>
            </section>
          </div>

          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-heading text-lg font-semibold">Recent Activity</h2>
            <p className="text-sm text-muted-foreground">
              Your latest actions and updates
            </p>
            <div className="mt-6 rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
              No recent activity yet
              {user.tenantName ? (
                <span className="mt-1 block text-xs">
                  Organization: {user.tenantName}
                </span>
              ) : null}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
