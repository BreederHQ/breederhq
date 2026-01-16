// apps/marketplace/src/breeder/components/analytics/types.ts
// Types for program analytics and performance metrics

/**
 * Daily data point for sparkline charts
 */
export interface DailyDataPoint {
  date: string; // ISO date string (YYYY-MM-DD)
  value: number;
}

/**
 * Stats for an individual program or listing
 */
export interface ProgramStats {
  programId: number;
  programName: string;
  templateType: string;

  // Current period metrics
  viewsThisMonth: number;
  viewsLastMonth: number;
  viewsThisWeek: number;
  viewsLastWeek: number;
  inquiriesThisMonth: number;
  inquiriesLastMonth: number;
  inquiriesThisWeek: number;
  inquiriesLastWeek: number;

  // All-time totals
  totalViews: number;
  totalInquiries: number;

  // Trend data for sparklines (last 7 or 30 days)
  viewsTrend7d: DailyDataPoint[];
  viewsTrend30d: DailyDataPoint[];
  inquiriesTrend7d: DailyDataPoint[];

  // Computed flags
  isTrending: boolean; // Views spiked significantly
  trendMultiplier?: number; // e.g., 3 for "3x more views"
}

/**
 * Stats for an individual animal listing
 */
export interface ListingStats {
  listingId: number;
  animalName: string;
  templateType: string;

  viewsThisMonth: number;
  viewsLastMonth: number;
  viewsThisWeek: number;
  viewsLastWeek: number;
  inquiriesThisMonth: number;
  inquiriesLastMonth: number;

  totalViews: number;
  totalInquiries: number;

  viewsTrend7d: DailyDataPoint[];
  viewsTrend30d: DailyDataPoint[];

  isTrending: boolean;
  trendMultiplier?: number;
}

/**
 * Aggregate summary stats across all programs/listings
 */
export interface PerformanceSummary {
  // Views
  totalViewsThisMonth: number;
  totalViewsLastMonth: number;
  totalViewsThisWeek: number;
  totalViewsLastWeek: number;
  viewsChangePercent: number; // vs last month

  // Inquiries
  totalInquiriesThisMonth: number;
  totalInquiriesLastMonth: number;
  totalInquiriesThisWeek: number;
  totalInquiriesLastWeek: number;
  inquiriesChangePercent: number;

  // Response metrics
  unansweredInquiries: number;
  responseRate: number; // 0-100 percentage
  avgResponseTimeHours: number | null;

  // Aggregate trend data
  viewsTrend7d: DailyDataPoint[];
  viewsTrend30d: DailyDataPoint[];

  // Top performer
  topProgramId?: number;
  topProgramName?: string;
  topProgramViews?: number;
}

/**
 * Insight callout for actionable items
 */
export interface InsightItem {
  id: string;
  type: "success" | "warning" | "info" | "trending";
  icon: string; // emoji or icon name
  message: string;
  actionLabel?: string;
  actionHref?: string;
  priority: number; // lower = higher priority
}

/**
 * API response for program analytics
 */
export interface ProgramAnalyticsResponse {
  summary: PerformanceSummary;
  programStats: ProgramStats[];
  insights: InsightItem[];
  generatedAt: string;
}

/**
 * API response for listing analytics
 */
export interface ListingAnalyticsResponse {
  summary: PerformanceSummary;
  listingStats: ListingStats[];
  insights: InsightItem[];
  generatedAt: string;
}
