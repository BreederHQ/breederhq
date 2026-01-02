// apps/portal/src/pages/PortalFinancialsPage.tsx
import * as React from "react";
import { PageContainer } from "../design/PageContainer";
import { PortalHero } from "../design/PortalHero";
import { PortalCard, CardRow } from "../design/PortalCard";
import { isPortalMockEnabled } from "../dev/mockFlag";
import {
  mockInvoices,
  mockTransactions,
  mockFinancialSummary,
  mockInvoiceDetail,
  type Invoice,
  type Transaction,
  type FinancialSummary,
  type InvoiceStatus,
} from "../dev/mockData";

/* ────────────────────────────────────────────────────────────────────────────
 * Currency Formatter
 * ──────────────────────────────────────────────────────────────────────────── */

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatCurrencyPrecise(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/* ────────────────────────────────────────────────────────────────────────────
 * Date Formatter
 * ──────────────────────────────────────────────────────────────────────────── */

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getDaysUntil(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/* ────────────────────────────────────────────────────────────────────────────
 * Status Badge
 * ──────────────────────────────────────────────────────────────────────────── */

function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const config: Record<InvoiceStatus, { label: string; bg: string; color: string; dot: string }> = {
    paid: {
      label: "Paid",
      bg: "var(--portal-success-soft)",
      color: "var(--portal-success)",
      dot: "var(--portal-success)",
    },
    due: {
      label: "Due",
      bg: "var(--portal-accent-muted)",
      color: "var(--portal-accent)",
      dot: "var(--portal-accent)",
    },
    overdue: {
      label: "Overdue",
      bg: "var(--portal-error-soft)",
      color: "var(--portal-error)",
      dot: "var(--portal-error)",
    },
    draft: {
      label: "Draft",
      bg: "var(--portal-bg-elevated)",
      color: "var(--portal-text-tertiary)",
      dot: "var(--portal-text-tertiary)",
    },
  };

  const c = config[status];

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 10px",
        background: c.bg,
        borderRadius: "var(--portal-radius-full)",
      }}
    >
      <div
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: c.dot,
          boxShadow: status === "overdue" ? `0 0 6px ${c.dot}` : undefined,
        }}
      />
      <span
        style={{
          fontSize: "var(--portal-font-size-xs)",
          fontWeight: "var(--portal-font-weight-semibold)",
          color: c.color,
          textTransform: "uppercase",
          letterSpacing: "0.02em",
        }}
      >
        {c.label}
      </span>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Summary Stat Card
 * ──────────────────────────────────────────────────────────────────────────── */

interface SummaryStatProps {
  label: string;
  value: string;
  sublabel?: string;
  accent?: boolean;
  warning?: boolean;
}

