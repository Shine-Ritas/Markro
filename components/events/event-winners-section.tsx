import { Trophy } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DRAW_SELECTION_LABELS, type DrawWinnerDto } from "@/types/draws";

type EventWinnersSectionProps = {
  winners: DrawWinnerDto[];
  drawCompletedAt?: string | null;
};

function rankLabel(rank: number) {
  if (rank === 1) return "1st";
  if (rank === 2) return "2nd";
  if (rank === 3) return "3rd";
  return `${rank}th`;
}

export function EventWinnersSection({
  winners,
  drawCompletedAt,
}: EventWinnersSectionProps) {
  if (winners.length === 0) return null;

  return (
    <section className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
      <div className="flex items-center gap-2">
        <Trophy className="size-5 text-amber-400" />
        <h3 className="font-heading text-lg font-semibold">Winners</h3>
      </div>
      {drawCompletedAt ? (
        <p className="mt-1 text-sm text-muted-foreground">
          Draw completed {formatDateTime(drawCompletedAt)}
        </p>
      ) : null}

      <div className="mt-4 overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Prize</TableHead>
              <TableHead>Ticket</TableHead>
              <TableHead>Buyer</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Selected</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {winners.map((w) => (
              <TableRow key={w.id}>
                <TableCell className="font-medium">{rankLabel(w.rank)}</TableCell>
                <TableCell>{w.prizeName ?? "—"}</TableCell>
                <TableCell className="font-mono">{w.ticketNumber}</TableCell>
                <TableCell>{w.buyerName ?? "—"}</TableCell>
                <TableCell>{w.buyerPhone ?? "—"}</TableCell>
                <TableCell>{DRAW_SELECTION_LABELS[w.selectionMethod]}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDateTime(w.selectedAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
