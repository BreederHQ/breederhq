/**
 * WelcomeStep Component
 *
 * Introduction step explaining what anchor modes are and why they matter.
 */

import * as React from "react";
import { WizardStep } from "../WizardStep";
import { getSpeciesTerminology, type SpeciesCode } from "../../../utils/speciesTerminology";

export interface WelcomeStepProps {
  species: SpeciesCode;
}

export function WelcomeStep({ species }: WelcomeStepProps) {
  const terminology = getSpeciesTerminology(species);
  const birthProcess = terminology.birth.processCap;

  return (
    <WizardStep
      title="Welcome to Breeding Plan Timing"
      subtitle="Learn how to get the most accurate birth date predictions"
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
          <p className="text-sm text-primary leading-relaxed">
            Accurate <strong>{birthProcess.toLowerCase()}</strong> date predictions are essential for
            preparing your facilities, scheduling veterinary care, and coordinating with buyers.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-secondary leading-relaxed">
            BreederHQ uses an <strong className="text-primary">Anchor Mode</strong> system that
            calculates expected dates based on the most accurate information you have available.
          </p>

          <div className="rounded-lg bg-surface border border-hairline p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-primary mb-1">What is an Anchor Mode?</div>
                <p className="text-xs text-secondary leading-relaxed">
                  An anchor mode is the reference point used to calculate all expected dates in your
                  breeding plan. Different anchor modes offer different levels of accuracy.
                </p>
              </div>
            </div>
          </div>

          <p className="text-sm text-secondary leading-relaxed">
            In the next steps, we'll explain the available anchor modes for your species and help you
            understand which one will give you the best results.
          </p>
        </div>
      </div>
    </WizardStep>
  );
}