function SummaryStat({ label, value, sublabel, accent, warning }: SummaryStatProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--portal-space-1)",
      }}
    >
      <div
        style={{
          fontSize: "var(--portal-font-size-xs)",
          fontWeight: "var(--portal-font-weight-semibold)",
          textTransform: "uppercase",
          letterSpacing: "var(--portal-letter-spacing-wide)",
          color: "var(--portal-text-tertiary)",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "var(--portal-font-size-2xl)",
          fontWeight: "var(--portal-font-weight-bold)",
          color: warning
            ? "var(--portal-error)"
            : accent
              ? "var(--portal-accent)"
              : "var(--portal-text-primary)",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {sublabel && (
        <div
          style={{
            fontSize: "var(--portal-font-size-sm)",
            color: warning ? "var(--portal-error)" : "var(--portal-text-secondary)",
          }}
        >
          {sublabel}
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Financial Summary Hero
 * ──────────────────────────────────────────────────────────────────────────── */

function FinancialSummaryCard({ summary }: { summary: FinancialSummary }) {
  const nextDueDays = summary.nextPaymentDueAt ? getDaysUntil(summary.nextPaymentDueAt) : null;
  const nextDueLabel =
    nextDueDays !== null
      ? nextDueDays < 0
        ? "Past due"
        : nextDueDays === 0
          ? "Due today"
          : nextDueDays === 1
            ? "Due tomorrow"
            : `Due in ${nextDueDays} days`
      : null;

  return (
    <PortalCard variant="hero" padding="lg">
      {/* Decorative gradient orb */}
      <div
        style={{
          position: "absolute",
          top: "-50%",
          right: "-20%",
          width: "400px",
          height: "400px",
          background: "radial-gradient(circle, rgba(255, 107, 53, 0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "var(--portal-space-5)",
          }}
        >
          <SummaryStat
            label="Balance Due"
            value={formatCurrency(summary.totalDue)}
            sublabel={summary.overdueAmount > 0 ? `${formatCurrency(summary.overdueAmount)} overdue` : undefined}
            warning={summary.overdueAmount > 0}
          />
          <SummaryStat label="Total Paid" value={formatCurrency(summary.totalPaid)} sublabel="All time" />
          {summary.nextPaymentAmount && (
            <SummaryStat
              label="Next Payment"
              value={formatCurrency(summary.nextPaymentAmount)}
              sublabel={nextDueLabel || undefined}
              accent
            />
          )}
        </div>
      </div>
    </PortalCard>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Invoice Row
 * ──────────────────────────────────────────────────────────────────────────── */

interface InvoiceRowProps {
  invoice: Invoice;
  onClick: () => void;
}

function InvoiceRow({ invoice, onClick }: InvoiceRowProps) {
  return (
    <CardRow onClick={onClick}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--portal-space-3)" }}>
        {/* Invoice icon */}
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "var(--portal-radius-lg)",
            background:
              invoice.status === "overdue"
                ? "var(--portal-error-soft)"
                : invoice.status === "due"
                  ? "var(--portal-accent-soft)"
                  : "var(--portal-success-soft)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.25rem",
            flexShrink: 0,
          }}
        >
          {invoice.status === "paid" ? "✓" : "📄"}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "var(--portal-space-2)",
              marginBottom: "4px",
            }}
          >
            <div
              style={{
                fontSize: "var(--portal-font-size-base)",
                fontWeight: "var(--portal-font-weight-semibold)",
                color: "var(--portal-text-primary)",
              }}
            >
              {invoice.description}
            </div>
            <InvoiceStatusBadge status={invoice.status} />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "var(--portal-space-2)",
            }}
          >
            <div
              style={{
                fontSize: "var(--portal-font-size-sm)",
                color: "var(--portal-text-secondary)",
              }}
            >
              {invoice.invoiceNumber} • {invoice.status === "paid" ? `Paid ${formatShortDate(invoice.paidAt!)}` : `Due ${formatShortDate(invoice.dueAt)}`}
            </div>
            <div
              style={{
                fontSize: "var(--portal-font-size-base)",
                fontWeight: "var(--portal-font-weight-semibold)",
                color:
                  invoice.status === "overdue"
                    ? "var(--portal-error)"
                    : invoice.status === "due"
                      ? "var(--portal-accent)"
                      : "var(--portal-text-primary)",
              }}
            >
              {formatCurrency(invoice.total)}
            </div>
          </div>
        </div>

        <div
          style={{
            fontSize: "var(--portal-font-size-sm)",
            color: "var(--portal-accent)",
            flexShrink: 0,
          }}
        >
          →
        </div>
      </div>
    </CardRow>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Transaction Row
 * ──────────────────────────────────────────────────────────────────────────── */

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const iconMap = {
    payment: "💳",
    refund: "↩️",
    adjustment: "📝",
  };

  const methodLabel = {
    card: "Card",
    bank_transfer: "Bank Transfer",
    cash: "Cash",
    check: "Check",
  };

  return (
    <CardRow>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--portal-space-3)" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "var(--portal-radius-md)",
            background: "var(--portal-success-soft)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1rem",
            flexShrink: 0,
          }}
        >
          {iconMap[transaction.type]}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "var(--portal-font-size-base)",
              fontWeight: "var(--portal-font-weight-medium)",
              color: "var(--portal-text-primary)",
              marginBottom: "2px",
            }}
          >
            {transaction.description}
          </div>
          <div
            style={{
              fontSize: "var(--portal-font-size-sm)",
              color: "var(--portal-text-tertiary)",
            }}
          >
            {formatDate(transaction.createdAt)}
            {transaction.paymentMethod && ` • ${methodLabel[transaction.paymentMethod]}`}
          </div>
        </div>

        <div
          style={{
            fontSize: "var(--portal-font-size-base)",
            fontWeight: "var(--portal-font-weight-semibold)",
            color: transaction.type === "refund" ? "var(--portal-error)" : "var(--portal-success)",
          }}
        >
          {transaction.type === "refund" ? "-" : "+"}
          {formatCurrency(transaction.amount)}
        </div>
      </div>
    </CardRow>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Invoice Detail View
 * ──────────────────────────────────────────────────────────────────────────── */

