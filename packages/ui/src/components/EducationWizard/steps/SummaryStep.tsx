/**
 * SummaryStep Component
 *
 * Final recap step with key takeaways and action items.
 */

import * as React from "react";
import { WizardStep } from "../WizardStep";
import { getSpeciesTerminology, type SpeciesCode } from "../../../utils/speciesTerminology";

export interface SummaryStepProps {
  species: SpeciesCode;
}

export function SummaryStep({ species }: SummaryStepProps) {
  const terminology = getSpeciesTerminology(species);
  const { anchorMode, cycle, birth } = terminology;

  const defaultOption = anchorMode.options.find(o => o.type === anchorMode.defaultAnchor);
  const recommendedOption = anchorMode.options.find(o => o.recommended);

  return (
    <WizardStep
      title="You're All Set!"
      subtitle="Key takeaways for accurate breeding predictions"
    >
      <div className="space-y-4">
        {/* Success banner */}
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="text-sm font-medium text-emerald-400">
            You now understand how anchor modes work!
          </div>
        </div>

        {/* Key takeaways */}
        <div className="rounded-lg border border-hairline bg-surface p-4">
          <div className="text-sm font-medium text-primary mb-3">Key Takeaways</div>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-xs text-secondary">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">1</span>
              <span>
                <strong className="text-primary">Start with {defaultOption?.label || cycle.startLabelCap}</strong> -
                this is the default anchor mode for {species.toLowerCase()} breeding plans.
              </span>
            </li>

            {anchorMode.supportsUpgrade && (
              <li className="flex items-start gap-2 text-xs text-secondary">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">2</span>
                <span>
                  <strong className="text-primary">Upgrade when possible</strong> -
                  if you can confirm ovulation, upgrade your plan to get {recommendedOption?.accuracy || "better"} accuracy.
                </span>
              </li>
            )}

            <li className="flex items-start gap-2 text-xs text-secondary">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
                {anchorMode.supportsUpgrade ? "3" : "2"}
              </span>
              <span>
                <strong className="text-primary">Better data = better predictions</strong> -
                the more accurate your anchor date, the more accurate your {birth.process.toLowerCase()} prediction.
              </span>
            </li>
          </ul>
        </div>

        {/* Quick reference */}
        <div className="rounded-lg border border-purple-500/40 bg-purple-500/10 p-4">
          <div className="text-sm font-medium text-primary mb-2">Your Species Summary</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-secondary">Default Anchor:</div>
            <div className="text-primary font-medium">{defaultOption?.label || "N/A"}</div>

            <div className="text-secondary">Best Accuracy:</div>
            <div className="text-primary font-medium">{recommendedOption?.accuracy || "N/A"}</div>

            {anchorMode.testingAvailable && (
              <>
                <div className="text-secondary">Testing Available:</div>
                <div className="text-emerald-400 font-medium">Yes</div>
              </>
            )}

            {anchorMode.isInducedOvulator && (
              <>
                <div className="text-secondary">Ovulation Type:</div>
                <div className="text-purple-400 font-medium">Induced</div>
              </>
            )}
          </div>
        </div>

        {/* Final note */}
        <div className="flex items-start gap-2 text-xs text-secondary">
          <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            You can always access this information by clicking the help icon next to your breeding plan's
            cycle settings.
          </span>
        </div>
      </div>
    </WizardStep>
  );
}
