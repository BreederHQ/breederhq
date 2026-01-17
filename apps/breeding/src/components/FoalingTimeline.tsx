// apps/breeding/src/components/FoalingTimeline.tsx
// Visual timeline component showing pregnancy progress from breeding to birth
// Shows: Breeding → Milestones → Expected Birth → Actual Birth
// With progress bar visualization and milestone markers

import * as React from "react";
import {
  Heart,
  Calendar,
  Baby,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Clock,
  Milestone as MilestoneIcon,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type FoalingMilestoneType =
  | "VET_PREGNANCY_CHECK_15D"
  | "VET_ULTRASOUND_45D"
  | "VET_ULTRASOUND_90D"
  | "BEGIN_MONITORING_300D"
  | "PREPARE_FOALING_AREA_320D"
  | "DAILY_CHECKS_330D"
  | "DUE_DATE_340D"
  | "OVERDUE_VET_CALL_350D";

export interface FoalingMilestone {
  id: number;
  type: FoalingMilestoneType;
  scheduledDate: string;
  completedDate: string | null;
  isCompleted: boolean;
  notes?: string | null;
}

export interface FoalingTimelineProps {
  /** Actual breeding date (when the mare was bred) */
  breedDateActual: string | null;
  /** Expected birth/foaling date */
  expectedBirthDate: string | null;
  /** Actual birth date if foaled */
  birthDateActual: string | null;
  /** Foaling milestones array */
  milestones?: FoalingMilestone[];
  /** Compact mode for smaller displays */
  compact?: boolean;
  /** Show milestone details */
  showMilestones?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

const AVERAGE_GESTATION_DAYS = 340; // Horse gestation ~11 months

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function daysBetween(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = endDate.getTime() - startDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function calculateProgress(
  breedDateActual: string | null,
  expectedBirthDate: string | null,
  birthDateActual: string | null
): number {
  // If foaled, return 100%
  if (birthDateActual) return 100;

  // If no breed date, return 0%
  if (!breedDateActual) return 0;

  // Calculate progress based on days since breeding
  const today = new Date();
  const breedDate = new Date(breedDateActual);
  const daysSinceBreeding = Math.floor(
    (today.getTime() - breedDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Use expected birth date if available, otherwise use average gestation
  let totalDays = AVERAGE_GESTATION_DAYS;
  if (expectedBirthDate) {
    const expected = new Date(expectedBirthDate);
    totalDays = Math.ceil(
      (expected.getTime() - breedDate.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  // Cap at 100% (can be overdue)
  const progress = Math.min(100, Math.max(0, (daysSinceBreeding / totalDays) * 100));
  return progress;
}

function getProgressColor(progress: number, isOverdue: boolean): string {
  if (isOverdue) return "bg-red-500";
  if (progress >= 95) return "bg-orange-500";
  if (progress >= 85) return "bg-amber-500";
  return "bg-emerald-500";
}

const MILESTONE_LABELS: Record<FoalingMilestoneType, string> = {
  VET_PREGNANCY_CHECK_15D: "Pregnancy Check (15d)",
  VET_ULTRASOUND_45D: "Ultrasound (45d)",
  VET_ULTRASOUND_90D: "Ultrasound (90d)",
  BEGIN_MONITORING_300D: "Begin Monitoring (300d)",
  PREPARE_FOALING_AREA_320D: "Prepare Foaling Area (320d)",
  DAILY_CHECKS_330D: "Daily Checks (330d)",
  DUE_DATE_340D: "Due Date (340d)",
  OVERDUE_VET_CALL_350D: "Overdue Vet Call (350d)",
};

const MILESTONE_DAYS: Record<FoalingMilestoneType, number> = {
  VET_PREGNANCY_CHECK_15D: 15,
  VET_ULTRASOUND_45D: 45,
  VET_ULTRASOUND_90D: 90,
  BEGIN_MONITORING_300D: 300,
  PREPARE_FOALING_AREA_320D: 320,
  DAILY_CHECKS_330D: 330,
  DUE_DATE_340D: 340,
  OVERDUE_VET_CALL_350D: 350,
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function FoalingTimeline({
  breedDateActual,
  expectedBirthDate,
  birthDateActual,
  milestones = [],
  compact = false,
  showMilestones = true,
}: FoalingTimelineProps) {
  const progress = calculateProgress(
    breedDateActual,
    expectedBirthDate,
    birthDateActual
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isOverdue = React.useMemo(() => {
    if (birthDateActual) return false;
    if (!expectedBirthDate) return false;
    const expected = new Date(expectedBirthDate);
    expected.setHours(0, 0, 0, 0);
    return today > expected;
  }, [expectedBirthDate, birthDateActual, today]);

  const daysOverdue = React.useMemo(() => {
    if (!isOverdue || !expectedBirthDate) return 0;
    const expected = new Date(expectedBirthDate);
    return Math.floor((today.getTime() - expected.getTime()) / (1000 * 60 * 60 * 24));
  }, [isOverdue, expectedBirthDate, today]);

  const gestationDays = daysBetween(breedDateActual, birthDateActual || null);
  const daysUntilExpected = daysBetween(
    today.toISOString(),
    expectedBirthDate
  );

  // Calculate milestone completion
  const completedMilestones = milestones.filter((m) => m.isCompleted).length;
  const totalMilestones = milestones.length;

  // No data state
  if (!breedDateActual && !expectedBirthDate) {
    return (
      <div className={`${compact ? "p-3" : "p-4"} bg-white/5 rounded-lg border border-hairline`}>
        <div className="flex items-center gap-3 text-secondary">
          <Clock className="w-5 h-5" />
          <span className="text-sm">
            No breeding date recorded yet. Timeline will appear once the mare is bred.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${compact ? "space-y-3" : "space-y-4"}`}>
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {birthDateActual ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="font-medium text-emerald-400">Foaled</span>
            </>
          ) : isOverdue ? (
            <>
              <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
              <span className="font-medium text-red-400">
                {daysOverdue} day{daysOverdue !== 1 ? "s" : ""} overdue
              </span>
            </>
          ) : (
            <>
              <Clock className="w-5 h-5 text-amber-400" />
              <span className="font-medium text-white">
                {daysUntilExpected !== null && daysUntilExpected >= 0
                  ? `${daysUntilExpected} day${daysUntilExpected !== 1 ? "s" : ""} until expected`
                  : "Expecting"}
              </span>
            </>
          )}
        </div>
        {gestationDays !== null && birthDateActual && (
          <span className="text-xs text-secondary">
            {gestationDays} day gestation
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="relative">
        {/* Background track */}
        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
          {/* Progress fill */}
          <div
            className={`h-full rounded-full transition-all duration-500 ${getProgressColor(progress, isOverdue)}`}
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>

        {/* Milestone markers on the bar (if we have milestones) */}
        {showMilestones && milestones.length > 0 && !compact && (
          <div className="absolute inset-0 flex items-center">
            {milestones.map((milestone) => {
              const milestoneDay = MILESTONE_DAYS[milestone.type];
              const position = (milestoneDay / AVERAGE_GESTATION_DAYS) * 100;

              if (position > 100) return null;

              return (
                <div
                  key={milestone.id}
                  className="absolute -translate-x-1/2"
                  style={{ left: `${position}%` }}
                  title={MILESTONE_LABELS[milestone.type]}
                >
                  <div
                    className={`w-2 h-2 rounded-full border-2 ${
                      milestone.isCompleted
                        ? "bg-emerald-400 border-emerald-400"
                        : "bg-portal-card border-secondary"
                    }`}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Birth marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
          style={{ left: "100%" }}
        >
          <div
            className={`p-1 rounded-full ${
              birthDateActual
                ? "bg-emerald-500"
                : isOverdue
                  ? "bg-red-500"
                  : "bg-white/20"
            }`}
          >
            <Baby
              className={`w-3 h-3 ${
                birthDateActual || isOverdue ? "text-white" : "text-secondary"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Timeline Labels */}
      <div className="flex justify-between text-xs">
        <div className="flex items-center gap-1">
          <Heart className="w-3 h-3 text-pink-400" />
          <span className="text-secondary">Bred</span>
          <span className="text-white font-medium">{formatDate(breedDateActual)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-amber-400" />
          <span className="text-secondary">Expected</span>
          <span className="text-white font-medium">{formatDate(expectedBirthDate)}</span>
        </div>
        {birthDateActual && (
          <div className="flex items-center gap-1">
            <Baby className="w-3 h-3 text-emerald-400" />
            <span className="text-secondary">Born</span>
            <span className="text-emerald-400 font-medium">
              {formatDate(birthDateActual)}
            </span>
          </div>
        )}
      </div>

      {/* Milestone Summary */}
      {showMilestones && totalMilestones > 0 && !compact && (
        <div className="pt-3 border-t border-hairline">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <MilestoneIcon className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-white">Milestones</span>
            </div>
            <span className="text-xs text-secondary">
              {completedMilestones} of {totalMilestones} completed
            </span>
          </div>
          <div className="flex gap-1">
            {milestones.map((m) => (
              <div
                key={m.id}
                className={`flex-1 h-1.5 rounded-full ${
                  m.isCompleted ? "bg-emerald-500" : "bg-white/10"
                }`}
                title={MILESTONE_LABELS[m.type]}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default FoalingTimeline;
