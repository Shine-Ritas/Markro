"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { QuickActionCard } from "@/components/dashboard/quick-action-card";
import { EventStatusBadge } from "@/components/events/event-status-badge";
import { formatDate } from "@/lib/format";
import type { EventListItem } from "@/types/events";
import { StatCard } from "@/components/dashboard/stat-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { TicketSalesChart } from "@/components/dashboard/ticket-sales-chart";
import { EventStatusCards } from "@/components/dashboard/event-status-cards";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { Button } from "@/components/ui/button";
import { Calendar, CalendarDays, DollarSign, Ticket, Trophy } from "lucide-react";
import type { ActivityItem } from "@/lib/dashboard";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

type DashboardContentProps = {
  chartData: { name: string; revenue: number; tickets: number }[];
  eventStatus: readonly { label: string; count: number; color: string }[];
  activities: ActivityItem[];
  tenantName?: string;
  upcomingEvents?: EventListItem[];
  totalEvents?: number;
  totalWinners?: number;
};

export function DashboardContent({
  chartData,
  eventStatus,
  activities,
  tenantName,
  upcomingEvents = [],
  totalEvents = 0,
  totalWinners = 0,
}: DashboardContentProps) {
  const activeCount = eventStatus.find((s) => s.label === "Published")?.count ?? 0;
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <motion.div
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        initial="initial"
        animate="animate"
        transition={{ staggerChildren: 0.06 }}
      >
        {[
          {
            label: "Total Events",
            value: String(totalEvents),
            subtext: `${activeCount} published`,
            trend: "+12%",
            icon: Calendar,
          },
          {
            label: "Tickets Sold",
            value: "0",
            subtext: "All time",
            trend: "+8%",
            icon: Ticket,
          },
          {
            label: "Total Revenue",
            value: "$0",
            subtext: "All events",
            trend: "+23%",
            icon: DollarSign,
          },
          {
            label: "Total Winners",
            value: String(totalWinners),
            subtext: "Lucky draw winners",
            trend: "+5%",
            icon: Trophy,
          },
        ].map((stat) => (
          <motion.div key={stat.label} variants={fadeUp}>
            <StatCard {...stat} />
          </motion.div>
        ))}
      </motion.div>

      <motion.section variants={fadeUp} initial="initial" animate="animate">
        <h2 className="mb-3 font-heading text-sm font-medium text-muted-foreground">
          Event status
        </h2>
        <EventStatusCards items={eventStatus} />
      </motion.section>

      <motion.div
        className="grid gap-6 lg:grid-cols-2"
        initial="initial"
        animate="animate"
        transition={{ delay: 0.1 }}
      >
        <motion.section
          variants={fadeUp}
          className="rounded-xl border border-border bg-card p-5"
        >
          <h2 className="font-heading text-lg font-semibold">Revenue trend</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Monthly revenue (placeholder until events go live)
          </p>
          <RevenueChart data={chartData} />
        </motion.section>

        <motion.section
          variants={fadeUp}
          className="rounded-xl border border-border bg-card p-5"
        >
          <h2 className="font-heading text-lg font-semibold">Ticket sales</h2>
          <p className="mb-4 text-sm text-muted-foreground">Tickets sold per month</p>
          <TicketSalesChart data={chartData} />
        </motion.section>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.section
          variants={fadeUp}
          initial="initial"
          animate="animate"
          className="rounded-xl border border-border bg-card p-5"
        >
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
              href="/dashboard/events/new"
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
              href="/dashboard/events"
            />
            <QuickActionCard
              title="View Tickets"
              description="Manage all tickets"
              icon={Ticket}
              iconClassName="bg-primary"
              disabled
            />
          </div>
        </motion.section>

        <motion.section
          variants={fadeUp}
          initial="initial"
          animate="animate"
          className="flex flex-col rounded-xl border border-border bg-card p-5"
        >
          <h2 className="font-heading text-lg font-semibold">Upcoming Events</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Events scheduled in the next 30 days
          </p>
          {upcomingEvents.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
              <CalendarDays className="mb-4 size-12 text-muted-foreground/40" />
              <p className="font-medium">No upcoming events</p>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Create your first event to get started
              </p>
              <Button className="mt-6" render={<Link href="/dashboard/events/new" />}>
                Create Event →
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {upcomingEvents.map((event) => (
                <li key={event.id}>
                  <Link
                    href={`/dashboard/events/${event.id}`}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-muted/30"
                  >
                    <div>
                      <p className="font-medium">{event.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(event.startDate)}
                      </p>
                    </div>
                    <EventStatusBadge status={event.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </motion.section>
      </div>

      <motion.section
        variants={fadeUp}
        initial="initial"
        animate="animate"
        className="rounded-xl border border-border bg-card p-5"
      >
        <h2 className="font-heading text-lg font-semibold">Recent Activity</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Your latest actions and updates
        </p>
        <ActivityFeed items={activities} tenantName={tenantName} />
      </motion.section>
    </div>
  );
}
