// apps/breeding/src/components/FoalingAnalytics.tsx
// Analytics dashboard showing foaling trends, success rates, and seasonal patterns

import * as React from "react";
import {
  Baby,
  TrendingUp,
  TrendingDown,
  Calendar,
  Activity,
  AlertTriangle,
  Award,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface FoalingAnalyticsData {
  summary: {
    totalFoalings: number;
    foalingsThisYear: number;
    foalingsLastYear: number;
    yoyChange: number | null;
    totalLiveFoals: number;
    totalFoalsThisYear: number;
    coltsThisYear: number;
    filliesThisYear: number;
    successRate: number;
    complicationRate: number;
  };
  gestation: {
    avgDays: number | null;
    minDays: number | null;
    maxDays: number | null;
    sampleSize: number;
  };
  complications: {
    total: number;
    thisYear: number;
    vetCalls: number;
    vetCallsThisYear: number;
  };
  seasonality: {
    year: number;
    monthlyDistribution: Array<{
      month: number;
      monthName: string;
      count: number;
    }>;
  };
  topProducers: {
    mares: Array<{ id: number; name: string; foalings: number; liveFoals: number }>;
    sires: Array<{ id: number; name: string; foalings: number; liveFoals: number }>;
  };
}

export interface FoalingAnalyticsProps {
  /** API endpoint or data */
  data?: FoalingAnalyticsData | null;
  /** Loading state */
  loading?: boolean;
  /** Initial year to display */
  initialYear?: number;
  /** Callback when year changes */
  onYearChange?: (year: number) => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STAT CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function StatCard({
  label,
  value,
  subValue,
  icon: Icon,
  trend,
  trendValue,
  color = "text-white",
  bgColor = "bg-white/5",
}: {
  label: string;
  value: string | number;
  subValue?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "flat";
  trendValue?: string;
  color?: string;
  bgColor?: string;
}) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : null;
  const trendColor = trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-secondary";

  return (
    <div className={`${bgColor} border border-hairline rounded-xl p-4`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        {trend && TrendIcon && trendValue && (
          <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
            <TrendIcon className="w-3 h-3" />
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-secondary mt-1">{label}</div>
      {subValue && <div className="text-xs text-secondary/70 mt-0.5">{subValue}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEASONALITY CHART
// ═══════════════════════════════════════════════════════════════════════════════

function SeasonalityChart({
  data,
}: {
  data: Array<{ month: number; monthName: string; count: number }>;
}) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="flex items-end justify-between gap-1 h-32">
      {data.map((month) => {
        const height = maxCount > 0 ? (month.count / maxCount) * 100 : 0;
        return (
          <div key={month.month} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full bg-gradient-to-t from-orange-500/80 to-orange-400/60 rounded-t transition-all duration-300"
              style={{ height: `${Math.max(height, 4)}%` }}
              title={`${month.monthName}: ${month.count} foalings`}
            />
            <span className="text-[10px] text-secondary">{month.monthName}</span>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOP PRODUCERS LIST
// ═══════════════════════════════════════════════════════════════════════════════

function TopProducersList({
  title,
  producers,
  icon: Icon,
}: {
  title: string;
  producers: Array<{ id: number; name: string; foalings: number; liveFoals: number }>;
  icon: React.ElementType;
}) {
  if (producers.length === 0) {
    return (
      <div className="text-center py-4 text-secondary text-sm">
        No data available
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-white mb-3">
        <Icon className="w-4 h-4 text-orange-400" />
        {title}
      </div>
      {producers.map((producer, index) => (
        <div
          key={producer.id}
          className="flex items-center justify-between py-2 px-3 bg-white/5 rounded-lg"
        >
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-secondary w-5">#{index + 1}</span>
            <span className="text-sm text-white">{producer.name}</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-secondary">
              {producer.foalings} foaling{producer.foalings !== 1 ? "s" : ""}
            </span>
            <span className="text-emerald-400 font-medium">
              {producer.liveFoals} live
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function FoalingAnalytics({
  data,
  loading = false,
  initialYear,
  onYearChange,
}: FoalingAnalyticsProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = React.useState(initialYear ?? currentYear);

  const handleYearChange = (delta: number) => {
    const newYear = selectedYear + delta;
    setSelectedYear(newYear);
    onYearChange?.(newYear);
  };

  if (loading) {
    return (
      <div className="bg-portal-card border border-hairline rounded-xl p-6">
        <div className="h-6 w-48 bg-white/5 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-40 bg-white/5 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-portal-card border border-hairline rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="w-5 h-5 text-orange-400" />
          <h3 className="text-lg font-semibold text-white">Foaling Analytics</h3>
        </div>
        <div className="text-center py-8">
          <Baby className="w-12 h-12 mx-auto text-secondary/30 mb-3" />
          <p className="text-secondary">No foaling data available yet</p>
          <p className="text-xs text-secondary/70 mt-1">
            Analytics will appear after foalings are recorded
          </p>
        </div>
      </div>
    );
  }

  const { summary, gestation, complications, seasonality, topProducers } = data;

  return (
    <div className="bg-portal-card border border-hairline rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-hairline flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-500/15">
            <Activity className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Foaling Analytics</h3>
            <p className="text-xs text-secondary">
              {summary.totalFoalings} total foalings recorded
            </p>
          </div>
        </div>
        {/* Year Selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleYearChange(-1)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-secondary" />
          </button>
          <span className="text-sm font-medium text-white min-w-[4rem] text-center">
            {selectedYear}
          </span>
          <button
            onClick={() => handleYearChange(1)}
            disabled={selectedYear >= currentYear}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4 text-secondary" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label={`Foalings in ${selectedYear}`}
            value={summary.foalingsThisYear}
            subValue={`${summary.coltsThisYear} colts, ${summary.filliesThisYear} fillies`}
            icon={Baby}
            trend={summary.yoyChange !== null ? (summary.yoyChange > 0 ? "up" : summary.yoyChange < 0 ? "down" : "flat") : undefined}
            trendValue={summary.yoyChange !== null ? `${summary.yoyChange > 0 ? "+" : ""}${summary.yoyChange}% vs last year` : undefined}
            color="text-orange-400"
            bgColor="bg-orange-500/10"
          />
          <StatCard
            label="Success Rate"
            value={`${summary.successRate}%`}
            subValue={`${summary.totalLiveFoals} live foals total`}
            icon={Award}
            color="text-emerald-400"
            bgColor="bg-emerald-500/10"
          />
          <StatCard
            label="Avg Gestation"
            value={gestation.avgDays !== null ? `${gestation.avgDays}d` : "—"}
            subValue={gestation.minDays && gestation.maxDays ? `Range: ${gestation.minDays}-${gestation.maxDays} days` : undefined}
            icon={Clock}
            color="text-blue-400"
            bgColor="bg-blue-500/10"
          />
          <StatCard
            label="Complication Rate"
            value={`${summary.complicationRate}%`}
            subValue={`${complications.vetCallsThisYear} vet calls this year`}
            icon={AlertTriangle}
            color={summary.complicationRate > 20 ? "text-red-400" : "text-amber-400"}
            bgColor={summary.complicationRate > 20 ? "bg-red-500/10" : "bg-amber-500/10"}
          />
        </div>

        {/* Seasonality Chart */}
        <div className="bg-white/5 border border-hairline rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-white mb-4">
            <Calendar className="w-4 h-4 text-orange-400" />
            Foaling Season ({selectedYear})
          </div>
          <SeasonalityChart data={seasonality.monthlyDistribution} />
        </div>

        {/* Top Producers */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/5 border border-hairline rounded-xl p-4">
            <TopProducersList
              title="Top Producing Mares"
              producers={topProducers.mares}
              icon={Baby}
            />
          </div>
          <div className="bg-white/5 border border-hairline rounded-xl p-4">
            <TopProducersList
              title="Top Producing Sires"
              producers={topProducers.sires}
              icon={Award}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default FoalingAnalytics;
