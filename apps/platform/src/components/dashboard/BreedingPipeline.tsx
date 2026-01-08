// apps/platform/src/components/dashboard/BreedingPipeline.tsx
// Visual timeline of active breeding plans - swimlanes by stage

import * as React from "react";
import type { PlanRow } from "../../api";
import type { WindowsMap } from "../../features/useDashboardDataV2";

type Props = {
  plans: PlanRow[];
  windows: WindowsMap;
  maxVisible?: number;
  onViewPlan?: (id: string | number) => void;
};

// ─────────────────── Types ───────────────────

type PlanStage =
  | "planning"
  | "committed"
  | "hormone_testing"
  | "breeding"
  | "gestation"
  | "birth"
  | "care"
  | "placement"
  | "complete";

type EnrichedPlan = {
  id: string | number;
  name: string;
  damName?: string;
  sireName?: string;
  species: string;
  stage: PlanStage;
  stageLabel: string;
  daysUntilNextMilestone: number | null;
  nextMilestone: string | null;
  urgency: "normal" | "attention" | "urgent";
  progress: number; // 0-100
};

// ─────────────────── Helpers ───────────────────

const STAGE_ORDER: PlanStage[] = [
  "planning",
  "committed",
  "hormone_testing",
  "breeding",
  "gestation",
  "birth",
  "care",
  "placement",
  "complete",
];

const STAGE_CONFIG: Record<PlanStage, { label: string; color: string; bgColor: string }> = {
  planning: { label: "Planning", color: "text-gray-400", bgColor: "bg-[#525252]" },
  committed: { label: "Committed", color: "text-blue-400", bgColor: "bg-[#2563eb]" },
  hormone_testing: { label: "Hormone Testing", color: "text-purple-400", bgColor: "bg-[#9333ea]" },
  breeding: { label: "Breeding", color: "text-pink-400", bgColor: "bg-[#ec4899]" },
  gestation: { label: "Gestation", color: "text-orange-400", bgColor: "bg-[#ff6b35]" },
  birth: { label: "Birth", color: "text-red-400", bgColor: "bg-[#ef4444]" },
  care: { label: "Offspring Care", color: "text-yellow-400", bgColor: "bg-[#eab308]" },
  placement: { label: "Placement", color: "text-green-400", bgColor: "bg-[#22c55e]" },
  complete: { label: "Complete", color: "text-emerald-400", bgColor: "bg-[#10b981]" },
};

function deriveStage(plan: PlanRow): PlanStage {
  const status = plan.status?.toUpperCase() || "";

  if (status === "COMPLETE" || status === "COMPLETED") return "complete";
  if (status === "PLACEMENT" || status === "PLACEMENT_STARTED" || status === "PLACEMENT_COMPLETED") return "placement";
  if (status === "WEANED") return "care";
  if (status === "BIRTHED" || status === "PREGNANT") return "birth";
  if (status === "BRED") return "gestation";
  if (status === "BREEDING") return "breeding";
  if (status === "HORMONE_TESTING") return "hormone_testing";
  if (status === "COMMITTED" || status === "CYCLE_EXPECTED") return "committed";

  // Default based on locked dates
  if (plan.lockedCycleStart) return "committed";
  return "planning";
}

function calculateDaysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getNextMilestone(plan: PlanRow, stage: PlanStage): { days: number | null; label: string | null } {
  switch (stage) {
    case "planning":
    case "committed":
      return { days: calculateDaysUntil(plan.lockedCycleStart), label: "Cycle start" };
    case "hormone_testing":
      return { days: calculateDaysUntil(plan.lockedOvulationDate), label: "Ovulation" };
    case "breeding":
      return { days: calculateDaysUntil(plan.expectedDue), label: "Expected due" };
    case "gestation":
      return { days: calculateDaysUntil(plan.expectedDue), label: "Birth" };
    case "birth":
    case "care":
      return { days: calculateDaysUntil(plan.expectedWeaned), label: "Weaning" };
    case "placement":
      return { days: calculateDaysUntil(plan.expectedPlacementCompleted), label: "Placement complete" };
    default:
      return { days: null, label: null };
  }
}

function calculateUrgency(days: number | null): "normal" | "attention" | "urgent" {
  if (days === null) return "normal";
  if (days < 0) return "urgent"; // Overdue
  if (days <= 7) return "attention"; // Within a week
  return "normal";
}

function calculateProgress(stage: PlanStage): number {
  const idx = STAGE_ORDER.indexOf(stage);
  if (idx < 0) return 0;
  return Math.round((idx / (STAGE_ORDER.length - 1)) * 100);
}

function enrichPlan(plan: PlanRow): EnrichedPlan {
  const stage = deriveStage(plan);
  const { days, label } = getNextMilestone(plan, stage);
  const urgency = calculateUrgency(days);

  return {
    id: plan.id,
    name: plan.name,
    species: plan.species || "",
    stage,
    stageLabel: STAGE_CONFIG[stage].label,
    daysUntilNextMilestone: days,
    nextMilestone: label,
    urgency,
    progress: calculateProgress(stage),
  };
}

// ─────────────────── Components ───────────────────

function UrgencyDot({ urgency }: { urgency: "normal" | "attention" | "urgent" }) {
  const colors = {
    normal: "bg-[#22c55e]",
    attention: "bg-[#f59e0b]",
    urgent: "bg-[#ef4444] animate-pulse",
  };
  return <div className={`w-2 h-2 rounded-full ${colors[urgency]}`} />;
}