interface InvoiceDetailProps {
  invoice: Invoice;
  onBack: () => void;
}

function InvoiceDetail({ invoice, onBack }: InvoiceDetailProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-4)" }}>
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          all: "unset",
          display: "inline-flex",
          alignItems: "center",
          gap: "var(--portal-space-2)",
          fontSize: "var(--portal-font-size-sm)",
          color: "var(--portal-accent)",
          cursor: "pointer",
          fontWeight: "var(--portal-font-weight-medium)",
        }}
      >
        ← Back to Financials
      </button>

      {/* Invoice Header */}
      <PortalCard variant="elevated" padding="lg">
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "var(--portal-space-4)",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "var(--portal-font-size-xs)",
                fontWeight: "var(--portal-font-weight-semibold)",
                textTransform: "uppercase",
                letterSpacing: "var(--portal-letter-spacing-wide)",
                color: "var(--portal-text-tertiary)",
                marginBottom: "var(--portal-space-1)",
              }}
            >
              Invoice
            </div>
            <div
              style={{
                fontSize: "var(--portal-font-size-xl)",
                fontWeight: "var(--portal-font-weight-bold)",
                color: "var(--portal-text-primary)",
              }}
            >
              {invoice.invoiceNumber}
            </div>
          </div>
          <InvoiceStatusBadge status={invoice.status} />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: "var(--portal-space-4)",
            padding: "var(--portal-space-4) 0",
            borderTop: "1px solid var(--portal-border-subtle)",
            borderBottom: "1px solid var(--portal-border-subtle)",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "var(--portal-font-size-xs)",
                color: "var(--portal-text-tertiary)",
                marginBottom: "4px",
              }}
            >
              Issued
            </div>
            <div style={{ fontSize: "var(--portal-font-size-sm)", color: "var(--portal-text-primary)" }}>
              {formatDate(invoice.issuedAt)}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: "var(--portal-font-size-xs)",
                color: "var(--portal-text-tertiary)",
                marginBottom: "4px",
              }}
            >
              Due
            </div>
            <div style={{ fontSize: "var(--portal-font-size-sm)", color: "var(--portal-text-primary)" }}>
              {formatDate(invoice.dueAt)}
            </div>
          </div>
          {invoice.paidAt && (
            <div>
              <div
                style={{
                  fontSize: "var(--portal-font-size-xs)",
                  color: "var(--portal-text-tertiary)",
                  marginBottom: "4px",
                }}
              >
                Paid
              </div>
              <div style={{ fontSize: "var(--portal-font-size-sm)", color: "var(--portal-success)" }}>
                {formatDate(invoice.paidAt)}
              </div>
            </div>
          )}
          {invoice.relatedOffspringName && (
            <div>
              <div
                style={{
                  fontSize: "var(--portal-font-size-xs)",
                  color: "var(--portal-text-tertiary)",
                  marginBottom: "4px",
                }}
              >
                For
              </div>
              <div style={{ fontSize: "var(--portal-font-size-sm)", color: "var(--portal-text-primary)" }}>
                {invoice.relatedOffspringName}
              </div>
            </div>
          )}
        </div>
      </PortalCard>

      {/* Line Items */}
      <PortalCard variant="elevated" padding="none">
        <div style={{ padding: "var(--portal-space-4)" }}>
          <h3
            style={{
              fontSize: "var(--portal-font-size-sm)",
              fontWeight: "var(--portal-font-weight-semibold)",
              textTransform: "uppercase",
              letterSpacing: "var(--portal-letter-spacing-wide)",
              color: "var(--portal-text-tertiary)",
              margin: 0,
            }}
          >
            Line Items
          </h3>
        </div>

        {invoice.lineItems.map((item, index) => (
          <div
            key={item.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "var(--portal-space-3) var(--portal-space-4)",
              borderTop: "1px solid var(--portal-border-subtle)",
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: "var(--portal-font-size-base)",
                  color: "var(--portal-text-primary)",
                  marginBottom: "2px",
                }}
              >
                {item.description}
              </div>
              {item.quantity > 1 && (
                <div style={{ fontSize: "var(--portal-font-size-sm)", color: "var(--portal-text-tertiary)" }}>
                  {item.quantity} × {formatCurrencyPrecise(item.unitPrice)}
                </div>
              )}
            </div>
            <div
              style={{
                fontSize: "var(--portal-font-size-base)",
                fontWeight: "var(--portal-font-weight-medium)",
                color: "var(--portal-text-primary)",
              }}
            >
              {formatCurrencyPrecise(item.total)}
            </div>
          </div>
        ))}

        {/* Totals */}
        <div
          style={{
            borderTop: "1px solid var(--portal-border-subtle)",
            padding: "var(--portal-space-4)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "var(--portal-space-2)",
            }}
          >
            <span style={{ fontSize: "var(--portal-font-size-sm)", color: "var(--portal-text-secondary)" }}>
              Subtotal
            </span>
            <span style={{ fontSize: "var(--portal-font-size-sm)", color: "var(--portal-text-primary)" }}>
              {formatCurrencyPrecise(invoice.subtotal)}
            </span>
          </div>
          {invoice.tax > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "var(--portal-space-2)",
              }}
            >
              <span style={{ fontSize: "var(--portal-font-size-sm)", color: "var(--portal-text-secondary)" }}>Tax</span>
              <span style={{ fontSize: "var(--portal-font-size-sm)", color: "var(--portal-text-primary)" }}>
                {formatCurrencyPrecise(invoice.tax)}
              </span>
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              paddingTop: "var(--portal-space-2)",
              borderTop: "1px solid var(--portal-border-subtle)",
            }}
          >
            <span
              style={{
                fontSize: "var(--portal-font-size-base)",
                fontWeight: "var(--portal-font-weight-semibold)",
                color: "var(--portal-text-primary)",
              }}
            >
              Total
            </span>
            <span
              style={{
                fontSize: "var(--portal-font-size-lg)",
                fontWeight: "var(--portal-font-weight-bold)",
                color: "var(--portal-text-primary)",
              }}
            >
              {formatCurrencyPrecise(invoice.total)}
            </span>
          </div>
        </div>
      </PortalCard>

      {/* Payment Status */}
      <PortalCard
        variant={invoice.status === "paid" ? "flat" : "interactive"}
        padding="lg"
        style={{
          background:
            invoice.status === "paid"
              ? "var(--portal-success-soft)"
              : invoice.status === "overdue"
                ? "var(--portal-error-soft)"
                : undefined,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--portal-space-3)" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: invoice.status === "paid" ? "var(--portal-success)" : "var(--portal-bg-card)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem",
              color: invoice.status === "paid" ? "white" : "var(--portal-accent)",
            }}
          >
            {invoice.status === "paid" ? "✓" : "💳"}
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: "var(--portal-font-size-lg)",
                fontWeight: "var(--portal-font-weight-semibold)",
                color:
                  invoice.status === "paid"
                    ? "var(--portal-success)"
                    : invoice.status === "overdue"
                      ? "var(--portal-error)"
                      : "var(--portal-text-primary)",
                marginBottom: "4px",
              }}
            >
              {invoice.status === "paid"
                ? "Payment Complete"
                : invoice.status === "overdue"
                  ? "Payment Overdue"
                  : "Payment Due"}
            </div>
            <div
              style={{
                fontSize: "var(--portal-font-size-sm)",
                color:
                  invoice.status === "paid"
                    ? "var(--portal-success)"
                    : invoice.status === "overdue"
                      ? "var(--portal-error)"
                      : "var(--portal-text-secondary)",
              }}
            >
              {invoice.status === "paid"
                ? `Paid on ${formatDate(invoice.paidAt!)}`
                : `${formatCurrency(invoice.amountDue)} due by ${formatDate(invoice.dueAt)}`}
            </div>
          </div>
          {invoice.status !== "paid" && (
            <div
              style={{
                fontSize: "var(--portal-font-size-2xl)",
                fontWeight: "var(--portal-font-weight-bold)",
                color: invoice.status === "overdue" ? "var(--portal-error)" : "var(--portal-accent)",
              }}
            >
              {formatCurrency(invoice.amountDue)}
            </div>
          )}
        </div>
      </PortalCard>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Invoices List View
 * ──────────────────────────────────────────────────────────────────────────── */

