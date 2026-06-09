"use client";

import { Printer } from "lucide-react";
import { PosReceiptContent } from "@/components/pos/pos-receipt-content";
import { printPosReceipt } from "@/lib/pos-receipt-print";
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

        <PosReceiptContent sale={sale} />

        <p className="text-center text-xs text-muted-foreground">
          Print or save this receipt for the customer.
        </p>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => printPosReceipt()}
          >
            <Printer className="size-4" />
            Print
          </Button>
          <Button type="button" className="flex-1" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
