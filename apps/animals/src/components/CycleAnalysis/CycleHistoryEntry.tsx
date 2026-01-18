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
    <div
      className="group rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
      style={{
        backgroundColor: "#1a1a1a",
        border: "1px solid rgba(60, 60, 60, 0.5)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "#222222";
        e.currentTarget.style.borderColor = "rgba(255, 107, 53, 0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "#1a1a1a";
        e.currentTarget.style.borderColor = "rgba(60, 60, 60, 0.5)";
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          {/* Cycle Start - with icon */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "rgba(255, 107, 53, 0.15)" }}
            >
              <svg className="w-5 h-5" style={{ color: "#ff6b35" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide" style={{ color: "rgba(255, 255, 255, 0.5)" }}>Heat Start</div>
              <div className="font-semibold text-white">{formatDate(cycle.cycleStart)}</div>
            </div>
          </div>

          {/* Arrow */}
          <div className="hidden sm:block" style={{ color: "rgba(255, 255, 255, 0.3)" }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>

          {/* Ovulation - with icon */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: hasOvulation ? "rgba(34, 197, 94, 0.15)" : "rgba(60, 60, 60, 0.3)" }}
            >
              <svg className="w-5 h-5" style={{ color: hasOvulation ? "#22c55e" : "rgba(255, 255, 255, 0.3)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide" style={{ color: "rgba(255, 255, 255, 0.5)" }}>Ovulation</div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">
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
                <div className="text-xs" style={{ color: "rgba(255, 255, 255, 0.4)" }}>
                  {formatOvulationMethod(cycle.ovulationMethod)}
                </div>
              )}
            </div>
          </div>

          {/* Pattern / Offset - with icon */}
          {cycle.offsetDays !== null && (
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "rgba(59, 130, 246, 0.15)" }}
              >
                <svg className="w-5 h-5" style={{ color: "#3b82f6" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide" style={{ color: "rgba(255, 255, 255, 0.5)" }}>Pattern</div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">Day {cycle.offsetDays}</span>
                  {cycle.variance !== null && <VarianceBadge variance={cycle.variance} />}
                </div>
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
        <div
          className="mt-3 pt-3 text-sm flex items-center gap-2"
          style={{ borderTop: "1px solid rgba(60, 60, 60, 0.5)", color: "rgba(255, 255, 255, 0.6)" }}
        >
          <svg className="w-4 h-4" style={{ color: "#f59e0b" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Birth: {formatDate(cycle.birthDate)} ({daysBetween(cycle.ovulation, cycle.birthDate)} days from ovulation)
        </div>
      )}
    </div>
  );
}
