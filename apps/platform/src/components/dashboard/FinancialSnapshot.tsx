// apps/platform/src/components/dashboard/FinancialSnapshot.tsx
// Financial metrics at a glance - AR, deposits, revenue, expenses

import * as React from "react";
import type { FinanceSummary } from "../../features/useDashboardDataV2";

type Props = {
  summary: FinanceSummary | null;
  loading?: boolean;
};

// ─────────────────── Helpers ───────────────────

function formatCents(cents: number): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(dollars);
}

function formatCentsCompact(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 10000) {
    return `$${(dollars / 1000).toFixed(1)}k`;
  }
  return formatCents(cents);
}

// ─────────────────── Icons ───────────────────

function ReceivableIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function DepositIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M12 12h.01" />
      <path d="M17 12h.01" />
      <path d="M7 12h.01" />
    </svg>
  );
}

function RevenueIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function ExpenseIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 17l10-10 4 4 6-6" />
      <path d="M14 7h8v8" />
    </svg>
  );
}

// ─────────────────── Components ───────────────────

function Skeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-[#222222] rounded w-16 mb-2" />
      <div className="h-7 bg-[#222222] rounded w-24" />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  href,
  loading,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  href?: string;
  loading?: boolean;
}) {
  const content = (
    <div
      className={`
        rounded-xl border
        border-[rgba(60,60,60,0.5)]
        bg-[#1a1a1a]
        p-4
        transition-all duration-200
        ${href ? "hover:bg-[#222222] hover:border-[rgba(255,107,53,0.3)] hover:-translate-y-0.5 cursor-pointer" : ""}
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-[rgba(255,255,255,0.5)] uppercase tracking-wide">{label}</span>
        <div className={`${color}`}>{icon}</div>
      </div>
      {loading ? (
        <Skeleton />
      ) : (
        <div className="text-2xl font-semibold text-white tabular-nums">{value}</div>
      )}
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block">
        {content}
      </a>
    );
  }

  return content;
}

// ─────────────────── Main Component ───────────────────

export default function FinancialSnapshot({ summary, loading }: Props) {
  const s = summary ?? {
    outstandingTotalCents: 0,
    invoicedMtdCents: 0,
    collectedMtdCents: 0,
    expensesMtdCents: 0,
    depositsOutstandingCents: 0,
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-[#ff6b35]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M12 12h.01" />
            <path d="M17 12h.01" />
            <path d="M7 12h.01" />
          </svg>
          <span className="text-sm font-medium text-white">Financial Snapshot</span>
        </div>
        <a
          href="/finance"
          className="text-xs text-[#ff6b35] hover:underline"
        >
          View all
        </a>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Outstanding"
          value={formatCentsCompact(s.outstandingTotalCents)}
          icon={<ReceivableIcon />}
          color={s.outstandingTotalCents > 0 ? "text-[#f59e0b]" : "text-[rgba(255,255,255,0.5)]"}
          href="/finance/invoices?status=unpaid"
          loading={loading}
        />
        <StatCard
          label="Deposits Held"
          value={formatCentsCompact(s.depositsOutstandingCents)}
          icon={<DepositIcon />}
          color="text-[#3b82f6]"
          loading={loading}
        />
        <StatCard
          label="Collected MTD"
          value={formatCentsCompact(s.collectedMtdCents)}
          icon={<RevenueIcon />}
          color="text-[#22c55e]"
          href="/finance/payments"
          loading={loading}
        />
        <StatCard
          label="Expenses MTD"
          value={formatCentsCompact(s.expensesMtdCents)}
          icon={<ExpenseIcon />}
          color="text-[#ef4444]"
          href="/finance/expenses"
          loading={loading}
        />
      </div>
    </div>
  );
}
