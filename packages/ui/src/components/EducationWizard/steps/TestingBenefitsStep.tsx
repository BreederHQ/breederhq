/**
 * TestingBenefitsStep Component
 *
 * Explains how ovulation testing improves accuracy.
 * Only shown for species where testing is available (DOG, HORSE).
 */

import * as React from "react";
import { WizardStep } from "../WizardStep";
import { getSpeciesTerminology, type SpeciesCode } from "../../../utils/speciesTerminology";

export interface TestingBenefitsStepProps {
  species: SpeciesCode;
}

export function TestingBenefitsStep({ species }: TestingBenefitsStepProps) {
  const terminology = getSpeciesTerminology(species);
  const { ovulation, anchorMode, birth, cycle } = terminology;

  const confirmationMethods = ovulation.confirmationMethods;
  const primaryMethod = confirmationMethods[0] || "testing";

  return (
    <WizardStep
      title="The Benefits of Testing"
      subtitle="How ovulation confirmation improves accuracy"
    >
      <div className="space-y-4">
        {/* Accuracy comparison */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-hairline bg-surface p-3 text-center">
            <div className="text-xs text-secondary mb-1">Without Testing</div>
            <div className="text-lg font-bold text-amber-400">
              {anchorMode.options.find(o => o.type === "CYCLE_START")?.accuracy || "±2-3 days"}
            </div>
            <div className="text-[10px] text-secondary mt-1">{cycle.startLabelCap} based</div>
          </div>
          <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-center">
            <div className="text-xs text-secondary mb-1">With Testing</div>
            <div className="text-lg font-bold text-emerald-400">
              {anchorMode.options.find(o => o.type === "OVULATION")?.accuracy || "±1 day"}
            </div>
            <div className="text-[10px] text-secondary mt-1">Ovulation confirmed</div>
          </div>
        </div>

        {/* Why it matters */}
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
          <div className="text-sm font-medium text-primary mb-2">Why Does This Matter?</div>
          <ul className="space-y-2 text-xs text-secondary">
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">•</span>
              <span>
                <strong className="text-primary">Better preparation:</strong> Know exactly when to
                have supplies ready and your {birth.process.toLowerCase()} area prepared.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">•</span>
              <span>
                <strong className="text-primary">Veterinary scheduling:</strong> Schedule wellness
                checks and be ready for any complications.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">•</span>
              <span>
                <strong className="text-primary">Buyer communication:</strong> Provide more accurate
                availability dates to prospective buyers.
              </span>
            </li>
          </ul>
        </div>

        {/* Testing guidance */}
        <div className="rounded-lg border border-purple-500/40 bg-purple-500/10 p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-primary mb-1">Testing Protocol</div>
              <p className="text-xs text-secondary leading-relaxed">
                {ovulation.testingGuidance}
              </p>
              {confirmationMethods.length > 1 && (
                <div className="mt-2 text-[10px] text-secondary">
                  <span className="font-medium">Available methods:</span> {confirmationMethods.join(", ")}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </WizardStep>
  );
}
