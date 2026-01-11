// apps/portal/src/pages/PortalFinancialsPage.tsx
import * as React from "react";
import { PageContainer } from "../design/PageContainer";
import { PortalHero } from "../design/PortalHero";
import { PortalCard } from "../design/PortalCard";
import { createPortalFetch, useTenantContext, buildApiPath } from "../derived/tenantContext";
// Types for financial data
interface Invoice {
  id: number;
  invoiceNumber: string;
  description: string;
  total: number;
  subtotal?: number;
  tax?: number;
  amountPaid: number;
  amountDue: number;
  status: InvoiceStatus;
  issuedAt: string;
  dueAt: string;
  paidAt?: string;
  relatedOffspringName?: string | null;
  lineItems: Array<{
    id?: number;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  // Payment details (populated when paid)
  paymentMethod?: string;
  paymentReference?: string;
}

interface Transaction {
  id: number;
  date: string;
  createdAt?: string;
  description: string;
  amount: number;
  type: "payment" | "refund";
  status: "completed" | "pending" | "failed";
  paymentMethod?: string;
  invoiceNumber?: string;
}

interface FinancialSummary {
  totalPaid: number;
  totalDue: number;
  overdueAmount: number;
  nextPaymentAmount: number | null;
  nextPaymentDueAt: string | null;
  invoiceCount: number;
}

type InvoiceStatus = "paid" | "due" | "overdue" | "draft";
import { SubjectHeader } from "../components/SubjectHeader";

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
 * Status Badge - with safe defaults
 * ──────────────────────────────────────────────────────────────────────────── */

function InvoiceStatusBadge({ status }: { status: InvoiceStatus | string }) {
  const config: Record<string, { label: string; bg: string; color: string; dot: string }> = {
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

  // Safe default for unknown status
  const c = config[status] || {
    label: String(status || "Unknown"),
    bg: "var(--portal-bg-elevated)",
    color: "var(--portal-text-secondary)",
    dot: "var(--portal-text-tertiary)",
  };

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
 * Pay Now Button
 * ──────────────────────────────────────────────────────────────────────────── */

interface PayNowButtonProps {
  amount: number;
  variant?: "primary" | "compact";
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
}

function PayNowButton({ amount, variant = "primary", onClick, disabled }: PayNowButtonProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  const isPrimary = variant === "primary";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        all: "unset",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--portal-space-2)",
        padding: isPrimary ? "var(--portal-space-3) var(--portal-space-4)" : "var(--portal-space-2) var(--portal-space-3)",
        background: isHovered ? "var(--portal-accent-hover)" : "var(--portal-accent)",
        color: "white",
        borderRadius: "var(--portal-radius-md)",
        fontSize: isPrimary ? "var(--portal-font-size-base)" : "var(--portal-font-size-sm)",
        fontWeight: "var(--portal-font-weight-semibold)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "all var(--portal-transition)",
        transform: isHovered && !disabled ? "translateY(-1px)" : "translateY(0)",
        boxShadow: isHovered && !disabled
          ? "0 4px 12px rgba(255, 107, 53, 0.4)"
          : "0 2px 8px rgba(255, 107, 53, 0.3)",
        whiteSpace: "nowrap",
      }}
    >
      <span>Pay {formatCurrency(amount)}</span>
      <span style={{ fontSize: isPrimary ? "1rem" : "0.875rem" }}>→</span>
    </button>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Payment Success Modal
 * ──────────────────────────────────────────────────────────────────────────── */

interface PaymentSuccessModalProps {
  invoice: Invoice;
  onClose: () => void;
}

function PaymentSuccessModal({ invoice, onClose }: PaymentSuccessModalProps) {
  const [animationStage, setAnimationStage] = React.useState<"entering" | "visible" | "exiting">("entering");

  React.useEffect(() => {
    // Enter animation
    const enterTimer = setTimeout(() => setAnimationStage("visible"), 50);
    return () => clearTimeout(enterTimer);
  }, []);

  const handleClose = React.useCallback(() => {
    setAnimationStage("exiting");
    setTimeout(onClose, 200);
  }, [onClose]);

  // Auto-close after 3 seconds
  React.useEffect(() => {
    const timer = setTimeout(handleClose, 3000);
    return () => clearTimeout(timer);
  }, [handleClose]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: animationStage === "entering" ? "rgba(0, 0, 0, 0)" : "rgba(0, 0, 0, 0.6)",
        transition: "background 200ms ease-out",
      }}
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--portal-bg-card)",
          borderRadius: "var(--portal-radius-2xl)",
          padding: "var(--portal-space-6)",
          maxWidth: "400px",
          width: "90%",
          textAlign: "center",
          transform: animationStage === "visible" ? "scale(1)" : "scale(0.9)",
          opacity: animationStage === "visible" ? 1 : 0,
          transition: "transform 200ms ease-out, opacity 200ms ease-out",
          boxShadow: "0 24px 80px rgba(0, 0, 0, 0.5)",
        }}
      >
        {/* Success checkmark */}
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            background: "var(--portal-success)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto var(--portal-space-4)",
            fontSize: "2rem",
            color: "white",
            boxShadow: "0 0 32px rgba(34, 197, 94, 0.4)",
          }}
        >
          ✓
        </div>

        <h2
          style={{
            fontSize: "var(--portal-font-size-xl)",
            fontWeight: "var(--portal-font-weight-bold)",
            color: "var(--portal-text-primary)",
            margin: 0,
            marginBottom: "var(--portal-space-2)",
          }}
        >
          Payment Complete
        </h2>

        <p
          style={{
            fontSize: "var(--portal-font-size-base)",
            color: "var(--portal-text-secondary)",
            margin: 0,
            marginBottom: "var(--portal-space-4)",
          }}
        >
          {formatCurrency(invoice.amountDue)} paid for {invoice.description}
        </p>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--portal-space-2)",
            padding: "var(--portal-space-2) var(--portal-space-3)",
            background: "var(--portal-success-soft)",
            borderRadius: "var(--portal-radius-md)",
            fontSize: "var(--portal-font-size-sm)",
            color: "var(--portal-success)",
          }}
        >
          <span>✓</span>
          <span>Invoice {invoice.invoiceNumber} marked as paid</span>
        </div>
      </div>
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
 * Invoice Row - Fully clickable with hover states
 * ──────────────────────────────────────────────────────────────────────────── */

