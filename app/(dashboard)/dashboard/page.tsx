import { auth } from "@/auth";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { getPlaceholderChartData, getRecentActivity } from "@/lib/dashboard";
import {
  getEventStatusCounts,
  getTotalEventCount,
  getUpcomingEvents,
} from "@/lib/event-dashboard";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const tenantId = session.user.tenantId!;

  const [activities, eventStatus, upcoming, totalEvents] = await Promise.all([
    getRecentActivity(tenantId),
    getEventStatusCounts(tenantId),
    getUpcomingEvents(tenantId),
    getTotalEventCount(tenantId),
  ]);

  return (
    <DashboardContent
      chartData={getPlaceholderChartData()}
      eventStatus={eventStatus}
      activities={activities}
      tenantName={session.user.tenantName}
      upcomingEvents={upcoming}
      totalEvents={totalEvents}
    />
  );
}
