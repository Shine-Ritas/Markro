"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TicketStatusBadge } from "@/components/tickets/ticket-status-badge";
import { formatMoney, getQrPayload } from "@/lib/tickets";
import type { TicketDto } from "@/types/tickets";

type TicketQrDialogProps = {
  ticket: TicketDto | null;
  eventName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTicketUpdated?: (ticket: TicketDto) => void;
};

export function TicketQrDialog({
  ticket,
  eventName,
  open,
  onOpenChange,
  onTicketUpdated,
}: TicketQrDialogProps) {
  const router = useRouter();
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [selling, setSelling] = useState(false);

  useEffect(() => {
    if (!ticket || !open) {
      setQrUrl(null);
      return;
    }
    QRCode.toDataURL(getQrPayload(ticket.qrToken), {
      width: 256,
      margin: 2,
      color: { dark: "#e8e8f0", light: "#14141c" },
    }).then(setQrUrl);
  }, [ticket, open]);

  async function markSold() {
    if (!ticket) return;
    setSelling(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/sell`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Failed");
        return;
      }
      toast.success("Marked as sold");
      onTicketUpdated?.({ ...ticket, status: "SOLD" });
      router.refresh();
    } finally {
      setSelling(false);
    }
  }

  if (!ticket) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Ticket #{ticket.ticketNumber}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          {qrUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrUrl} alt="Ticket QR code" className="rounded-lg" />
          ) : (
            <div className="size-64 animate-pulse rounded-lg bg-muted" />
          )}
          <div className="text-center text-sm">
            <p className="font-medium">{eventName}</p>
            <p className="text-primary">{formatMoney(ticket.priceCents)}</p>
            <div className="mt-2 flex justify-center">
              <TicketStatusBadge status={ticket.status} />
            </div>
            <p className="mt-3 font-mono text-xs text-muted-foreground break-all">
              {ticket.qrToken}
            </p>
            {ticket.status === "AVAILABLE" ? (
              <Button
                type="button"
                variant="outline"
                className="mt-2 w-full"
                onClick={markSold}
                disabled={selling}
              >
                Mark as sold (test)
              </Button>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
