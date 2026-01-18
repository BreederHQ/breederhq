/**
 * UpgradePathStep Component
 *
 * Explains when and how to upgrade from cycle start to ovulation anchor.
 * Only shown for species that support upgrade (DOG, HORSE).
 */

import * as React from "react";
import { WizardStep } from "../WizardStep";
import { getSpeciesTerminology, type SpeciesCode } from "../../../utils/speciesTerminology";

export interface UpgradePathStepProps {
  species: SpeciesCode;
}

export function UpgradePathStep({ species }: UpgradePathStepProps) {
  const terminology = getSpeciesTerminology(species);
  const { cycle, ovulation, anchorMode, birth } = terminology;

  return (
    <WizardStep
      title="Upgrading Your Anchor"
      subtitle="Start simple, upgrade when you can"
    >
      <div className="space-y-4">
        {/* The upgrade journey */}
        <div className="rounded-lg border border-hairline bg-surface p-4">
          <div className="text-sm font-medium text-primary mb-3">The Upgrade Path</div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-gradient-to-b from-amber-500 to-emerald-500" />

            {/* Start point */}
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 z-10">
                <span className="text-white text-xs font-bold">1</span>
              </div>
              <div className="pt-1">
                <div className="text-sm font-medium text-amber-400">{cycle.startLabelCap}</div>
                <p className="text-xs text-secondary mt-0.5">
                  Start with what you know - when the {cycle.startLabel} begins.
                </p>
              </div>
            </div>

            {/* Upgrade point */}
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-b from-amber-500 to-emerald-500 flex items-center justify-center flex-shrink-0 z-10">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </div>
              <div className="pt-1">
                <div className="text-sm font-medium text-primary">Upgrade When Ready</div>
                <p className="text-xs text-secondary mt-0.5">
                  Once you have ovulation confirmation, upgrade your plan for better accuracy.
                </p>
              </div>
            </div>

            {/* End point */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 z-10">
                <span className="text-white text-xs font-bold">2</span>
              </div>
              <div className="pt-1">
                <div className="text-sm font-medium text-emerald-400">Ovulation Anchor</div>
                <p className="text-xs text-secondary mt-0.5">
                  Maximum accuracy for {birth.process.toLowerCase()} date predictions.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* How to upgrade */}
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
          <div className="text-sm font-medium text-primary mb-2">How to Upgrade</div>
          <ol className="space-y-2 text-xs text-secondary">
            <li className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">1</span>
              <span>Create your plan using {cycle.startLabelCap} Date as the initial anchor.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">2</span>
              <span>When {ovulation.confirmationMethod} confirms ovulation, look for the "Upgrade to Ovulation" option.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">3</span>
              <span>Enter the confirmed ovulation date and all system calculated values will automatically recalculate to more accurate dates.</span>
            </li>
          </ol>
        </div>

        {/* Note */}
        <div className="flex items-start gap-2 text-xs text-secondary">
          <svg className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            <strong className="text-primary">Tip:</strong> You can always upgrade later. Starting with
            {" "}{cycle.startLabel} gets you going quickly, and you can refine accuracy when testing
            results are available.
          </span>
        </div>
      </div>
    </WizardStep>
  );
}
