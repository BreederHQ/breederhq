// apps/marketplace/src/breeder/components/analytics/ProgramStatsOverlay.tsx
// Stats overlay component for program/listing cards

import * as React from "react";
import { Eye, MessageSquare, TrendingUp, Flame } from "lucide-react";
import type { ProgramStats, ListingStats } from "./types";
import { MiniSparkline } from "./MiniSparkline";

type Stats = ProgramStats | ListingStats;

interface ProgramStatsOverlayProps {
  stats: Stats;
  compact?: boolean;
  showSparkline?: boolean;
  className?: string;
}

/**
 * Stats overlay to be placed on program/listing cards.
 * Shows views, inquiries, and trending badge.
 */
export function ProgramStatsOverlay({
  stats,
  compact = false,
  showSparkline = false,
  className = "",
}: ProgramStatsOverlayProps) {
  if (compact) {
    return (
      <div className={`flex items-center gap-3 text-xs ${className}`}>
        <span className="flex items-center gap-1 text-text-secondary">
          <Eye size={12} className="text-text-tertiary" />
          {formatNumber(stats.viewsThisMonth)}
        </span>
        <span className="flex items-center gap-1 text-text-secondary">
          <MessageSquare size={12} className="text-text-tertiary" />
          {stats.inquiriesThisMonth}
        </span>
        {stats.isTrending && (
          <span className="flex items-center gap-0.5 text-orange-400">
            <Flame size={12} />
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {/* Views row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Eye size={14} className="text-blue-400" />
          <span className="text-sm text-text-secondary">
            {formatNumber(stats.viewsThisMonth)} views this month
          </span>
        </div>
        {showSparkline && stats.viewsTrend7d?.length > 1 && (
          <MiniSparkline data={stats.viewsTrend7d} width={60} height={18} />
        )}
      </div>

      {/* Inquiries row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <MessageSquare size={14} className="text-purple-400" />
          <span className="text-sm text-text-secondary">
            {stats.inquiriesThisMonth} inquiries
          </span>
        </div>
      </div>

      {/* Trending badge */}
      {stats.isTrending && (
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
            <Flame size={12} />
            Trending
            {stats.trendMultiplier && stats.trendMultiplier > 1 && (
              <span className="ml-0.5">{stats.trendMultiplier}x</span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Inline stats for card footer - more compact version
 */
interface InlineCardStatsProps {
  viewsThisMonth: number;
  inquiriesThisMonth: number;
  isTrending?: boolean;
  trendMultiplier?: number;
}

export function InlineCardStats({
  viewsThisMonth,
  inquiriesThisMonth,
  isTrending,
  trendMultiplier,
}: InlineCardStatsProps) {
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="inline-flex items-center gap-1 text-text-secondary" title="Views this month">
        <Eye size={12} className="text-blue-400/70" />
        {formatNumber(viewsThisMonth)}
      </span>
      <span className="inline-flex items-center gap-1 text-text-secondary" title="Inquiries this month">
        <MessageSquare size={12} className="text-purple-400/70" />
        {inquiriesThisMonth}
      </span>
      {isTrending && (
        <span
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30"
          title={trendMultiplier ? `${trendMultiplier}x more views than last week` : "Trending"}
        >
          <Flame size={10} />
          {trendMultiplier && trendMultiplier > 1 ? `${trendMultiplier}x` : "Hot"}
        </span>
      )}
    </div>
  );
}

/**
 * Stats badge to overlay on card image
 */
interface StatsBadgeOverlayProps {
  viewsThisMonth: number;
  isTrending?: boolean;
}

export function StatsBadgeOverlay({ viewsThisMonth, isTrending }: StatsBadgeOverlayProps) {
  return (
    <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded bg-black/60 text-white backdrop-blur-sm">
        <Eye size={10} />
        {formatNumber(viewsThisMonth)}
      </span>
      {isTrending && (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-orange-500/80 text-white">
          <Flame size={10} />
        </span>
      )}
    </div>
  );
}

// Helper to format numbers nicely
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return String(num);
}

export default ProgramStatsOverlay;