interface InvoiceRowProps {
  invoice: Invoice;
  onClick: () => void;
  onPayNow?: () => void;
}

function InvoiceRow({ invoice, onClick, onPayNow }: InvoiceRowProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);
  const showPayButton = (invoice.status === "due" || invoice.status === "overdue") && onPayNow;

  const handlePayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPayNow?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--portal-space-3)",
        padding: "var(--portal-space-3) var(--portal-space-4)",
        borderBottom: "1px solid var(--portal-border-subtle)",
        cursor: "pointer",
        background: isHovered || isFocused ? "var(--portal-bg-elevated)" : "transparent",
        transition: "background var(--portal-transition), transform var(--portal-transition)",
        transform: isHovered ? "translateX(2px)" : "translateX(0)",
        outline: isFocused ? "2px solid var(--portal-accent)" : "none",
        outlineOffset: "-2px",
      }}
    >
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
          transition: "transform var(--portal-transition)",
          transform: isHovered ? "scale(1.05)" : "scale(1)",
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

      {/* Pay Now button or chevron */}
      {showPayButton ? (
        <PayNowButton amount={invoice.amountDue} variant="compact" onClick={handlePayClick} />
      ) : (
        <div
          style={{
            fontSize: "var(--portal-font-size-sm)",
            color: "var(--portal-accent)",
            flexShrink: 0,
            transition: "transform var(--portal-transition)",
            transform: isHovered ? "translateX(2px)" : "translateX(0)",
          }}
        >
          →
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Transaction Row
 * ──────────────────────────────────────────────────────────────────────────── */

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const iconMap: Record<string, string> = {
    payment: "💳",
    refund: "↩️",
    adjustment: "📝",
  };

  const methodLabel: Record<string, string> = {
    card: "Card",
    bank_transfer: "Bank Transfer",
    cash: "Cash",
    check: "Check",
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--portal-space-3)",
        padding: "var(--portal-space-3) var(--portal-space-4)",
        borderBottom: "1px solid var(--portal-border-subtle)",
      }}
    >
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
        {iconMap[transaction.type] || "💰"}
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
          {formatDate(transaction.createdAt || transaction.date)}
          {transaction.paymentMethod && ` • ${methodLabel[transaction.paymentMethod] || transaction.paymentMethod}`}
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
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Receipt Modal - Shows payment details for paid invoices
 * ──────────────────────────────────────────────────────────────────────────── */

