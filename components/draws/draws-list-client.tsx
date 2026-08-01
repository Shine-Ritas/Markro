"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { DRAW_ORDER_SHORT_LABELS } from "@/lib/draw-order";
import type { DrawReadyEventItem } from "@/types/prizes";

type DrawsListClientProps = {
  initialEvents: DrawReadyEventItem[];
};

export function DrawsListClient({ initialEvents }: DrawsListClientProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event</TableHead>
            <TableHead>Draw order</TableHead>
            <TableHead>Prizes</TableHead>
            <TableHead>Eligible tickets</TableHead>
            <TableHead>Draw scheduled</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {initialEvents.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="py-12 text-center text-muted-foreground"
              >
                <Sparkles className="mx-auto mb-2 size-8 opacity-40" />
                No published events ready for draw.
              </TableCell>
            </TableRow>
          ) : (
            initialEvents.map((event) => {
              const prizesReady = event.prizesAssigned === event.winnerCount;
              const canDraw =
                prizesReady && event.eligibleTicketCount >= event.winnerCount;

              return (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {DRAW_ORDER_SHORT_LABELS[event.drawOrder]}
                  </TableCell>
                  <TableCell>
                    <Badge variant={prizesReady ? "default" : "outline"}>
                      {event.prizesAssigned} / {event.winnerCount}
                    </Badge>
                  </TableCell>
                  <TableCell>{event.eligibleTicketCount}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {event.drawScheduledAt
                      ? formatDateTime(event.drawScheduledAt)
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {event.hasActiveSession ? (
                      <Badge variant="outline">In progress</Badge>
                    ) : prizesReady ? (
                      <Badge variant="default">Ready</Badge>
                    ) : (
                      <Badge variant="outline">Assign prizes</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {!prizesReady ? (
                        <Button
                          size="sm"
                          variant="outline"
                          render={<Link href={`/dashboard/events/${event.id}`} />}
                        >
                          Assign prizes
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled={!canDraw}
                          render={<Link href={`/dashboard/events/${event.id}/draw`} />}
                        >
                          {event.hasActiveSession ? "Resume draw" : "Start draw"}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