interface InvoicesListProps {
  invoices: Invoice[];
  onSelectInvoice: (id: number) => void;
}

function InvoicesList({ invoices, onSelectInvoice }: InvoicesListProps) {
  // Group invoices by status
  const overdueInvoices = invoices.filter((inv) => inv.status === "overdue");
  const dueInvoices = invoices.filter((inv) => inv.status === "due");
  const paidInvoices = invoices.filter((inv) => inv.status === "paid");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-5)" }}>
      {overdueInvoices.length > 0 && (
        <div>
          <h2
            style={{
              fontSize: "var(--portal-font-size-sm)",
              fontWeight: "var(--portal-font-weight-semibold)",
              textTransform: "uppercase",
              letterSpacing: "var(--portal-letter-spacing-wide)",
              color: "var(--portal-error)",
              margin: 0,
              marginBottom: "var(--portal-space-3)",
            }}
          >
            Overdue
          </h2>
          <PortalCard variant="elevated" padding="none">
            {overdueInvoices.map((invoice) => (
              <InvoiceRow key={invoice.id} invoice={invoice} onClick={() => onSelectInvoice(invoice.id)} />
            ))}
          </PortalCard>
        </div>
      )}

      {dueInvoices.length > 0 && (
        <div>
          <h2
            style={{
              fontSize: "var(--portal-font-size-sm)",
              fontWeight: "var(--portal-font-weight-semibold)",
              textTransform: "uppercase",
              letterSpacing: "var(--portal-letter-spacing-wide)",
              color: "var(--portal-text-tertiary)",
              margin: 0,
              marginBottom: "var(--portal-space-3)",
            }}
          >
            Due
          </h2>
          <PortalCard variant="elevated" padding="none">
            {dueInvoices.map((invoice) => (
              <InvoiceRow key={invoice.id} invoice={invoice} onClick={() => onSelectInvoice(invoice.id)} />
            ))}
          </PortalCard>
        </div>
      )}

      {paidInvoices.length > 0 && (
        <div>
          <h2
            style={{
              fontSize: "var(--portal-font-size-sm)",
              fontWeight: "var(--portal-font-weight-semibold)",
              textTransform: "uppercase",
              letterSpacing: "var(--portal-letter-spacing-wide)",
              color: "var(--portal-text-tertiary)",
              margin: 0,
              marginBottom: "var(--portal-space-3)",
            }}
          >
            Paid
          </h2>
          <PortalCard variant="elevated" padding="none">
            {paidInvoices.map((invoice) => (
              <InvoiceRow key={invoice.id} invoice={invoice} onClick={() => onSelectInvoice(invoice.id)} />
            ))}
          </PortalCard>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Recent Transactions
 * ──────────────────────────────────────────────────────────────────────────── */

function RecentTransactions({ transactions }: { transactions: Transaction[] }) {
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div>
      <h2
        style={{
          fontSize: "var(--portal-font-size-sm)",
          fontWeight: "var(--portal-font-weight-semibold)",
          textTransform: "uppercase",
          letterSpacing: "var(--portal-letter-spacing-wide)",
          color: "var(--portal-text-tertiary)",
          margin: 0,
          marginBottom: "var(--portal-space-3)",
        }}
      >
        Recent Transactions
      </h2>
      <PortalCard variant="elevated" padding="none">
        {sortedTransactions.slice(0, 5).map((transaction) => (
          <TransactionRow key={transaction.id} transaction={transaction} />
        ))}
      </PortalCard>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * View Toggle
 * ──────────────────────────────────────────────────────────────────────────── */

type ViewMode = "overview" | "invoices";

function ViewToggle({ mode, onChange }: { mode: ViewMode; onChange: (mode: ViewMode) => void }) {
  return (
    <div
      style={{
        display: "inline-flex",
        background: "var(--portal-bg-elevated)",
        borderRadius: "var(--portal-radius-md)",
        padding: "4px",
        gap: "4px",
      }}
    >
      {(["overview", "invoices"] as ViewMode[]).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          style={{
            all: "unset",
            padding: "var(--portal-space-2) var(--portal-space-3)",
            fontSize: "var(--portal-font-size-sm)",
            fontWeight: "var(--portal-font-weight-medium)",
            color: mode === m ? "var(--portal-text-primary)" : "var(--portal-text-tertiary)",
            background: mode === m ? "var(--portal-bg-card)" : "transparent",
            borderRadius: "var(--portal-radius-sm)",
            cursor: "pointer",
            transition: "all var(--portal-transition)",
            textTransform: "capitalize",
          }}
        >
          {m}
        </button>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Empty State
 * ──────────────────────────────────────────────────────────────────────────── */

function EmptyState() {
  return (
    <PortalCard variant="flat" padding="lg">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "var(--portal-space-6)",
          gap: "var(--portal-space-3)",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "var(--portal-bg-elevated)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.5rem",
          }}
        >
          💳
        </div>
        <h3
          style={{
            fontSize: "var(--portal-font-size-lg)",
            fontWeight: "var(--portal-font-weight-semibold)",
            color: "var(--portal-text-primary)",
            margin: 0,
          }}
        >
          No invoices yet
        </h3>
        <p
          style={{
            fontSize: "var(--portal-font-size-base)",
            color: "var(--portal-text-secondary)",
            margin: 0,
            maxWidth: "320px",
          }}
        >
          Invoices and payment history will appear here when your breeder creates them.
        </p>
      </div>
    </PortalCard>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Loading State
 * ──────────────────────────────────────────────────────────────────────────── */

function LoadingState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-4)" }}>
      <div
        style={{
          height: "140px",
          background: "var(--portal-bg-elevated)",
          borderRadius: "var(--portal-radius-2xl)",
        }}
      />
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            height: "80px",
            background: "var(--portal-bg-elevated)",
            borderRadius: "var(--portal-radius-lg)",
          }}
        />
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Main Component
 * ──────────────────────────────────────────────────────────────────────────── */

export default function PortalFinancialsPage() {
  const [viewMode, setViewMode] = React.useState<ViewMode>("overview");
  const [selectedInvoiceId, setSelectedInvoiceId] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(true);

  const mockEnabled = isPortalMockEnabled();

  // Simulate loading
  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  // Get mock data
  const invoices = mockEnabled ? mockInvoices() : [];
  const transactions = mockEnabled ? mockTransactions() : [];
  const summary = mockEnabled ? mockFinancialSummary() : null;

  // Handle URL-based invoice detail
  React.useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/\/financials\/(\d+)/);
    if (match) {
      setSelectedInvoiceId(parseInt(match[1], 10));
    }
  }, []);

  const handleSelectInvoice = (id: number) => {
    setSelectedInvoiceId(id);
    window.history.pushState(null, "", `/financials/${id}`);
  };

  const handleBack = () => {
    setSelectedInvoiceId(null);
    window.history.pushState(null, "", "/financials");
  };

  // Loading state
  if (loading) {
    return (
      <PageContainer>
        <LoadingState />
      </PageContainer>
    );
  }

  // Invoice detail view
  if (selectedInvoiceId !== null) {
    const invoice = mockEnabled ? mockInvoiceDetail(selectedInvoiceId) : null;
    if (invoice) {
      return (
        <PageContainer>
          <InvoiceDetail invoice={invoice} onBack={handleBack} />
        </PageContainer>
      );
    }
  }

  // Empty state
  if (!mockEnabled || invoices.length === 0) {
    return (
      <PageContainer>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-4)" }}>
          <PortalHero
            variant="page"
            title="Financials"
            subtitle="Your invoices and payment history"
            status="info"
            statusLabel="No invoices"
          />
          <EmptyState />
        </div>
      </PageContainer>
    );
  }

  // Calculate status for hero
  const overdueCount = invoices.filter((inv) => inv.status === "overdue").length;
  const dueCount = invoices.filter((inv) => inv.status === "due").length;

  return (
    <PageContainer>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-4)" }}>
        {/* Hero */}
        <PortalHero
          variant="page"
          title="Financials"
          subtitle="Your invoices and payment history"
          status={overdueCount > 0 ? "error" : dueCount > 0 ? "action" : "success"}
          statusLabel={
            overdueCount > 0
              ? `${overdueCount} overdue`
              : dueCount > 0
                ? `${dueCount} due`
                : "All paid"
          }
        />

        {/* Summary Card */}
        {summary && <FinancialSummaryCard summary={summary} />}

        {/* View Toggle */}
        <div style={{ display: "flex", justifyContent: "flex-start" }}>
          <ViewToggle mode={viewMode} onChange={setViewMode} />
        </div>

        {/* Content based on view mode */}
        {viewMode === "overview" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-5)" }}>
            {/* Active invoices (due + overdue) */}
            {(invoices.filter((inv) => inv.status === "due" || inv.status === "overdue").length > 0) && (
              <InvoicesList
                invoices={invoices.filter((inv) => inv.status === "due" || inv.status === "overdue")}
                onSelectInvoice={handleSelectInvoice}
              />
            )}
            {/* Recent transactions */}
            {transactions.length > 0 && <RecentTransactions transactions={transactions} />}
          </div>
        ) : (
          <InvoicesList invoices={invoices} onSelectInvoice={handleSelectInvoice} />
        )}
      </div>
    </PageContainer>
  );
}