function ProgressBar({ progress, urgency }: { progress: number; urgency: string }) {
  const colors = {
    normal: "bg-[#ff6b35]",
    attention: "bg-[#f59e0b]",
    urgent: "bg-[#ef4444]",
  };
  return (
    <div className="h-1 w-full bg-[#222222] rounded-full overflow-hidden">
      <div
        className={`h-full ${colors[urgency as keyof typeof colors] || colors.normal} transition-all duration-300`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

function PlanCard({
  plan,
  onClick,
}: {
  plan: EnrichedPlan;
  onClick?: () => void;
}) {
  const config = STAGE_CONFIG[plan.stage];

  return (
    <div
      onClick={onClick}
      className={`
        rounded-lg border
        border-[rgba(60,60,60,0.5)]
        bg-[#1a1a1a]
        p-3
        transition-all duration-200
        ${onClick ? "cursor-pointer hover:bg-[#222222] hover:border-[rgba(255,107,53,0.3)] hover:-translate-y-0.5" : ""}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <UrgencyDot urgency={plan.urgency} />
          <span className="text-sm font-medium text-white truncate">{plan.name}</span>
        </div>
        <span className={`${config.bgColor} text-white text-xs px-2 py-0.5 rounded flex-shrink-0`}>
          {config.label}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <ProgressBar progress={plan.progress} urgency={plan.urgency} />
      </div>

      {/* Next milestone */}
      {plan.nextMilestone && plan.daysUntilNextMilestone !== null && (
        <div className="text-xs text-[rgba(255,255,255,0.5)]">
          {plan.nextMilestone}:{" "}
          <span className={plan.urgency === "urgent" ? "text-[#ef4444] font-medium" : "text-[rgba(255,255,255,0.7)]"}>
            {plan.daysUntilNextMilestone < 0
              ? `${Math.abs(plan.daysUntilNextMilestone)} days overdue`
              : plan.daysUntilNextMilestone === 0
                ? "Today"
                : `${plan.daysUntilNextMilestone} days`}
          </span>
        </div>
      )}
    </div>
  );
}

function EmptyPipeline() {
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
          <path d="M12 2a3 3 0 0 0-3 3v1a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 9a3 3 0 0 0-3 3 3 3 0 0 0 6 0 3 3 0 0 0-3-3Z" />
          <path d="M5 9a3 3 0 0 0-3 3 3 3 0 0 0 6 0 3 3 0 0 0-3-3Z" />
          <path d="M12 16c-4 0-6 3-6 5v1h12v-1c0-2-2-5-6-5Z" />
        </svg>
      </div>
      <div className="text-white font-medium text-sm">No active breeding plans</div>
      <div className="text-[rgba(255,255,255,0.5)] text-xs mt-1">
        Create a breeding plan to see your pipeline here
      </div>
    </div>
  );
}

// ─────────────────── Main Component ───────────────────

export default function BreedingPipeline({ plans, windows, maxVisible = 6, onViewPlan }: Props) {
  const [showAll, setShowAll] = React.useState(false);

  // Enrich and sort plans by urgency
  const enrichedPlans = React.useMemo(() => {
    return plans
      .map(enrichPlan)
      .filter((p) => p.stage !== "complete") // Don't show completed
      .sort((a, b) => {
        // Sort by urgency first, then by days until next milestone
        const urgencyOrder = { urgent: 0, attention: 1, normal: 2 };
        const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
        if (urgencyDiff !== 0) return urgencyDiff;

        // Then by days (soonest first, nulls last)
        const aDays = a.daysUntilNextMilestone ?? Infinity;
        const bDays = b.daysUntilNextMilestone ?? Infinity;
        return aDays - bDays;
      });
  }, [plans]);

  const visiblePlans = showAll ? enrichedPlans : enrichedPlans.slice(0, maxVisible);
  const hiddenCount = enrichedPlans.length - maxVisible;

  if (enrichedPlans.length === 0) {
    return <EmptyPipeline />;
  }

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
            <path d="M12 2a3 3 0 0 0-3 3v1a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 9a3 3 0 0 0-3 3 3 3 0 0 0 6 0 3 3 0 0 0-3-3Z" />
            <path d="M5 9a3 3 0 0 0-3 3 3 3 0 0 0 6 0 3 3 0 0 0-3-3Z" />
            <path d="M12 16c-4 0-6 3-6 5v1h12v-1c0-2-2-5-6-5Z" />
          </svg>
          <span className="text-sm font-medium text-white">Breeding Pipeline</span>
          <span className="text-xs text-[rgba(255,255,255,0.5)]">({enrichedPlans.length} active)</span>
        </div>
        <a
          href="/breeding"
          className="text-xs text-[#ff6b35] hover:underline"
        >
          View all
        </a>
      </div>

      {/* Plan cards - horizontal scroll on mobile, grid on desktop */}
      <div className="flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible">
        {visiblePlans.map((plan) => (
          <div key={plan.id} className="flex-shrink-0 w-64 md:w-auto">
            <PlanCard
              plan={plan}
              onClick={onViewPlan ? () => onViewPlan(plan.id) : undefined}
            />
          </div>
        ))}
      </div>

      {/* Show more button */}
      {hiddenCount > 0 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="
            w-full py-2 rounded-lg
            border border-dashed border-[rgba(60,60,60,0.5)]
            text-sm text-[rgba(255,255,255,0.5)]
            hover:border-[rgba(255,107,53,0.5)] hover:text-white
            transition-colors
          "
        >
          Show {hiddenCount} more plan{hiddenCount !== 1 ? "s" : ""}
        </button>
      )}

      {/* Collapse button */}
      {showAll && enrichedPlans.length > maxVisible && (
        <button
          onClick={() => setShowAll(false)}
          className="
            w-full py-2 rounded-lg
            border border-dashed border-[rgba(60,60,60,0.5)]
            text-sm text-[rgba(255,255,255,0.5)]
            hover:border-[rgba(255,107,53,0.5)] hover:text-white
            transition-colors
          "
        >
          Show less
        </button>
      )}
    </div>
  );
}
