import { prisma } from "@/lib/prisma";
import type { EventListItem } from "@/types/events";
import { toEventListItem } from "@/lib/events";

export async function getEventStatusCounts(tenantId: string) {
  const groups = await prisma.event.groupBy({
    by: ["status"],
    where: { tenantId, deletedAt: null },
    _count: { _all: true },
  });

  const map = Object.fromEntries(
    groups.map((g) => [g.status, g._count._all])
  ) as Record<string, number>;

  return [
    { label: "Draft", count: map.DRAFT ?? 0, color: "bg-zinc-500" },
    { label: "Published", count: map.PUBLISHED ?? 0, color: "bg-emerald-500" },
    { label: "Completed", count: map.COMPLETED ?? 0, color: "bg-amber-500" },
    { label: "Archived", count: map.ARCHIVED ?? 0, color: "bg-blue-500" },
    {
      label: "Total",
      count:
        (map.DRAFT ?? 0) +
        (map.PUBLISHED ?? 0) +
        (map.COMPLETED ?? 0) +
        (map.ARCHIVED ?? 0),
      color: "bg-primary",
    },
  ] as const;
}

export async function getUpcomingEvents(
  tenantId: string,
  limit = 5
): Promise<EventListItem[]> {
  const now = new Date();
  const in30Days = new Date(now);
  in30Days.setDate(in30Days.getDate() + 30);

  const events = await prisma.event.findMany({
    where: {
      tenantId,
      deletedAt: null,
      startDate: { gte: now, lte: in30Days },
      status: { in: ["DRAFT", "PUBLISHED"] },
    },
    orderBy: { startDate: "asc" },
    take: limit,
  });

  return events.map(toEventListItem);
}

export async function getTotalEventCount(tenantId: string) {
  return prisma.event.count({
    where: { tenantId, deletedAt: null },
  });
}
