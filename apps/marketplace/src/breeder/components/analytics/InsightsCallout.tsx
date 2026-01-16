// apps/marketplace/src/breeder/components/analytics/InsightsCallout.tsx
// Actionable insights callouts for the management dashboard

import * as React from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  MessageSquare,
  AlertCircle,
  Zap,
  Award,
  Eye,
  Flame,
  ChevronRight,
  X,
} from "lucide-react";
import type { InsightItem, PerformanceSummary, ProgramStats } from "./types";

interface InsightsCalloutProps {
  insights: InsightItem[];
  onDismiss?: (id: string) => void;
  maxItems?: number;
  className?: string;
}

/**
 * Displays actionable insights as callout cards.
 * Can be dismissed by users.
 */
export function InsightsCallout({
  insights,
  onDismiss,
  maxItems = 3,
  className = "",
}: InsightsCalloutProps) {
  const visibleInsights = insights.slice(0, maxItems);

  if (visibleInsights.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {visibleInsights.map((insight) => (
        <InsightCard key={insight.id} insight={insight} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

interface InsightCardProps {
  insight: InsightItem;
  onDismiss?: (id: string) => void;
}

function InsightCard({ insight, onDismiss }: InsightCardProps) {
  const styles = getInsightStyles(insight.type);

  return (
    <div className={`relative flex items-start gap-3 p-3 rounded-lg border ${styles.container}`}>
      <div className={`flex-shrink-0 p-1.5 rounded-md ${styles.iconBg}`}>
        {getInsightIcon(insight.type, insight.icon)}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm ${styles.text}`}>{insight.message}</p>
        {insight.actionLabel && insight.actionHref && (
          <Link
            to={insight.actionHref}
            className={`inline-flex items-center gap-1 mt-1.5 text-xs font-medium ${styles.action} hover:underline`}
          >
            {insight.actionLabel}
            <ChevronRight size={12} />
          </Link>
        )}
      </div>

      {onDismiss && (
        <button
          onClick={() => onDismiss(insight.id)}
          className="flex-shrink-0 p-1 text-text-tertiary hover:text-white transition-colors"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

function getInsightStyles(type: InsightItem["type"]) {
  switch (type) {
    case "success":
      return {
        container: "bg-green-500/10 border-green-500/30",
        iconBg: "bg-green-500/20",
        text: "text-green-300",
        action: "text-green-400",
      };
    case "warning":
      return {
        container: "bg-amber-500/10 border-amber-500/30",
        iconBg: "bg-amber-500/20",
        text: "text-amber-300",
        action: "text-amber-400",
      };
    case "trending":
      return {
        container: "bg-orange-500/10 border-orange-500/30",
        iconBg: "bg-orange-500/20",
        text: "text-orange-300",
        action: "text-orange-400",
      };
    case "info":
    default:
      return {
        container: "bg-blue-500/10 border-blue-500/30",
        iconBg: "bg-blue-500/20",
        text: "text-blue-300",
        action: "text-blue-400",
      };
  }
}

function getInsightIcon(type: InsightItem["type"], iconHint?: string) {
  // Support emoji icons
  if (iconHint && /\p{Emoji}/u.test(iconHint)) {
    return <span className="text-base">{iconHint}</span>;
  }

  const iconClass = "w-4 h-4";

  switch (type) {
    case "success":
      return <Award className={`${iconClass} text-green-400`} />;
    case "warning":
      return <AlertCircle className={`${iconClass} text-amber-400`} />;
    case "trending":
      return <Flame className={`${iconClass} text-orange-400`} />;
    case "info":
    default:
      return <Zap className={`${iconClass} text-blue-400`} />;
  }
}

/**
 * Generate insights from summary and program stats data.
 * This can be used client-side if the API doesn't provide pre-computed insights.
 */
export function generateInsights(
  summary: PerformanceSummary,
  programStats: ProgramStats[]
): InsightItem[] {
  const insights: InsightItem[] = [];

  // Unanswered inquiries warning
  if (summary.unansweredInquiries > 0) {
    insights.push({
      id: "unanswered-inquiries",
      type: "warning",
      icon: "inbox",
      message: `You have ${summary.unansweredInquiries} unanswered ${summary.unansweredInquiries === 1 ? "inquiry" : "inquiries"}`,
      actionLabel: "View inquiries",
      actionHref: "/manage/inquiries",
      priority: 1,
    });
  }

  // Trending programs
  const trendingPrograms = programStats.filter((p) => p.isTrending);
  if (trendingPrograms.length > 0) {
    const topTrending = trendingPrograms.sort((a, b) => (b.trendMultiplier || 1) - (a.trendMultiplier || 1))[0];
    const multiplierText = topTrending.trendMultiplier && topTrending.trendMultiplier > 1
      ? `${topTrending.trendMultiplier}x more views`
      : "significantly more views";

    insights.push({
      id: `trending-${topTrending.programId}`,
      type: "trending",
      icon: "fire",
      message: `Your ${topTrending.programName} program got ${multiplierText} than last week`,
      actionLabel: "View program",
      actionHref: `/manage/animal-programs/${topTrending.programId}`,
      priority: 2,
    });
  }

  // Low response rate warning
  if (summary.responseRate < 50 && summary.totalInquiriesThisMonth > 0) {
    insights.push({
      id: "low-response-rate",
      type: "warning",
      icon: "clock",
      message: `Your response rate is ${Math.round(summary.responseRate)}% - responding quickly can improve buyer trust`,
      priority: 3,
    });
  }

  // Growth celebration
  if (summary.viewsChangePercent > 50 && summary.totalViewsThisMonth > 10) {
    insights.push({
      id: "views-growth",
      type: "success",
      icon: "chart",
      message: `Great news! Your total views are up ${summary.viewsChangePercent}% compared to last month`,
      priority: 4,
    });
  }

  // Sort by priority
  insights.sort((a, b) => a.priority - b.priority);

  return insights;
}

/**
 * Single prominent insight banner (for top of page)
 */
interface InsightBannerProps {
  insight: InsightItem;
  onDismiss?: () => void;
  className?: string;
}

export function InsightBanner({ insight, onDismiss, className = "" }: InsightBannerProps) {
  const styles = getInsightStyles(insight.type);

  return (
    <div className={`flex items-center justify-between gap-4 p-4 rounded-lg border ${styles.container} ${className}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${styles.iconBg}`}>
          {getInsightIcon(insight.type, insight.icon)}
        </div>
        <div>
          <p className={`text-sm font-medium ${styles.text}`}>{insight.message}</p>
          {insight.actionLabel && insight.actionHref && (
            <Link
              to={insight.actionHref}
              className={`inline-flex items-center gap-1 mt-1 text-xs font-medium ${styles.action} hover:underline`}
            >
              {insight.actionLabel}
              <ChevronRight size={12} />
            </Link>
          )}
        </div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="p-1.5 text-text-tertiary hover:text-white transition-colors rounded hover:bg-white/10"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

export default InsightsCallout;
