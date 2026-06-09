"use client";

import { formatMoney } from "@/lib/tickets";
import { formatDate } from "@/lib/format";
import type { PosSaleDto } from "@/types/pos";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type PosReceiptDialogProps = {
  sale: PosSaleDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PosReceiptDialog({ sale, open, onOpenChange }: PosReceiptDialogProps) {
  if (!sale) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Receipt {sale.receiptNumber ?? ""}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <p className="font-semibold">{sale.eventName}</p>
            {sale.completedAt ? (
              <p className="text-muted-foreground">{formatDate(sale.completedAt)}</p>
            ) : null}
            {sale.customerName ? (
              <p className="mt-2">Customer: {sale.customerName}</p>
            ) : null}
            {sale.customerPhone ? (
              <p className="text-muted-foreground">{sale.customerPhone}</p>
            ) : null}
            {sale.actorName ? (
              <p className="mt-2 text-muted-foreground">Staff: {sale.actorName}</p>
            ) : null}
          </div>

          <ul className="divide-y divide-border rounded-lg border border-border">
            {sale.lines.map((line) => (
              <li
                key={line.id}
                className="flex items-center justify-between px-3 py-2 font-mono text-sm"
              >
                <span>#{line.ticketNumber}</span>
                <span>{formatMoney(line.priceCents, sale.currencyCode)}</span>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between border-t border-border pt-3 text-base font-semibold">
            <span>Total ({sale.quantity} tickets)</span>
            <span className="text-primary">
              {formatMoney(sale.totalCents, sale.currencyCode)}
            </span>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Screenshot or print this receipt for the customer.
          </p>

          <Button type="button" className="w-full" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
