// apps/breeding/src/components/FoalingMilestoneChecklist.tsx
// Horse-specific foaling milestone checklist for tracking vet checkpoints during gestation

import * as React from "react";
import {
  CheckCircle2,
  Circle,
  Calendar,
  Stethoscope,
  AlertTriangle,
  Baby,
  Eye,
  Home,
  Clock,
} from "lucide-react";
import { Button, DatePicker } from "@bhq/ui";

type MilestoneType =
  | "VET_PREGNANCY_CHECK_15D"
  | "VET_ULTRASOUND_45D"
  | "VET_ULTRASOUND_90D"
  | "BEGIN_MONITORING_300D"
  | "PREPARE_FOALING_AREA_320D"
  | "DAILY_CHECKS_330D"
  | "DUE_DATE_340D"
  | "OVERDUE_VET_CALL_350D";

type Milestone = {
  id: number;
  type: MilestoneType;
  scheduledDate: string;
  completedDate: string | null;
  isCompleted: boolean;
  notes?: string | null;
};

type FoalingMilestoneChecklistProps = {
  planId: number;
  damName?: string | null;
  expectedBirthDate: string | null;
  actualBreedDate?: string | null;
  actualBirthDate?: string | null;
  milestones: Milestone[];
  onCompleteMilestone: (milestoneId: number) => Promise<void>;
  onUncompleteMilestone?: (milestoneId: number) => Promise<void>;
  onCreateMilestones?: () => Promise<void>;
  onRecalculateMilestones?: () => Promise<void>;
  onDeleteMilestones?: () => Promise<void>;
  isLoading?: boolean;
};

// Milestone metadata for display
const MILESTONE_META: Record<
  MilestoneType,
  {
    label: string;
    shortLabel: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    category: "vet" | "monitoring" | "preparation" | "birth";
  }