interface ReceiptModalProps {
  invoice: Invoice;
  onClose: () => void;
}

function ReceiptModal({ invoice, onClose }: ReceiptModalProps) {
  const [animationStage, setAnimationStage] = React.useState<"entering" | "visible" | "exiting">("entering");

  React.useEffect(() => {
    const enterTimer = setTimeout(() => setAnimationStage("visible"), 50);
    return () => clearTimeout(enterTimer);
  }, []);

  const handleClose = React.useCallback(() => {
    setAnimationStage("exiting");
    setTimeout(onClose, 200);
  }, [onClose]);

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [handleClose]);

  // Payment details from invoice or derive from available data
  const paymentMethod = invoice.paymentMethod || "Card payment";
  const referenceId = invoice.paymentReference || `PAY-${invoice.invoiceNumber.replace("INV-", "")}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: animationStage === "entering" ? "rgba(0, 0, 0, 0)" : "rgba(0, 0, 0, 0.6)",
        transition: "background 200ms ease-out",
      }}
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--portal-bg-card)",
          borderRadius: "var(--portal-radius-2xl)",
          padding: "var(--portal-space-5)",
          maxWidth: "420px",
          width: "90%",
          transform: animationStage === "visible" ? "scale(1)" : "scale(0.95)",
          opacity: animationStage === "visible" ? 1 : 0,
          transition: "transform 200ms ease-out, opacity 200ms ease-out",
          boxShadow: "0 24px 80px rgba(0, 0, 0, 0.5)",
        }}
      >
        {/* Header */}
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
                marginBottom: "4px",
              }}
            >
              Payment Receipt
            </div>
            <h2
              id="receipt-title"
              style={{
                fontSize: "var(--portal-font-size-lg)",
                fontWeight: "var(--portal-font-weight-bold)",
                color: "var(--portal-text-primary)",
                margin: 0,
              }}
            >
              {invoice.invoiceNumber}
            </h2>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close receipt"
            style={{
              all: "unset",
              width: "32px",
              height: "32px",
              borderRadius: "var(--portal-radius-md)",
              background: "var(--portal-bg-elevated)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--portal-text-secondary)",
              fontSize: "1rem",
            }}
          >
            ✕
          </button>
        </div>

        {/* Success indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--portal-space-2)",
            padding: "var(--portal-space-3)",
            background: "var(--portal-success-soft)",
            borderRadius: "var(--portal-radius-lg)",
            marginBottom: "var(--portal-space-4)",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "var(--portal-success)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "1rem",
              flexShrink: 0,
            }}
          >
            ✓
          </div>
          <div>
            <div
              style={{
                fontSize: "var(--portal-font-size-base)",
                fontWeight: "var(--portal-font-weight-semibold)",
                color: "var(--portal-success)",
              }}
            >
              Payment Successful
            </div>
            <div style={{ fontSize: "var(--portal-font-size-sm)", color: "var(--portal-text-secondary)" }}>
              {formatDate(invoice.paidAt!)}
            </div>
          </div>
        </div>

        {/* Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--portal-space-3)" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "var(--portal-space-2) 0",
              borderBottom: "1px solid var(--portal-border-subtle)",
            }}
          >
            <span style={{ fontSize: "var(--portal-font-size-sm)", color: "var(--portal-text-secondary)" }}>
              Description
            </span>
            <span
              style={{
                fontSize: "var(--portal-font-size-sm)",
                color: "var(--portal-text-primary)",
                textAlign: "right",
              }}
            >
              {invoice.description}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "var(--portal-space-2) 0",
              borderBottom: "1px solid var(--portal-border-subtle)",
            }}
          >
            <span style={{ fontSize: "var(--portal-font-size-sm)", color: "var(--portal-text-secondary)" }}>
              Amount Paid
            </span>
            <span
              style={{
                fontSize: "var(--portal-font-size-base)",
                fontWeight: "var(--portal-font-weight-semibold)",
                color: "var(--portal-success)",
              }}
            >
              {formatCurrencyPrecise(invoice.total)}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "var(--portal-space-2) 0",
              borderBottom: "1px solid var(--portal-border-subtle)",
            }}
          >
            <span style={{ fontSize: "var(--portal-font-size-sm)", color: "var(--portal-text-secondary)" }}>
              Payment Method
            </span>
            <span style={{ fontSize: "var(--portal-font-size-sm)", color: "var(--portal-text-primary)" }}>
              {paymentMethod}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "var(--portal-space-2) 0",
            }}
          >
            <span style={{ fontSize: "var(--portal-font-size-sm)", color: "var(--portal-text-secondary)" }}>
              Reference ID
            </span>
            <span
              style={{
                fontSize: "var(--portal-font-size-xs)",
                fontFamily: "monospace",
                color: "var(--portal-text-tertiary)",
              }}
            >
              {referenceId}
            </span>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          style={{
            all: "unset",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            padding: "var(--portal-space-3)",
            marginTop: "var(--portal-space-4)",
            background: "var(--portal-bg-elevated)",
            borderRadius: "var(--portal-radius-md)",
            fontSize: "var(--portal-font-size-sm)",
            fontWeight: "var(--portal-font-weight-medium)",
            color: "var(--portal-text-secondary)",
            cursor: "pointer",
            transition: "background var(--portal-transition)",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Invoice Detail View
 * ──────────────────────────────────────────────────────────────────────────── */

interface InvoiceDetailProps {
  invoice: Invoice;
  onBack: () => void;
  onPayNow?: () => void;
  onViewReceipt?: () => void;
}

function InvoiceDetail({ invoice, onBack, onPayNow, onViewReceipt }: InvoiceDetailProps) {
  const showPayButton = (invoice.status === "due" || invoice.status === "overdue") && onPayNow;
  const showReceiptButton = invoice.status === "paid" && onViewReceipt;

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

        {invoice.lineItems.map((item) => (
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
              {formatCurrencyPrecise(invoice.subtotal ?? invoice.total)}
            </span>
          </div>
          {(invoice.tax ?? 0) > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "var(--portal-space-2)",
              }}
            >
              <span style={{ fontSize: "var(--portal-font-size-sm)", color: "var(--portal-text-secondary)" }}>Tax</span>
              <span style={{ fontSize: "var(--portal-font-size-sm)", color: "var(--portal-text-primary)" }}>
                {formatCurrencyPrecise(invoice.tax ?? 0)}
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

      {/* Payment Action Card */}
      <PortalCard
        variant={invoice.status === "paid" ? "flat" : "elevated"}
        padding="lg"
        style={{
          background:
            invoice.status === "paid"
              ? "var(--portal-success-soft)"
              : invoice.status === "overdue"
                ? "linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%), var(--portal-bg-card)"
                : undefined,
          border: invoice.status === "overdue" ? "1px solid rgba(239, 68, 68, 0.3)" : undefined,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--portal-space-3)" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: invoice.status === "paid" ? "var(--portal-success)" : "var(--portal-bg-elevated)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem",
              color: invoice.status === "paid" ? "white" : "var(--portal-accent)",
              flexShrink: 0,
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
          {showPayButton ? (
            <PayNowButton amount={invoice.amountDue} onClick={() => onPayNow?.()} />
          ) : showReceiptButton ? (
            <button
              onClick={() => onViewReceipt?.()}
              style={{
                all: "unset",
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--portal-space-2)",
                padding: "var(--portal-space-2) var(--portal-space-3)",
                background: "var(--portal-bg-elevated)",
                borderRadius: "var(--portal-radius-md)",
                fontSize: "var(--portal-font-size-sm)",
                fontWeight: "var(--portal-font-weight-medium)",
                color: "var(--portal-text-primary)",
                cursor: "pointer",
                transition: "background var(--portal-transition)",
              }}
            >
              View Receipt
            </button>
          ) : invoice.status !== "paid" ? (
            <div
              style={{
                fontSize: "var(--portal-font-size-2xl)",
                fontWeight: "var(--portal-font-weight-bold)",
                color: invoice.status === "overdue" ? "var(--portal-error)" : "var(--portal-accent)",
              }}
            >
              {formatCurrency(invoice.amountDue)}
            </div>
          ) : null}
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
  onPayInvoice?: (id: number) => void;
}

function InvoicesList({ invoices, onSelectInvoice, onPayInvoice }: InvoicesListProps) {
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
              <InvoiceRow
                key={invoice.id}
                invoice={invoice}
                onClick={() => onSelectInvoice(invoice.id)}
                onPayNow={onPayInvoice ? () => onPayInvoice(invoice.id) : undefined}
              />
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
              <InvoiceRow
                key={invoice.id}
                invoice={invoice}
                onClick={() => onSelectInvoice(invoice.id)}
                onPayNow={onPayInvoice ? () => onPayInvoice(invoice.id) : undefined}
              />
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
    (a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
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
  const { tenantSlug, isReady } = useTenantContext();
  const [viewMode, setViewMode] = React.useState<ViewMode>("overview");
  const [selectedInvoiceId, setSelectedInvoiceId] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [successModal, setSuccessModal] = React.useState<Invoice | null>(null);
  const [receiptModal, setReceiptModal] = React.useState<Invoice | null>(null);
  const [paymentSuccessBanner, setPaymentSuccessBanner] = React.useState(false);
  const [paymentCanceledBanner, setPaymentCanceledBanner] = React.useState(false);

  // Real API data state
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [summary, setSummary] = React.useState<FinancialSummary | null>(null);
  const [primaryAnimal, setPrimaryAnimal] = React.useState<any>(null);

  // Create bound fetch function for use in callbacks
  const portalFetch = React.useMemo(
    () => createPortalFetch(tenantSlug),
    [tenantSlug]
  );

  // Animal context
  const animalName = primaryAnimal?.offspring?.name || "your reservation";
  const species = primaryAnimal?.offspring?.species || primaryAnimal?.species || null;
  const breed = primaryAnimal?.offspring?.breed || primaryAnimal?.breed || null;

  // Check for Stripe checkout return parameters
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      setPaymentSuccessBanner(true);
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
      // Auto-dismiss after 5 seconds
      setTimeout(() => setPaymentSuccessBanner(false), 5000);
    } else if (params.get("canceled") === "true") {
      setPaymentCanceledBanner(true);
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
      // Auto-dismiss after 5 seconds
      setTimeout(() => setPaymentCanceledBanner(false), 5000);
    }
  }, []);

  // Load real data from API - wait for tenant context
  React.useEffect(() => {
    if (!isReady) return;

    let cancelled = false;

    async function loadFinancialData() {
      setLoading(true);
      try {
        // Fetch financial data in parallel
        const [invoicesData, financialsData, placementsData] = await Promise.all([
          portalFetch<{ invoices: any[] }>("/portal/invoices").catch(() => null),
          portalFetch<any>("/portal/financials").catch(() => null),
          portalFetch<{ placements: any[] }>("/portal/placements").catch(() => null),
        ]);

        if (cancelled) return;

        if (invoicesData) {
          setInvoices(invoicesData.invoices || []);
        }

        if (financialsData) {
          // Map API response to FinancialSummary structure
          setSummary({
            totalPaid: financialsData.totalPaid || 0,
            totalDue: financialsData.totalDue || 0,
            overdueAmount: financialsData.overdueAmount || 0,
            nextPaymentAmount: financialsData.nextPaymentAmount || null,
            nextPaymentDueAt: financialsData.nextPaymentDueAt || null,
            invoiceCount: financialsData.invoiceCount || 0,
          });
          // Extract transactions if included
          if (financialsData.transactions) {
            setTransactions(financialsData.transactions);
          }
        }

        if (placementsData) {
          const placements = placementsData.placements || [];
          if (placements.length > 0) {
            setPrimaryAnimal(placements[0]);
          }
        }
      } catch (err) {
        if (cancelled) return;
        console.error("[PortalFinancials] Failed to load data:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadFinancialData();
    return () => { cancelled = true; };
  }, [portalFetch, isReady]);

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

  const handlePayInvoice = async (id: number) => {
    // Find the invoice
    const invoice = invoices.find((inv) => inv.id === id);
    if (!invoice) return;

    try {
      // Call the portal checkout endpoint to create a Stripe checkout session
      const data = await portalFetch<{ checkoutUrl?: string }>(`/portal/invoices/${id}/checkout`, {
        method: "POST",
      });

      // Redirect to Stripe checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      console.error("[PortalFinancials] Checkout error:", err);
      // Show error to user - for now just alert, could add a toast later
      alert(err.message || "Failed to start payment. Please try again.");
    }
  };

  const handleCloseSuccessModal = () => {
    setSuccessModal(null);
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
    const invoice = invoices.find((inv) => inv.id === selectedInvoiceId);
    if (invoice) {
      return (
        <PageContainer>
          <InvoiceDetail
            invoice={invoice}
            onBack={handleBack}
            onPayNow={invoice.status !== "paid" ? () => handlePayInvoice(selectedInvoiceId) : undefined}
            onViewReceipt={invoice.status === "paid" ? () => setReceiptModal(invoice) : undefined}
          />
          {successModal && <PaymentSuccessModal invoice={successModal} onClose={handleCloseSuccessModal} />}
          {receiptModal && <ReceiptModal invoice={receiptModal} onClose={() => setReceiptModal(null)} />}
        </PageContainer>
      );
    }
  }

  // Empty state
  if (invoices.length === 0) {
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
        {/* Payment Success Banner */}
        {paymentSuccessBanner && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--portal-space-3)",
              padding: "var(--portal-space-3) var(--portal-space-4)",
              background: "var(--portal-success-soft)",
              borderRadius: "var(--portal-radius-lg)",
              border: "1px solid var(--portal-success)",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "var(--portal-success)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "1rem",
                flexShrink: 0,
              }}
            >
              ✓
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: "var(--portal-font-size-base)",
                  fontWeight: "var(--portal-font-weight-semibold)",
                  color: "var(--portal-success)",
                }}
              >
                Payment Successful!
              </div>
              <div style={{ fontSize: "var(--portal-font-size-sm)", color: "var(--portal-text-secondary)" }}>
                Your payment has been processed. The invoice will be updated shortly.
              </div>
            </div>
            <button
              onClick={() => setPaymentSuccessBanner(false)}
              style={{
                all: "unset",
                cursor: "pointer",
                padding: "var(--portal-space-1)",
                color: "var(--portal-text-secondary)",
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Payment Canceled Banner */}
        {paymentCanceledBanner && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--portal-space-3)",
              padding: "var(--portal-space-3) var(--portal-space-4)",
              background: "var(--portal-bg-elevated)",
              borderRadius: "var(--portal-radius-lg)",
              border: "1px solid var(--portal-border)",
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: "var(--portal-font-size-base)",
                  fontWeight: "var(--portal-font-weight-medium)",
                  color: "var(--portal-text-primary)",
                }}
              >
                Payment Canceled
              </div>
              <div style={{ fontSize: "var(--portal-font-size-sm)", color: "var(--portal-text-secondary)" }}>
                Your payment was canceled. You can try again when you're ready.
              </div>
            </div>
            <button
              onClick={() => setPaymentCanceledBanner(false)}
              style={{
                all: "unset",
                cursor: "pointer",
                padding: "var(--portal-space-1)",
                color: "var(--portal-text-secondary)",
              }}
            >
              ✕
            </button>
          </div>
        )}

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

        {/* Subject Header - Species-aware context */}
        <SubjectHeader
          name={animalName}
          species={species}
          breed={breed}
          statusLabel={
            overdueCount > 0
              ? `${overdueCount} overdue`
              : dueCount > 0
                ? `${dueCount} due`
                : "All paid"
          }
          statusVariant={overdueCount > 0 ? "error" : dueCount > 0 ? "warning" : "success"}
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
            {invoices.filter((inv) => inv.status === "due" || inv.status === "overdue").length > 0 && (
              <InvoicesList
                invoices={invoices.filter((inv) => inv.status === "due" || inv.status === "overdue")}
                onSelectInvoice={handleSelectInvoice}
                onPayInvoice={handlePayInvoice}
              />
            )}
            {/* Recent transactions */}
            {transactions.length > 0 && <RecentTransactions transactions={transactions} />}
          </div>
        ) : (
          <InvoicesList
            invoices={invoices}
            onSelectInvoice={handleSelectInvoice}
            onPayInvoice={handlePayInvoice}
          />
        )}
      </div>

      {/* Success Modal */}
      {successModal && <PaymentSuccessModal invoice={successModal} onClose={handleCloseSuccessModal} />}
    </PageContainer>
  );
}
