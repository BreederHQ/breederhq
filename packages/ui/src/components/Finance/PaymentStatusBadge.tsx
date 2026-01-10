import * as React from "react";
import { Badge } from "../Badge/Badge";

/** Lightweight invoice data for status display */
export type InvoiceLite = {
  status: "DRAFT" | "ISSUED" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "VOID" | string;
  dueAt?: string | null;
  paidCents?: number;
  totalCents?: number;
};

export type PaymentStatusBadgeProps = {
  invoice: InvoiceLite | null | undefined;
  className?: string;
};

/**
 * Displays a badge showing the payment status of an invoice.
 * Colors: green (Paid), amber (Awaiting/Partial), red (Overdue), neutral (Draft/Void)
 */
export function PaymentStatusBadge({ invoice, className }: PaymentStatusBadgeProps) {
  if (!invoice) return null;

  const isOverdue =
    invoice.status === "OVERDUE" ||
    (invoice.status === "ISSUED" && invoice.dueAt && new Date(invoice.dueAt) < new Date());

  // Calculate percentage for partial payments
  const paidPercent =
    invoice.totalCents && invoice.paidCents
      ? Math.round((invoice.paidCents / invoice.totalCents) * 100)
      : 0;

  switch (invoice.status) {
    case "PAID":
      return (
        <Badge variant="green" className={className}>
          Paid
        </Badge>
      );

    case "PARTIALLY_PAID":
      return (
        <Badge variant="amber" className={className} title={`${paidPercent}% paid`}>
          Partial ({paidPercent}%)
        </Badge>
      );

    case "OVERDUE":
      return (
        <Badge variant="red" className={className}>
          Overdue
        </Badge>
      );

    case "ISSUED":
      if (isOverdue) {
        return (
          <Badge variant="red" className={className}>
            Overdue
          </Badge>
        );
      }
      return (
        <Badge variant="amber" className={className}>
          Awaiting Payment
        </Badge>
      );

    case "DRAFT":
      return (
        <Badge variant="neutral" className={className}>
          Draft
        </Badge>
      );

    case "VOID":
      return (
        <Badge variant="neutral" className={className}>
          Void
        </Badge>
      );

    default:
      return (
        <Badge variant="neutral" className={className}>
          {invoice.status}
        </Badge>
      );
  }
}