> = {
  VET_PREGNANCY_CHECK_15D: {
    label: "15-Day Pregnancy Check",
    shortLabel: "15d Check",
    description: "Initial pregnancy confirmation by veterinarian",
    icon: <Stethoscope className="h-4 w-4" />,
    color: "text-blue-400",
    category: "vet",
  },
  VET_ULTRASOUND_45D: {
    label: "45-Day Ultrasound",
    shortLabel: "45d Ultrasound",
    description: "Confirm fetal heartbeat and check for twins",
    icon: <Eye className="h-4 w-4" />,
    color: "text-blue-400",
    category: "vet",
  },
  VET_ULTRASOUND_90D: {
    label: "90-Day Ultrasound",
    shortLabel: "90d Ultrasound",
    description: "Fetal development check and gender determination",
    icon: <Eye className="h-4 w-4" />,
    color: "text-blue-400",
    category: "vet",
  },
  BEGIN_MONITORING_300D: {
    label: "Begin Foaling Monitoring (300 Days)",
    shortLabel: "Begin Monitoring",
    description: "Start daily observation of mare for foaling signs",
    icon: <Clock className="h-4 w-4" />,
    color: "text-amber-400",
    category: "monitoring",
  },
  PREPARE_FOALING_AREA_320D: {
    label: "Prepare Foaling Area (320 Days)",
    shortLabel: "Prep Foaling Area",
    description: "Clean and prepare stall, gather foaling supplies",
    icon: <Home className="h-4 w-4" />,
    color: "text-purple-400",
    category: "preparation",
  },
  DAILY_CHECKS_330D: {
    label: "Daily Checks Begin (330 Days)",
    shortLabel: "Daily Checks",
    description: "Increase to twice-daily monitoring, check udder development",
    icon: <Eye className="h-4 w-4" />,
    color: "text-amber-400",
    category: "monitoring",
  },
  DUE_DATE_340D: {
    label: "Expected Foaling Date (340 Days)",
    shortLabel: "Due Date",
    description: "Expected birth date - mare may foal any time",
    icon: <Baby className="h-4 w-4" />,
    color: "text-emerald-400",
    category: "birth",
  },
  OVERDUE_VET_CALL_350D: {
    label: "Overdue - Call Vet (350 Days)",
    shortLabel: "Overdue Check",
    description: "Contact veterinarian if mare has not foaled",
    icon: <AlertTriangle className="h-4 w-4" />,
    color: "text-red-400",
    category: "vet",
  },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function getDaysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    return Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

function getDaysLabel(days: number | null): string {
  if (days === null) return "";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  if (days < 0) return `${Math.abs(days)} days ago`;
  return `In ${days} days`;
}

export function FoalingMilestoneChecklist({
  planId,
  damName,
  expectedBirthDate,
  actualBreedDate,
  actualBirthDate,
  milestones,
  onCompleteMilestone,
  onUncompleteMilestone,
  onCreateMilestones,
  onRecalculateMilestones,
  onDeleteMilestones,
  isLoading = false,
}: FoalingMilestoneChecklistProps) {
  const [completingId, setCompletingId] = React.useState<number | null>(null);
  const [uncompletingId, setUncompletingId] = React.useState<number | null>(null);

  const handleComplete = async (milestoneId: number) => {
    setCompletingId(milestoneId);
    try {
      await onCompleteMilestone(milestoneId);
    } finally {
      setCompletingId(null);
    }
  };

  const handleUncomplete = async (milestoneId: number) => {
    if (!onUncompleteMilestone) return;
    setUncompletingId(milestoneId);
    try {
      await onUncompleteMilestone(milestoneId);
    } finally {
      setUncompletingId(null);
    }
  };

  // Sort milestones by scheduled date
  const sortedMilestones = [...milestones].sort(
    (a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
  );

  // Calculate progress
  const completedCount = milestones.filter((m) => m.isCompleted).length;
  const totalCount = milestones.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Find the next upcoming milestone
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextMilestone = sortedMilestones.find(
    (m) => !m.isCompleted && new Date(m.scheduledDate) >= today
  );

  // If no actual breed date recorded, show message explaining milestones can't be created yet
  // Milestones are calculated from the confirmed breeding date, not speculative expected dates
  if (!actualBreedDate && !actualBirthDate) {
    return (
      <div className="rounded-xl border border-hairline bg-surface p-6">
        <div className="flex flex-col items-center text-center">
          <Calendar className="h-12 w-12 text-secondary mb-4" />
          <h3 className="text-lg font-semibold text-primary mb-2">
            Foaling Milestone Checklist
          </h3>
          <p className="text-sm text-secondary mb-4 max-w-md">
            Record the actual breeding date to generate foaling milestones. Milestone dates
            are calculated from the confirmed breeding date to ensure accuracy.
          </p>
          <p className="text-xs text-secondary/70">
            Go to the Dates tab and enter the Breeding Date in the "Actual Dates" section.
          </p>
        </div>
      </div>
    );
  }

  // If no milestones exist yet but we have actual breed date, show option to create them
  if (milestones.length === 0 && onCreateMilestones && actualBreedDate) {
    return (
      <div className="rounded-xl border border-hairline bg-surface p-6">
        <div className="flex flex-col items-center text-center">
          <Calendar className="h-12 w-12 text-purple-400 mb-4" />
          <h3 className="text-lg font-semibold text-primary mb-2">
            Foaling Milestone Checklist
          </h3>
          <p className="text-sm text-secondary mb-4 max-w-md">
            Track important vet checkpoints and preparation milestones during your mare's
            gestation. Milestones are calculated from the breeding date ({new Date(actualBreedDate).toLocaleDateString()}).
          </p>
          <Button
            variant="primary"
            onClick={onCreateMilestones}
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Calendar className="h-4 w-4 mr-2" />
            {isLoading ? "Creating..." : "Create Foaling Milestones"}
          </Button>
        </div>
      </div>
    );
  }

  // Check if milestones exist but don't align with the actual breed date
  // This can happen if:
  // 1. Milestones were created before actual breed date was recorded (legacy data)
  // 2. The breed date was changed after milestones were created
  const checkMilestonesAreStale = (): boolean => {
    if (milestones.length === 0) return false;
    if (actualBirthDate) return false; // Already foaled, don't show stale warning

    // Case 1: No breed date but milestones exist
    if (!actualBreedDate) return true;

    // Case 2: Have breed date - check if first milestone aligns
    // The 15-day pregnancy check should be ~15 days after breed date
    const firstMilestone = sortedMilestones.find(m => m.type === "VET_PREGNANCY_CHECK_15D");
    if (!firstMilestone) return false;

    const breedDate = new Date(actualBreedDate);
    breedDate.setHours(0, 0, 0, 0);
    const expectedFirst = new Date(breedDate);
    expectedFirst.setDate(expectedFirst.getDate() + 15);

    const actualFirst = new Date(firstMilestone.scheduledDate);
    actualFirst.setHours(0, 0, 0, 0);

    // If off by more than 3 days, milestones are stale
    const diffDays = Math.abs(expectedFirst.getTime() - actualFirst.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays > 3;
  };

  const milestonesAreStale = checkMilestonesAreStale();

  return (
    <div className="rounded-xl border border-hairline bg-surface overflow-hidden">
      {/* Warning banner for stale milestones */}
      {milestonesAreStale && (
        <div className="px-4 py-3 bg-amber-500/15 border-b border-amber-500/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-200">
                Milestone dates don't match the breeding date
              </p>
              <p className="text-xs text-amber-200/70 mt-1">
                {actualBreedDate
                  ? `These milestones don't align with the breeding date (${new Date(actualBreedDate).toLocaleDateString()}). Delete and recreate them to get accurate dates.`
                  : "These milestones were created before the actual breeding date was recorded. Enter the breeding date in the Dates tab, then recreate the milestones."}
              </p>
              {onDeleteMilestones && (
                <div className="mt-2 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onDeleteMilestones}
                    disabled={isLoading}
                    className="text-amber-300 border-amber-500/50 hover:bg-amber-500/20"
                  >
                    Delete & Recreate Milestones
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-4 py-3 border-b border-hairline bg-purple-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Calendar className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-purple-100">
                Foaling Milestone Checklist
              </h3>
              {damName && (
                <p className="text-xs text-purple-200/70">{damName}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-purple-200">
              {completedCount}/{totalCount} Complete
            </div>
            {expectedBirthDate && !actualBirthDate && (
              <div className="text-xs text-purple-300/70">
                Due: {formatDate(expectedBirthDate)}
              </div>
            )}
            {actualBirthDate && (
              <div className="text-xs text-emerald-400">
                Foaled: {formatDate(actualBirthDate)}
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-purple-500/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Milestone list */}
      <div className="divide-y divide-hairline">
        {sortedMilestones.map((milestone) => {
          const meta = MILESTONE_META[milestone.type];
          const daysUntil = getDaysUntil(milestone.scheduledDate);
          // Only show as overdue if mare has been bred (actualBreedDate is set)
          const isOverdue = actualBreedDate && daysUntil !== null && daysUntil < 0 && !milestone.isCompleted;
          const isUpcoming = actualBreedDate && daysUntil !== null && daysUntil >= 0 && daysUntil <= 7 && !milestone.isCompleted;
          const isNext = nextMilestone?.id === milestone.id;

          return (
            <div
              key={milestone.id}
              className={`px-4 py-3 transition-colors ${
                isNext
                  ? "bg-purple-500/10"
                  : isOverdue
                    ? "bg-red-500/5"
                    : ""
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox/status */}
                <button
                  type="button"
                  onClick={() => {
                    if (milestone.isCompleted && onUncompleteMilestone) {
                      handleUncomplete(milestone.id);
                    } else if (!milestone.isCompleted) {
                      handleComplete(milestone.id);
                    }
                  }}
                  disabled={completingId === milestone.id || uncompletingId === milestone.id}
                  className={`mt-0.5 flex-shrink-0 transition-colors ${
                    milestone.isCompleted
                      ? onUncompleteMilestone
                        ? "text-emerald-400 hover:text-emerald-300 cursor-pointer"
                        : "text-emerald-400 cursor-default"
                      : completingId === milestone.id
                        ? "text-secondary cursor-wait"
                        : "text-secondary hover:text-primary cursor-pointer"
                  }`}
                  title={milestone.isCompleted && onUncompleteMilestone ? "Click to mark incomplete" : undefined}
                >
                  {uncompletingId === milestone.id ? (
                    <Circle className="h-5 w-5 animate-pulse" />
                  ) : milestone.isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={meta.color}>{meta.icon}</span>
                    <span
                      className={`text-sm font-medium ${
                        milestone.isCompleted
                          ? "text-secondary line-through"
                          : "text-primary"
                      }`}
                    >
                      {meta.label}
                    </span>
                    {isOverdue && (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase bg-red-500/20 text-red-400 rounded">
                        Overdue
                      </span>
                    )}
                    {isUpcoming && !isOverdue && (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase bg-amber-500/20 text-amber-400 rounded">
                        Soon
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-secondary mt-0.5">{meta.description}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs">
                    <span className="text-secondary">
                      {milestone.isCompleted && milestone.completedDate
                        ? `Completed: ${formatDate(milestone.completedDate)}`
                        : `Scheduled: ${formatDate(milestone.scheduledDate)}`}
                    </span>
                    {!milestone.isCompleted && daysUntil !== null && (
                      <span
                        className={
                          isOverdue
                            ? "text-red-400 font-medium"
                            : isUpcoming
                              ? "text-amber-400"
                              : "text-secondary"
                        }
                      >
                        {getDaysLabel(daysUntil)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                {!milestone.isCompleted ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleComplete(milestone.id)}
                    disabled={completingId === milestone.id}
                    className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                  >
                    {completingId === milestone.id ? "..." : "Mark Done"}
                  </Button>
                ) : onUncompleteMilestone ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleUncomplete(milestone.id)}
                    disabled={uncompletingId === milestone.id}
                    className="text-secondary hover:text-primary hover:bg-white/5"
                  >
                    {uncompletingId === milestone.id ? "..." : "Undo"}
                  </Button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer - guidance text */}
      <div className="px-4 py-3 border-t border-hairline bg-surface/50">
        <p className="text-xs text-secondary">
          These milestones are calculated based on a typical 340-day equine gestation.
          Adjust dates as needed based on veterinary guidance.
        </p>
      </div>
    </div>
  );
}

export default FoalingMilestoneChecklist;
