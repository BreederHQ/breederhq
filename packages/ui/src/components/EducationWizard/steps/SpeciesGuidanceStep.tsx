/**
 * SpeciesGuidanceStep Component
 *
 * Provides species-specific deep dive guidance using terminology system.
 * Shows detailed information about the species' reproductive characteristics.
 */

import * as React from "react";
import { WizardStep } from "../WizardStep";
import { getSpeciesTerminology, type SpeciesCode } from "../../../utils/speciesTerminology";

export interface SpeciesGuidanceStepProps {
  species: SpeciesCode;
}

export function SpeciesGuidanceStep({ species }: SpeciesGuidanceStepProps) {
  const terminology = getSpeciesTerminology(species);
  const { anchorMode, cycle, ovulation, birth, parents, offspring, weaning } = terminology;

  // Get species display name with proper capitalization
  const speciesName = species.charAt(0) + species.slice(1).toLowerCase();

  return (
    <WizardStep
      title={`${speciesName} Breeding Guide`}
      subtitle="Species-specific guidance for your breeding plans"
    >
      <div className="space-y-4">
        {/* Key recommendation */}
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-emerald-400 mb-1">Recommended Approach</div>
              <p className="text-xs text-secondary leading-relaxed">
                {anchorMode.guidanceText}
              </p>
            </div>
          </div>
        </div>

        {/* Terminology quick reference */}
        <div className="rounded-lg border border-hairline bg-surface p-4">
          <div className="text-sm font-medium text-primary mb-3">{speciesName} Terminology</div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-secondary">Female Parent</div>
              <div className="text-primary font-medium">{parents.femaleCap}</div>
            </div>
            <div>
              <div className="text-secondary">Male Parent</div>
              <div className="text-primary font-medium">{parents.maleCap}</div>
            </div>
            <div>
              <div className="text-secondary">Offspring</div>
              <div className="text-primary font-medium">{offspring.singularCap} / {offspring.pluralCap}</div>
            </div>
            <div>
              <div className="text-secondary">Birth Process</div>
              <div className="text-primary font-medium">{birth.processCap}</div>
            </div>
          </div>
        </div>

        {/* Cycle information */}
        <div className="rounded-lg border border-purple-500/40 bg-purple-500/10 p-4">
          <div className="text-sm font-medium text-primary mb-2">Reproductive Cycle</div>
          <p className="text-xs text-secondary leading-relaxed mb-3">
            {cycle.cycleExplanation}
          </p>

          {!anchorMode.isInducedOvulator && (
            <div className="pt-2 border-t border-purple-500/20">
              <div className="text-xs text-secondary">
                <span className="font-medium text-primary">Observation tip:</span> {cycle.cycleStartHelp}
              </div>
            </div>
          )}
        </div>

        {/* Ovulation info (if applicable) */}
        {!anchorMode.isInducedOvulator && anchorMode.testingAvailable && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
            <div className="text-sm font-medium text-primary mb-2">Ovulation Confirmation</div>
            <p className="text-xs text-secondary leading-relaxed">
              {ovulation.guidanceText}
            </p>
          </div>
        )}

        {/* Weaning info */}
        <div className="flex items-start gap-2 text-xs text-secondary">
          <svg className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            <strong className="text-primary">Weaning:</strong> {weaning.guidanceText}
          </span>
        </div>
      </div>
    </WizardStep>
  );
}
