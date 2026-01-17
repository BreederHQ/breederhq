// apps/marketplace/src/breeder/components/FoalingDashboardWidget.tsx
// Dashboard widget showing foaling status overview for the breeder portal
// Shows: overdue foalings, imminent (within 14 days), and recent births

import * as React from "react";
import {
  Baby,
  AlertTriangle,
  Clock,
  Calendar,
  ChevronRight,
  Activity,
} from "lucide-react";
import { Button } from "@bhq/ui";

import { calculateFoalingStatus, type FoalingStatus } from "../../../../breeding/src/components/FoalingCountdownBadge";

// Types for breeding plan items (simplified for this widget)
export interface FoalingPlanItem {
  id: number;
  name: string;
  damName?: string | null;
  sireName?: string | null;
  expectedBirthDate: string | null;
  birthDateActual: string | null;
  breedDateActual?: string | null;
  species: string;
}

export interface FoalingDashboardWidgetProps {
  /** All breeding plans (will be filtered for HORSE species) */
  plans: FoalingPlanItem[];
  /** Whether data is loading */
  loading?: boolean;
  /** Callback when "Record Foaling" is clicked */
  onRecordFoaling?: (plan: FoalingPlanItem) => void;
  /** Link to the foaling calendar page */
  calendarLink?: string;
}

interface CategorizedPlan {
  plan: FoalingPlanItem;
  status: FoalingStatus;
  daysUntil: number | null;
}

