// apps/platform/src/components/dashboard/OffspringGroupCards.tsx
// Horizontal scrollable cards showing active offspring groups

import * as React from "react";
import type { OffspringGroupSummary } from "../../features/useDashboardDataV2";

type Props = {
  groups: OffspringGroupSummary[];
  onViewGroup?: (id: number) => void;
  loading?: boolean;
};

// ─────────────────── Helpers ───────────────────

function formatCents(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1000) {
    return `$${(dollars / 1000).toFixed(1)}k`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(dollars);
}

function formatAge(birthedAt: string | null, ageWeeks: number | null): string {
  if (ageWeeks !== null) {
    if (ageWeeks < 1) return "< 1 week";
    if (ageWeeks === 1) return "1 week";
    return `${ageWeeks} weeks`;
  }
  if (birthedAt) {
    const born = new Date(birthedAt);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - born.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) return `${diffDays} days`;
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks !== 1 ? "s" : ""}`;
  }
  return "—";
}

const STATUS_CONFIG: Record<OffspringGroupSummary["status"], { label: string; color: string; bgColor: string }> = {
  in_care: { label: "In Care", color: "text-blue-400", bgColor: "bg-[#2563eb]" },
  placement_active: { label: "Placement", color: "text-green-400", bgColor: "bg-[#22c55e]" },
  nearly_complete: { label: "Nearly Done", color: "text-emerald-400", bgColor: "bg-[#10b981]" },
};

// ─────────────────── Icons ───────────────────

function HeartIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 22l7.8-8.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  );
}

// ─────────────────── Components ───────────────────

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="h-1.5 w-full bg-[#222222] rounded-full overflow-hidden">
      <div
        className="h-full bg-[#ff6b35] transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  );
}

function GroupCard({
  group,
  onClick,
}: {
  group: OffspringGroupSummary;
  onClick?: () => void;
}) {
  const statusConfig = STATUS_CONFIG[group.status];
  const placedRatio = `${group.counts.placed}/${group.counts.total}`;

  return (
    <div
      onClick={onClick}
      className={`
        rounded-xl border
        border-[rgba(60,60,60,0.5)]
        bg-[#1a1a1a]
        p-4 min-w-[240px] w-[280px]
        transition-all duration-200
        ${onClick ? "cursor-pointer hover:bg-[#222222] hover:border-[rgba(255,107,53,0.3)] hover:-translate-y-0.5 hover:shadow-lg" : ""}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <div className="text-sm font-medium text-white truncate">{group.identifier}</div>
          <div className="text-xs text-[rgba(255,255,255,0.5)] truncate">
            {group.damName}
            {group.sireName && ` × ${group.sireName}`}
          </div>
        </div>
        <span className={`${statusConfig.bgColor} text-white text-xs px-2 py-0.5 rounded flex-shrink-0`}>
          {statusConfig.label}
        </span>
      </div>

      {/* Age */}
      <div className="flex items-center gap-2 text-xs text-[rgba(255,255,255,0.5)] mb-3">
        <span className="text-[#ff6b35]">
          <HeartIcon />
        </span>
        <span>{formatAge(group.birthedAt, group.ageWeeks)} old</span>
      </div>

      {/* Placement progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-[rgba(255,255,255,0.5)]">Placed</span>
          <span className="text-white font-medium">{placedRatio}</span>
        </div>
        <ProgressBar progress={group.placementProgress} />
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <div>
            <span className="text-[rgba(255,255,255,0.5)]">Available: </span>
            <span className="text-white font-medium">{group.counts.available}</span>
          </div>
          {group.counts.reserved > 0 && (
            <div>
              <span className="text-[rgba(255,255,255,0.5)]">Reserved: </span>
              <span className="text-white font-medium">{group.counts.reserved}</span>
            </div>
          )}
        </div>
      </div>

      {/* Financial summary */}
      {group.financialSummary.totalInvoicedCents > 0 && (
        <div className="mt-3 pt-3 border-t border-[rgba(60,60,60,0.5)]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[rgba(255,255,255,0.5)]">Collected</span>
            <span className="text-white font-medium">
              {formatCents(group.financialSummary.totalPaidCents)} / {formatCents(group.financialSummary.totalInvoicedCents)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-[rgba(60,60,60,0.5)] bg-[#1a1a1a] p-4 min-w-[240px] w-[280px] animate-pulse">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1">
          <div className="h-4 bg-[#222222] rounded w-24 mb-2" />
          <div className="h-3 bg-[#222222] rounded w-32" />
        </div>
        <div className="h-5 bg-[#222222] rounded w-16" />
      </div>
      <div className="h-3 bg-[#222222] rounded w-20 mb-3" />
      <div className="h-1.5 bg-[#222222] rounded-full mb-3" />
      <div className="h-3 bg-[#222222] rounded w-28" />
    </div>
  );
}

function EmptyGroups() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-12 h-12 rounded-full bg-[#222222] flex items-center justify-center mb-3">
        <svg
          className="w-6 h-6 text-[#ff6b35]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 22l7.8-8.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
        </svg>
      </div>
      <div className="text-white font-medium text-sm">No offspring groups in care</div>
      <div className="text-[rgba(255,255,255,0.5)] text-xs mt-1">
        Active groups will appear here after birth is recorded
      </div>
    </div>
  );
}

// ─────────────────── Main Component ───────────────────

export default function OffspringGroupCards({ groups, onViewGroup, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[#ff6b35]">
            <HeartIcon />
          </span>
          <span className="text-sm font-medium text-white">Offspring in Care</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (groups.length === 0) {
    return <EmptyGroups />;
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[#ff6b35]">
            <HeartIcon />
          </span>
          <span className="text-sm font-medium text-white">Offspring in Care</span>
          <span className="text-xs text-[rgba(255,255,255,0.5)]">({groups.length})</span>
        </div>
        <a
          href="/offspring"
          className="text-xs text-[#ff6b35] hover:underline"
        >
          View all
        </a>
      </div>

      {/* Horizontal scrollable cards */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {groups.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            onClick={onViewGroup ? () => onViewGroup(group.id) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
