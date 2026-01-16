// apps/marketplace/src/breeder/components/analytics/PerformanceSummaryRow.tsx
// Summary row showing aggregate performance metrics across all programs

import * as React from "react";
import { Eye, MessageSquare, Clock, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { PerformanceSummary, DailyDataPoint } from "./types";
import { MiniSparkline, SparklineWithChange } from "./MiniSparkline";

interface PerformanceSummaryRowProps {
  summary: PerformanceSummary;
  period?: "week" | "month";
  showSparklines?: boolean;
  className?: string;
}

/**
 * Summary row component displaying aggregate performance metrics.
 * Designed to sit at the top of the management pages.
 */
export function PerformanceSummaryRow({
  summary,
  period = "month",
  showSparklines = true,
  className = "",
}: PerformanceSummaryRowProps) {
  const viewsValue = period === "week" ? summary.totalViewsThisWeek : summary.totalViewsThisMonth;
  const viewsPrevious = period === "week" ? summary.totalViewsLastWeek : summary.totalViewsLastMonth;
  const viewsChange = viewsPrevious > 0 ? Math.round(((viewsValue - viewsPrevious) / viewsPrevious) * 100) : 0;

  const inquiriesValue = period === "week" ? summary.totalInquiriesThisWeek : summary.totalInquiriesThisMonth;
  const inquiriesPrevious = period === "week" ? summary.totalInquiriesLastWeek : summary.totalInquiriesLastMonth;
  const inquiriesChange = inquiriesPrevious > 0 ? Math.round(((inquiriesValue - inquiriesPrevious) / inquiriesPrevious) * 100) : 0;

  return (
    <div className={`bg-portal-card border border-border-subtle rounded-lg overflow-hidden ${className}`}>
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-border-subtle">
        {/* Total Views */}
        <SummaryMetric
          icon={<Eye size={18} className="text-blue-400" />}
          label={`Views this ${period}`}
          value={formatNumber(viewsValue)}
          change={viewsChange}
          sparklineData={showSparklines ? summary.viewsTrend7d : undefined}
        />

        {/* Total Inquiries */}
        <SummaryMetric
          icon={<MessageSquare size={18} className="text-purple-400" />}
          label={`Inquiries this ${period}`}
          value={String(inquiriesValue)}
          change={inquiriesChange}
          highlight={summary.unansweredInquiries > 0}
          highlightText={summary.unansweredInquiries > 0 ? `${summary.unansweredInquiries} unanswered` : undefined}
        />

        {/* Response Rate */}
        <SummaryMetric
          icon={<Clock size={18} className="text-teal-400" />}
          label="Response rate"
          value={`${Math.round(summary.responseRate)}%`}
          subValue={summary.avgResponseTimeHours != null ? formatResponseTime(summary.avgResponseTimeHours) : undefined}
        />

        {/* Top Performer */}
        {summary.topProgramName ? (
          <div className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={18} className="text-green-400" />
              <span className="text-xs text-text-tertiary uppercase tracking-wide">Top performer</span>
            </div>
            <p className="text-sm font-semibold text-white truncate" title={summary.topProgramName}>
              {summary.topProgramName}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">
              {formatNumber(summary.topProgramViews || 0)} views
            </p>
          </div>
        ) : (
          <SummaryMetric
            icon={<TrendingUp size={18} className="text-green-400" />}
            label="Programs active"
            value="--"
            subValue="No data yet"
          />
        )}
      </div>
    </div>
  );
}

interface SummaryMetricProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  change?: number;
  subValue?: string;
  highlight?: boolean;
  highlightText?: string;
  sparklineData?: DailyDataPoint[];
}

function SummaryMetric({
  icon,
  label,
  value,
  change,
  subValue,
  highlight,
  highlightText,
  sparklineData,
}: SummaryMetricProps) {
  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-text-tertiary uppercase tracking-wide">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-xl font-bold text-white">{value}</p>
        {change !== undefined && change !== 0 && (
          <ChangeIndicator change={change} />
        )}
      </div>
      {highlight && highlightText && (
        <p className="text-xs text-amber-400 mt-1">{highlightText}</p>
      )}
      {subValue && !highlightText && (
        <p className="text-xs text-text-secondary mt-0.5">{subValue}</p>
      )}
      {sparklineData && sparklineData.length > 1 && (
        <div className="mt-2">
          <MiniSparkline data={sparklineData} width={100} height={24} />
        </div>
      )}
    </div>
  );
}

function ChangeIndicator({ change }: { change: number }) {
  const isPositive = change > 0;
  const isNegative = change < 0;

  if (change === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-text-tertiary">
        <Minus size={12} />
        0%
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
        isPositive ? "text-green-400" : "text-red-400"
      }`}
    >
      {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {isPositive ? "+" : ""}
      {change}%
    </span>
  );
}

/**
 * Compact version for mobile or smaller spaces
 */
interface CompactSummaryProps {
  summary: PerformanceSummary;
  className?: string;
}

export function CompactPerformanceSummary({ summary, className = "" }: CompactSummaryProps) {
  return (
    <div className={`flex items-center gap-4 text-sm ${className}`}>
      <div className="flex items-center gap-1.5">
        <Eye size={14} className="text-blue-400" />
        <span className="text-white font-medium">{formatNumber(summary.totalViewsThisMonth)}</span>
        <span className="text-text-tertiary">views</span>
      </div>
      <div className="flex items-center gap-1.5">
        <MessageSquare size={14} className="text-purple-400" />
        <span className="text-white font-medium">{summary.totalInquiriesThisMonth}</span>
        <span className="text-text-tertiary">inquiries</span>
      </div>
      {summary.unansweredInquiries > 0 && (
        <span className="text-amber-400 text-xs">
          ({summary.unansweredInquiries} pending)
        </span>
      )}
    </div>
  );
}

// Helpers
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return String(num);
}

function formatResponseTime(hours: number): string {
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `Avg. ${minutes}m response`;
  }
  if (hours < 24) {
    return `Avg. ${Math.round(hours)}h response`;
  }
  const days = Math.round(hours / 24);
  return `Avg. ${days}d response`;
}

export default PerformanceSummaryRow;
