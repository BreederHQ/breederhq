// apps/offspring/src/components/FoalingOutcomePrompt.tsx
// Inline UI prompting breeders to record foaling outcome after birth is recorded

import * as React from "react";
import { Baby, ClipboardCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@bhq/ui";
import type { FoalingOutcome } from "../api";

type FoalingOutcomePromptProps = {
  species: string;
  birthDate: string | null;
  existingOutcome: FoalingOutcome | null;
  onRecordClick: () => void;
};

export function FoalingOutcomePrompt({
  species,
  birthDate,
  existingOutcome,
  onRecordClick,
}: FoalingOutcomePromptProps) {
  // Only show for horses
  if (species?.toUpperCase() !== "HORSE") {
    return null;
  }

  // Don't show if no birth date recorded
  if (!birthDate) {
    return null;
  }

  const formattedDate = new Date(birthDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // If outcome already recorded, show a summary
  if (existingOutcome) {
    const mareConditionLabels: Record<string, string> = {
      EXCELLENT: "Excellent",
      GOOD: "Good",
      FAIR: "Fair",
      POOR: "Poor",
      VETERINARY_CARE_REQUIRED: "Vet Care Required",
    };

    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 mb-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-emerald-200">
                Foaling Outcome Recorded
              </h4>
              <Button
                size="sm"
                variant="ghost"
                onClick={onRecordClick}
                className="text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/20"
              >
                <ClipboardCheck className="h-3.5 w-3.5 mr-1.5" />
                Edit
              </Button>
            </div>

            <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {/* Placenta Status */}
              <div>
                <span className="text-emerald-200/60">Placenta</span>
                <div className="text-emerald-100">
                  {existingOutcome.placentaPassed === true
                    ? `Passed${existingOutcome.placentaPassedMinutes ? ` (${existingOutcome.placentaPassedMinutes} min)` : ""}`
                    : existingOutcome.placentaPassed === false
                      ? "Not passed"
                      : "—"}
                </div>
              </div>

              {/* Mare Condition */}
              <div>
                <span className="text-emerald-200/60">Mare Condition</span>
                <div className="text-emerald-100">
                  {existingOutcome.mareCondition
                    ? mareConditionLabels[existingOutcome.mareCondition] || existingOutcome.mareCondition
                    : "—"}
                </div>
              </div>

              {/* Complications */}
              <div>
                <span className="text-emerald-200/60">Complications</span>
                <div className="text-emerald-100">
                  {existingOutcome.hadComplications ? "Yes" : "No"}
                </div>
              </div>

              {/* Vet Called */}
              <div>
                <span className="text-emerald-200/60">Vet Called</span>
                <div className="text-emerald-100">
                  {existingOutcome.veterinarianCalled ? "Yes" : "No"}
                </div>
              </div>
            </div>

            {/* Post-foaling heat info if available */}
            {(existingOutcome.postFoalingHeatDate || existingOutcome.readyForRebreeding) && (
              <div className="mt-3 pt-3 border-t border-emerald-500/20 grid grid-cols-2 gap-3 text-xs">
                {existingOutcome.postFoalingHeatDate && (
                  <div>
                    <span className="text-emerald-200/60">Foal Heat</span>
                    <div className="text-emerald-100">
                      {new Date(existingOutcome.postFoalingHeatDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                )}
                {existingOutcome.readyForRebreeding && (
                  <div>
                    <span className="text-emerald-200/60">Rebreeding</span>
                    <div className="text-emerald-100">
                      {existingOutcome.rebredDate
                        ? `Rebred ${new Date(existingOutcome.rebredDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                        : "Ready"}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show prompt to record outcome
  return (
    <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-4 mb-4">
      <div className="flex items-start gap-3">
        <Baby className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-medium text-purple-200">
                Record Foaling Outcome
              </h4>
              <p className="text-xs text-purple-200/80 mt-0.5">
                Foaled on {formattedDate}. Record placenta passage, mare condition, and complications.
              </p>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={onRecordClick}
              className="bg-purple-500 hover:bg-purple-600 text-white flex-shrink-0"
            >
              <ClipboardCheck className="h-3.5 w-3.5 mr-1.5" />
              Record Outcome
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FoalingOutcomePrompt;
