/**
 * AnchorModesStep Component
 *
 * Explains the available anchor modes (CYCLE_START, OVULATION, BREEDING_DATE).
 * Content adapts based on species capabilities.
 */

import * as React from "react";
import { WizardStep } from "../WizardStep";
import { getSpeciesTerminology, type SpeciesCode } from "../../../utils/speciesTerminology";

export interface AnchorModesStepProps {
  species: SpeciesCode;
}

export function AnchorModesStep({ species }: AnchorModesStepProps) {
  const terminology = getSpeciesTerminology(species);
  const { anchorMode, cycle, birth } = terminology;
  const availableOptions = anchorMode.options;

  return (
    <WizardStep
      title="Understanding Anchor Modes"
      subtitle={`Available options for ${species.toLowerCase()} breeding`}
    >
      <div className="space-y-4">
        {/* Available anchor modes */}
        <div className="space-y-3">
          {availableOptions.map((option, idx) => {
            const isRecommended = option.recommended;

            return (
              <div
                key={option.type}
                className={`rounded-lg border p-4 ${
                  isRecommended
                    ? "border-emerald-500/40 bg-emerald-500/10"
                    : "border-hairline bg-surface"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-primary">{option.label}</span>
                      {isRecommended && (
                        <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-500 text-white rounded-full">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-secondary">{option.description}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      isRecommended ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-700 text-zinc-300"
                    }`}>
                      {option.accuracy}
                    </div>
                  </div>
                </div>

                {/* Show accuracy details if available (for CYCLE_START) */}
                {"accuracyDetails" in option && option.accuracyDetails && (
                  <div className="mt-2 pt-2 border-t border-hairline">
                    <div className="text-[10px] text-secondary space-y-0.5">
                      {(option.accuracyDetails as string).split("\n").map((line, i) => (
                        <div key={i}>{line}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Show confirmation methods if available */}
                {option.testingAvailable && option.confirmationMethods && option.confirmationMethods.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-hairline">
                    <div className="text-[10px] text-secondary">
                      <span className="font-medium">Confirmation methods:</span>{" "}
                      {option.confirmationMethods.join(", ")}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Species-specific explanation */}
        <div className="rounded-lg border border-purple-500/40 bg-purple-500/10 p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-primary mb-1">
                {anchorMode.isInducedOvulator ? "Induced Ovulation" : "Why Accuracy Varies"}
              </div>
              <p className="text-xs text-secondary leading-relaxed">
                {anchorMode.isInducedOvulator ? (
                  <>
                    {species} are <strong>induced ovulators</strong>, meaning they ovulate in response
                    to breeding. This simplifies timing since the breeding date directly corresponds to
                    when ovulation occurs.
                  </>
                ) : (
                  <>
                    {cycle.cycleExplanation} The closer your anchor is to the actual biological event
                    (ovulation), the more accurate your {birth.process.toLowerCase()} prediction will be.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </WizardStep>
  );
}
