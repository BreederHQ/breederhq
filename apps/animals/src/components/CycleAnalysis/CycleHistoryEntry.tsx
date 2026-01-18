import * as React from "react";
import { Button } from "@bhq/ui";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { VarianceBadge } from "./VarianceBadge";
import type { CycleHistoryEntry as CycleHistoryEntryType } from "./types";

type CycleHistoryEntryProps = {
  cycle: CycleHistoryEntryType;
  onViewBreedingPlan?: (planId: number) => void;
  onEdit?: (cycle: CycleHistoryEntryType) => void;
  onDelete?: (cycleId: number) => void;
  showActions?: boolean;
};

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatOvulationMethod(method: string | null): string {
  if (!method) return "";

  const labels: Record<string, string> = {
    PROGESTERONE_TEST: "Progesterone Test",
    LH_TEST: "LH Test",
    ULTRASOUND: "Ultrasound",
    VAGINAL_CYTOLOGY: "Vaginal Cytology",
    PALPATION: "Palpation",
    AT_HOME_TEST: "At-Home Test",
    VETERINARY_EXAM: "Vet Exam",
    BREEDING_INDUCED: "Breeding Induced",
    CALCULATED: "Calculated",
    ESTIMATED: "Estimated",
  };

  return labels[method] || method;
}

function daysBetween(start: string, end: string): number {
  const a = new Date(start);
  const b = new Date(end);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((b.getTime() - a.getTime()) / msPerDay);
}

export function CycleHistoryEntry({
  cycle,
  onViewBreedingPlan,
  onEdit,
  onDelete,
  showActions = true,
}: CycleHistoryEntryProps) {
  const hasOvulation = cycle.ovulation !== null;

  return (
    <div className="border border-hairline rounded-lg p-3 bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {/* Cycle Start */}
          <div className="min-w-[100px]">
            <div className="text-xs text-secondary">Heat Start</div>
            <div className="font-medium text-sm">{formatDate(cycle.cycleStart)}</div>
          </div>

          {/* Arrow */}
          <div className="text-secondary hidden sm:block">-</div>

          {/* Ovulation */}
          <div className="min-w-[140px]">
            <div className="text-xs text-secondary flex items-center gap-1">
              Ovulation
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">
                {hasOvulation ? formatDate(cycle.ovulation) : "-"}
              </span>
              {hasOvulation && (
                <ConfidenceBadge
                  confidence={cycle.confidence}
                  source={cycle.source}
                  showIcon={false}
                />
              )}
            </div>
            {cycle.ovulationMethod && cycle.ovulationMethod !== "ESTIMATED" && (
              <div className="text-xs text-secondary">
                ({formatOvulationMethod(cycle.ovulationMethod)})
              </div>
            )}
          </div>

          {/* Pattern / Offset */}
          {cycle.offsetDays !== null && (
            <div className="min-w-[80px]">
              <div className="text-xs text-secondary">Pattern</div>
              <div className="flex items-center gap-2 text-sm">
                <span>Day {cycle.offsetDays}</span>
                {cycle.variance !== null && <VarianceBadge variance={cycle.variance} />}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-2">
            {cycle.breedingPlanId && onViewBreedingPlan && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => onViewBreedingPlan(cycle.breedingPlanId!)}
              >
                View Plan
              </Button>
            )}
            {onEdit && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => onEdit(cycle)}
              >
                Edit
              </Button>
            )}
            {onDelete && !cycle.breedingPlanId && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => onDelete(cycle.id)}
              >
                Delete
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Birth info if available */}
      {cycle.birthDate && cycle.ovulation && (
        <div className="mt-2 pt-2 border-t border-hairline text-sm text-secondary">
          Birth: {formatDate(cycle.birthDate)} ({daysBetween(cycle.ovulation, cycle.birthDate)} days from ovulation)
        </div>
      )}
    </div>
  );
}
