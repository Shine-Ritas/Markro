import type { DrawOrder } from "@prisma/client";

/** Prize rank for the next draw pick (1 = grand prize). */
export function getNextPrizeRank(
  winnerCount: number,
  picksSoFar: number,
  drawOrder: DrawOrder
): number {
  if (drawOrder === "LOW_TO_HIGH") {
    return winnerCount - picksSoFar;
  }
  return picksSoFar + 1;
}

export function sortPrizesForDrawDisplay<T extends { rank: number }>(
  prizes: T[],
  drawOrder: DrawOrder
): T[] {
  const sorted = [...prizes].sort((a, b) => a.rank - b.rank);
  return drawOrder === "LOW_TO_HIGH" ? sorted.reverse() : sorted;
}

export const DRAW_ORDER_LABELS: Record<DrawOrder, string> = {
  HIGH_TO_LOW: "Grand prize first (1st → last)",
  LOW_TO_HIGH: "Build up (last → 1st)",
};

export const DRAW_ORDER_SHORT_LABELS: Record<DrawOrder, string> = {
  HIGH_TO_LOW: "1st → last",
  LOW_TO_HIGH: "Last → 1st",
};
