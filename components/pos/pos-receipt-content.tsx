import { APP_NAME } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { formatMoney } from "@/lib/tickets";
import type { PosSaleDto } from "@/types/pos";

type PosReceiptContentProps = {
  sale: PosSaleDto;
};

export function PosReceiptContent({ sale }: PosReceiptContentProps) {
  return (
    <div data-pos-receipt-print className="pos-receipt-print space-y-4 text-sm">
      <div className="pos-receipt-print-header hidden print:block">
        <p className="text-center text-base font-bold">{APP_NAME}</p>
        <p className="text-center text-xs text-muted-foreground print:text-gray-600">
          Receipt {sale.receiptNumber ?? "—"}
        </p>
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-4 print:border-gray-300 print:bg-white">
        <p className="font-semibold">{sale.eventName}</p>
        {sale.completedAt ? (
          <p className="text-muted-foreground print:text-gray-600">
            {formatDateTime(sale.completedAt)}
          </p>
        ) : null}
        {sale.customerName ? (
          <p className="mt-2">Customer: {sale.customerName}</p>
        ) : null}
        {sale.customerPhone ? (
          <p className="text-muted-foreground print:text-gray-600">
            {sale.customerPhone}
          </p>
        ) : null}
        {sale.actorName ? (
          <p className="mt-2 text-muted-foreground print:text-gray-600">
            Staff: {sale.actorName}
          </p>
        ) : null}
      </div>

      <ul className="divide-y divide-border rounded-lg border border-border print:divide-gray-300 print:border-gray-300">
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

      <div className="flex items-center justify-between border-t border-border pt-3 text-base font-semibold print:border-gray-300">
        <span>Total ({sale.quantity} tickets)</span>
        <span className="text-primary print:text-black">
          {formatMoney(sale.totalCents, sale.currencyCode)}
        </span>
      </div>

      <p className="hidden text-center text-xs text-gray-600 print:block">
        Thank you for your purchase.
      </p>
    </div>
  );
}
