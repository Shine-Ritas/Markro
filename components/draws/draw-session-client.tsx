"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import {
  ArrowLeft,
  Check,
  Loader2,
  Pause,
  Play,
  Sparkles,
  Ticket,
  Trophy,
  X,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  DRAW_ORDER_SHORT_LABELS,
  getNextPrizeRank,
  sortPrizesForDrawDisplay,
} from "@/lib/draw-order";
import type { DrawSessionDto, DrawWinnerDto } from "@/types/draws";
import type { EventDto } from "@/types/events";

type DrawPhase = "ready" | "rolling" | "paused" | "reveal" | "confirming" | "done";

type DrawSessionClientProps = {
  event: EventDto;
  initialEventPrizes?: Array<{
    rank: number;
    prize: { name: string; imageUrl: string | null };
  }>;
};

function rankLabel(rank: number) {
  if (rank === 1) return "1st";
  if (rank === 2) return "2nd";
  if (rank === 3) return "3rd";
  return `${rank}th`;
}

function fireConfetti() {
  confetti({
    particleCount: 120,
    spread: 70,
    origin: { y: 0.6 },
  });
}

export function DrawSessionClient({
  event,
  initialEventPrizes = [],
}: DrawSessionClientProps) {
  const router = useRouter();
  const [session, setSession] = useState<DrawSessionDto | null>(null);
  const [eventPrizes, setEventPrizes] = useState(initialEventPrizes);
  const [phase, setPhase] = useState<DrawPhase>("ready");
  const [displayNumber, setDisplayNumber] = useState("----");
  const [lastWinner, setLastWinner] = useState<DrawWinnerDto | null>(null);
  const [manualTicket, setManualTicket] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const rollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pickedCount = session?.winners.length ?? 0;
  const targetCount = event.winnerCount;
  const allPicked = pickedCount >= targetCount;
  const prizesReady = eventPrizes.length >= targetCount;
  const drawOrder = session?.drawOrder ?? event.drawOrder;
  const nextPrizeRank = getNextPrizeRank(targetCount, pickedCount, drawOrder);
  const currentPrize = eventPrizes.find((p) => p.rank === nextPrizeRank);
  const displayPrizes = sortPrizesForDrawDisplay(eventPrizes, drawOrder);
  const progressPct =
    targetCount > 0 ? Math.min(100, (pickedCount / targetCount) * 100) : 0;

  const stopRolling = useCallback(() => {
    if (rollIntervalRef.current) {
      clearInterval(rollIntervalRef.current);
      rollIntervalRef.current = null;
    }
  }, []);

  const startRollingDisplay = useCallback(() => {
    stopRolling();
    rollIntervalRef.current = setInterval(() => {
      const n = Math.floor(Math.random() * 9999) + 1;
      setDisplayNumber(String(n).padStart(4, "0"));
    }, 60);
  }, [stopRolling]);

  useEffect(() => {
    async function loadSession() {
      try {
        const [sessionRes, prizesRes] = await Promise.all([
          fetch(`/api/events/${event.id}/draw/session`),
          fetch(`/api/events/${event.id}/prizes`),
        ]);
        const data = await sessionRes.json();
        const prizesData = await prizesRes.json();
        if (prizesData.prizes) {
          setEventPrizes(
            prizesData.prizes.map(
              (p: {
                rank: number;
                prize: { name: string; imageUrl: string | null };
              }) => ({
                rank: p.rank,
                prize: p.prize,
              })
            )
          );
        }
        if (data.session) {
          setSession(data.session);
          if (data.session.winners.length > 0) {
            setPhase(
              data.session.winners.length >= targetCount ? "confirming" : "ready"
            );
          }
        }
      } finally {
        setInitializing(false);
      }
    }
    loadSession();
    return () => stopRolling();
  }, [event.id, targetCount, stopRolling]);

  async function handleStart() {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${event.id}/draw/start`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to start draw");
        return;
      }
      setSession(data.session);
      setPhase("rolling");
      startRollingDisplay();
      toast.success("Draw started");
    } finally {
      setLoading(false);
    }
  }

  async function handlePickRandom() {
    if (phase === "paused") return;
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${event.id}/draw/pick`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to pick winner");
        stopRolling();
        setPhase("ready");
        return;
      }
      stopRolling();
      setSession(data.session);
      setLastWinner(data.winner);
      setDisplayNumber(data.winner.ticketNumber);
      setPhase("reveal");
      fireConfetti();
    } finally {
      setLoading(false);
    }
  }

  async function handleManualPick() {
    if (!manualTicket.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${event.id}/draw/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketNumber: manualTicket.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to pick ticket");
        return;
      }
      stopRolling();
      setSession(data.session);
      setLastWinner(data.winner);
      setDisplayNumber(data.winner.ticketNumber);
      setManualTicket("");
      setPhase("reveal");
      fireConfetti();
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${event.id}/draw/confirm`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to confirm draw");
        return;
      }
      setSession(data.session);
      setPhase("done");
      fireConfetti();
      toast.success("Draw completed! Event marked as completed.");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!confirm("Cancel this draw session? Selected winners will be cleared.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${event.id}/draw/cancel`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to cancel");
        return;
      }
      setSession(null);
      setLastWinner(null);
      setPhase("ready");
      stopRolling();
      toast.success("Draw cancelled");
    } finally {
      setLoading(false);
    }
  }

  function handlePause() {
    stopRolling();
    setPhase("paused");
  }

  function handleResume() {
    setPhase("rolling");
    startRollingDisplay();
  }

  function handleContinue() {
    setLastWinner(null);
    if (allPicked) {
      setPhase("confirming");
    } else {
      setPhase("rolling");
      startRollingDisplay();
    }
  }

  if (initializing) {
    return (
      <div className="flex h-full min-h-0 flex-1 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,oklch(0.58_0.24_285/0.12),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_100%,oklch(0.72_0.19_85/0.06),transparent_70%)]"
      />

      <header className="relative z-10 flex shrink-0 items-center gap-4 border-b border-border/60 bg-card/30 px-4 py-3 backdrop-blur-sm sm:px-6">
        <Button
          variant="ghost"
          size="sm"
          render={<Link href={`/dashboard/events/${event.id}`} />}
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Lucky draw
          </p>
          <h1 className="truncate font-heading text-lg font-semibold sm:text-xl">
            {event.name}
          </h1>
        </div>

        <div className="flex items-center gap-4 text-sm">
          {session ? (
            <span className="hidden items-center gap-1.5 text-muted-foreground sm:flex">
              <Ticket className="size-3.5" />
              {session.eligibleCount} eligible
            </span>
          ) : null}
          <span className="flex items-center gap-1.5 font-medium">
            <Trophy className="size-4 text-amber-400" />
            {pickedCount}/{targetCount}
          </span>
          <span className="hidden rounded-md border border-border/60 bg-background/50 px-2 py-0.5 text-[11px] text-muted-foreground sm:inline">
            {DRAW_ORDER_SHORT_LABELS[drawOrder]}
          </span>
        </div>
      </header>

      <div className="relative z-10 h-1 shrink-0 bg-muted/50">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-amber-400"
          initial={false}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {eventPrizes.length > 0 ? (
        <div className="relative z-10 shrink-0 border-b border-border/40 bg-card/20 px-4 py-3 backdrop-blur-sm sm:px-6">
          <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {displayPrizes.map((slot) => {
              const isCurrent = slot.rank === nextPrizeRank && phase !== "done";
              const isDone =
                session?.winners.some((w) => w.rank === slot.rank) ?? false;
              const winner = session?.winners.find((w) => w.rank === slot.rank);

              return (
                <div
                  key={slot.rank}
                  className={cn(
                    "flex min-w-[140px] shrink-0 items-center gap-2.5 rounded-xl border px-3 py-2 transition-all sm:min-w-[180px]",
                    isCurrent
                      ? "border-primary bg-primary/15 shadow-[0_0_20px_oklch(0.58_0.24_285/0.2)]"
                      : isDone
                        ? "border-amber-500/40 bg-amber-500/8"
                        : "border-border/60 bg-background/40"
                  )}
                >
                  {slot.prize.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={slot.prize.imageUrl}
                      alt=""
                      className="size-9 shrink-0 rounded-lg object-cover bg-muted"
                    />
                  ) : (
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                        isCurrent
                          ? "bg-primary text-primary-foreground"
                          : isDone
                            ? "bg-amber-500/25 text-amber-200"
                            : "bg-muted text-muted-foreground"
                      )}
                    >
                      {slot.rank}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium leading-tight">
                      {slot.prize.name}
                    </p>
                    {isDone && winner ? (
                      <p className="truncate font-mono text-[11px] text-amber-300/90">
                        #{winner.ticketNumber}
                      </p>
                    ) : isCurrent ? (
                      <p className="text-[11px] text-primary">Drawing now</p>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">
                        {rankLabel(slot.rank)} prize
                      </p>
                    )}
                  </div>
                  {isDone ? (
                    <Check className="size-3.5 shrink-0 text-amber-400" />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <main className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-4 sm:px-8">
        {currentPrize && phase !== "done" && phase !== "ready" ? (
          <p className="mb-4 text-center text-sm text-muted-foreground">
            Drawing for{" "}
            <span className="font-medium text-foreground">
              {currentPrize.prize.name}
            </span>
          </p>
        ) : phase === "ready" && !session ? (
          <p className="mb-4 text-center text-sm text-muted-foreground">
            {prizesReady
              ? "Ready to start — press the button below"
              : "Assign all prizes on the event page before starting"}
          </p>
        ) : null}

        <AnimatePresence mode="wait">
          <motion.div
            key={phase + displayNumber}
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.98, opacity: 0 }}
            className="flex w-full max-w-4xl flex-1 flex-col items-center justify-center"
          >
            <div
              className={cn(
                "flex w-full flex-1 items-center justify-center rounded-3xl border-2 px-6 shadow-2xl",
                "min-h-[200px] max-h-[min(52vh,480px)]",
                phase === "reveal" || phase === "done"
                  ? "border-amber-400/50 bg-gradient-to-b from-amber-500/15 via-amber-500/5 to-transparent shadow-amber-500/10"
                  : phase === "rolling"
                    ? "border-primary/40 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent shadow-primary/10"
                    : "border-border/50 bg-gradient-to-b from-card/80 to-card/30"
              )}
            >
              <span
                className={cn(
                  "select-none font-mono font-bold tracking-[0.15em] sm:tracking-[0.2em]",
                  phase === "rolling" ? "text-7xl sm:text-9xl" : "text-6xl sm:text-8xl",
                  phase === "reveal" || phase === "done"
                    ? "text-amber-100"
                    : "text-foreground"
                )}
              >
                {displayNumber}
              </span>
            </div>

            {phase === "reveal" && lastWinner ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 w-full text-center"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
                  {rankLabel(lastWinner.rank)} winner
                </p>
                {lastWinner.prizeName ? (
                  <p className="mt-2 text-base text-primary sm:text-lg">
                    {lastWinner.prizeName}
                  </p>
                ) : null}
                {lastWinner.buyerName ? (
                  <p className="mt-2 font-heading text-2xl font-semibold sm:text-3xl">
                    {lastWinner.buyerName}
                  </p>
                ) : null}
                {lastWinner.buyerPhone ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {lastWinner.buyerPhone}
                  </p>
                ) : null}
              </motion.div>
            ) : null}

            {phase === "done" ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 text-center text-lg font-medium text-amber-300"
              >
                All winners confirmed — event completed
              </motion.p>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="relative z-10 shrink-0 border-t border-border/60 bg-card/40 px-4 py-4 backdrop-blur-sm sm:px-6">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
          {phase === "ready" && !session ? (
            <Button
              size="lg"
              onClick={handleStart}
              disabled={loading || !prizesReady}
              className="h-12 w-full text-base"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              {prizesReady ? "Start draw" : "Assign all prizes first"}
            </Button>
          ) : null}

          {phase === "rolling" ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                size="lg"
                className="h-12 flex-1 text-base"
                onClick={handlePickRandom}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                Pick winner
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12"
                onClick={handlePause}
              >
                <Pause className="size-4" />
                Pause
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12"
                onClick={handleCancel}
                disabled={loading}
              >
                <X className="size-4" />
                Cancel
              </Button>
            </div>
          ) : null}

          {phase === "paused" ? (
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button size="lg" className="h-12 flex-1" onClick={handleResume}>
                  <Play className="size-4" />
                  Resume
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel draw
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  id="manualTicket"
                  placeholder="Manual ticket number"
                  value={manualTicket}
                  onChange={(e) => setManualTicket(e.target.value)}
                  className="h-12 flex-1"
                />
                <Button
                  size="lg"
                  variant="secondary"
                  className="h-12"
                  onClick={handleManualPick}
                  disabled={loading || !manualTicket.trim()}
                >
                  Pick
                </Button>
              </div>
            </div>
          ) : null}

          {phase === "reveal" ? (
            <Button
              size="lg"
              onClick={handleContinue}
              className="h-12 w-full text-base"
            >
              {allPicked ? "Review & confirm" : "Pick next winner"}
            </Button>
          ) : null}

          {phase === "confirming" || (phase === "ready" && session && allPicked) ? (
            <Button
              size="lg"
              onClick={handleConfirm}
              disabled={loading}
              className="h-12 w-full text-base"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              Confirm {targetCount} winners & complete event
            </Button>
          ) : null}

          {phase === "done" ? (
            <Button
              size="lg"
              render={<Link href={`/dashboard/events/${event.id}`} />}
              className="h-12 w-full text-base"
            >
              View event & winners
            </Button>
          ) : null}

          {session && phase !== "done" && phase !== "rolling" && phase !== "paused" ? (
            <div className="flex gap-2">
              <Input
                placeholder="Manual ticket #"
                value={manualTicket}
                onChange={(e) => setManualTicket(e.target.value)}
                className="h-10"
              />
              <Button
                variant="secondary"
                onClick={handleManualPick}
                disabled={loading || !manualTicket.trim()}
              >
                Override
              </Button>
            </div>
          ) : null}
        </div>
      </footer>
    </div>
  );
}