function categorizePlans(plans: FoalingPlanItem[]): {
  overdue: CategorizedPlan[];
  imminent: CategorizedPlan[];
  recentBirths: CategorizedPlan[];
} {
  const overdue: CategorizedPlan[] = [];
  const imminent: CategorizedPlan[] = [];
  const recentBirths: CategorizedPlan[] = [];

  // Only consider HORSE species
  const horsePlans = plans.filter(
    (p) => p.species?.toUpperCase() === "HORSE" && p.expectedBirthDate
  );

  for (const plan of horsePlans) {
    const { status, daysUntil } = calculateFoalingStatus(
      plan.expectedBirthDate,
      plan.birthDateActual,
      plan.breedDateActual
    );

    const categorized = { plan, status, daysUntil };

    if (status === "OVERDUE" || status === "DUE_TODAY") {
      overdue.push(categorized);
    } else if (status === "IMMINENT") {
      imminent.push(categorized);
    } else if (status === "FOALED") {
      // Check if birth was within last 30 days
      if (plan.birthDateActual) {
        const birthDate = new Date(plan.birthDateActual);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        if (birthDate >= thirtyDaysAgo) {
          recentBirths.push(categorized);
        }
      }
    }
  }

  // Sort by urgency
  overdue.sort((a, b) => (a.daysUntil ?? 0) - (b.daysUntil ?? 0)); // Most overdue first
  imminent.sort((a, b) => (a.daysUntil ?? 999) - (b.daysUntil ?? 999)); // Soonest first
  recentBirths.sort((a, b) => {
    const aDate = new Date(a.plan.birthDateActual!).getTime();
    const bDate = new Date(b.plan.birthDateActual!).getTime();
    return bDate - aDate; // Most recent first
  });

  return { overdue, imminent, recentBirths };
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function PlanRow({
  item,
  onRecordFoaling,
}: {
  item: CategorizedPlan;
  onRecordFoaling?: (plan: FoalingPlanItem) => void;
}) {
  const { plan, status, daysUntil } = item;

  const statusStyles = {
    OVERDUE: "text-red-400 bg-red-500/10",
    DUE_TODAY: "text-red-400 bg-red-500/10",
    IMMINENT: "text-orange-400 bg-orange-500/10",
    FOALED: "text-emerald-400 bg-emerald-500/10",
  } as const;

  const style = statusStyles[status as keyof typeof statusStyles] || "text-secondary";

  let statusText: string;
  if (status === "DUE_TODAY") {
    statusText = "Due Today";
  } else if (status === "OVERDUE") {
    statusText = `${Math.abs(daysUntil || 0)}d overdue`;
  } else if (status === "IMMINENT") {
    statusText = `${daysUntil}d`;
  } else if (status === "FOALED") {
    statusText = formatDate(plan.birthDateActual);
  } else {
    statusText = "";
  }

  const showRecordButton =
    (status === "OVERDUE" || status === "DUE_TODAY" || status === "IMMINENT") &&
    !plan.birthDateActual &&
    plan.breedDateActual;

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">
          {plan.damName || plan.name}
          {plan.sireName && (
            <span className="text-secondary font-normal"> × {plan.sireName}</span>
          )}
        </div>
        <div className="text-xs text-secondary">
          Expected {formatDate(plan.expectedBirthDate)}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded ${style}`}
        >
          {statusText}
        </span>
        {showRecordButton && onRecordFoaling && (
          <button
            onClick={() => onRecordFoaling(plan)}
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            <Baby className="w-3 h-3" />
            Record
          </button>
        )}
      </div>
    </div>
  );
}

export function FoalingDashboardWidget({
  plans,
  loading = false,
  onRecordFoaling,
  calendarLink = "/manage/breeding-programs",
}: FoalingDashboardWidgetProps) {
  const { overdue, imminent, recentBirths } = React.useMemo(
    () => categorizePlans(plans),
    [plans]
  );

  const totalUrgent = overdue.length + imminent.length;
  const hasAnyData = overdue.length > 0 || imminent.length > 0 || recentBirths.length > 0;

  // Don't show widget if no horse foaling data
  const hasHorsePlans = plans.some((p) => p.species?.toUpperCase() === "HORSE");
  if (!hasHorsePlans) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-portal-card border border-hairline rounded-xl p-5">
        <div className="h-6 w-32 bg-white/5 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          <div className="h-12 bg-white/5 rounded animate-pulse" />
          <div className="h-12 bg-white/5 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-portal-card border border-hairline rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-hairline flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${totalUrgent > 0 ? "bg-orange-500/15" : "bg-emerald-500/15"}`}>
            <Baby className={`w-5 h-5 ${totalUrgent > 0 ? "text-orange-400" : "text-emerald-400"}`} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Foaling Dashboard</h3>
            <p className="text-xs text-secondary">
              {totalUrgent > 0
                ? `${totalUrgent} requiring attention`
                : "All foalings on track"}
            </p>
          </div>
        </div>
        <a
          href={calendarLink}
          className="text-xs text-accent hover:text-accent-hover flex items-center gap-1"
        >
          View All
          <ChevronRight className="w-3 h-3" />
        </a>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Overdue Section */}
        {overdue.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-xs font-semibold text-red-400 uppercase tracking-wide">
                Overdue ({overdue.length})
              </span>
            </div>
            <div className="bg-red-500/5 border border-red-500/20 rounded-lg">
              {overdue.slice(0, 3).map((item) => (
                <PlanRow
                  key={item.plan.id}
                  item={item}
                  onRecordFoaling={onRecordFoaling}
                />
              ))}
              {overdue.length > 3 && (
                <div className="px-3 py-2 text-xs text-red-300 border-t border-red-500/20">
                  +{overdue.length - 3} more overdue
                </div>
              )}
            </div>
          </div>
        )}

        {/* Imminent Section */}
        {imminent.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-semibold text-orange-400 uppercase tracking-wide">
                Imminent - Within 14 Days ({imminent.length})
              </span>
            </div>
            <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg">
              {imminent.slice(0, 3).map((item) => (
                <PlanRow
                  key={item.plan.id}
                  item={item}
                  onRecordFoaling={onRecordFoaling}
                />
              ))}
              {imminent.length > 3 && (
                <div className="px-3 py-2 text-xs text-orange-300 border-t border-orange-500/20">
                  +{imminent.length - 3} more imminent
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Births Section */}
        {recentBirths.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                Recent Births - Last 30 Days ({recentBirths.length})
              </span>
            </div>
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
              {recentBirths.slice(0, 3).map((item) => (
                <PlanRow key={item.plan.id} item={item} />
              ))}
              {recentBirths.length > 3 && (
                <div className="px-3 py-2 text-xs text-emerald-300 border-t border-emerald-500/20">
                  +{recentBirths.length - 3} more births
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!hasAnyData && (
          <div className="text-center py-6">
            <Activity className="w-8 h-8 mx-auto text-secondary/50 mb-2" />
            <p className="text-sm text-secondary">No upcoming foalings</p>
            <p className="text-xs text-secondary/70 mt-1">
              Foaling alerts will appear here when mares are expecting
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default FoalingDashboardWidget;
