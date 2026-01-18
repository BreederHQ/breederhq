/**
 * EducationWizard Component
 *
 * Multi-step wizard to educate breeders about the Ovulation Anchor Breeding System.
 * Adapts content based on species using the speciesTerminology system.
 */

import * as React from "react";
import { Dialog } from "../Dialog/Dialog";
import { Button } from "../Button/Button";
import { WizardProgress, type WizardStep as WizardStepType } from "./WizardProgress";
import { WelcomeStep } from "./steps/WelcomeStep";
import { AnchorModesStep } from "./steps/AnchorModesStep";
import { TestingBenefitsStep } from "./steps/TestingBenefitsStep";
import { UpgradePathStep } from "./steps/UpgradePathStep";
import { SpeciesGuidanceStep } from "./steps/SpeciesGuidanceStep";
import { SummaryStep } from "./steps/SummaryStep";
import { getSpeciesTerminology, type SpeciesCode } from "../../utils/speciesTerminology";

export interface EducationWizardProps {
  /** Whether the wizard is open */
  open: boolean;
  /** Called when the wizard should close */
  onClose: () => void;
  /** The species to show content for */
  species: SpeciesCode;
  /** Called when the user completes the wizard */
  onComplete?: () => void;
  /** Called when the user dismisses the wizard (don't show again) */
  onDismiss?: () => void;
}

// Step definitions
type StepKey = "welcome" | "anchors" | "testing" | "upgrade" | "species" | "summary";

interface Step {
  key: StepKey;
  label: string;
  shortLabel: string;
}

const ALL_STEPS: Step[] = [
  { key: "welcome", label: "Welcome", shortLabel: "Welcome" },
  { key: "anchors", label: "Anchor Modes", shortLabel: "Anchors" },
  { key: "testing", label: "Testing Benefits", shortLabel: "Testing" },
  { key: "upgrade", label: "Upgrade Path", shortLabel: "Upgrade" },
  { key: "species", label: "Species Guide", shortLabel: "Guide" },
  { key: "summary", label: "Summary", shortLabel: "Done" },
];

/**
 * Get the steps to show based on species characteristics.
 *
 * - DOG, HORSE (testable, supports upgrade): All 6 steps
 * - CAT, RABBIT, ALPACA, LLAMA (induced ovulators): Skip upgrade step (4)
 * - GOAT, SHEEP, PIG, CATTLE (observation-only): Skip testing (3) and upgrade (4) steps
 */
function getStepsForSpecies(species: SpeciesCode): Step[] {
  const terminology = getSpeciesTerminology(species);
  const { testingAvailable, supportsUpgrade, isInducedOvulator } = terminology.anchorMode;

  const steps = [...ALL_STEPS];

  // Filter based on species capabilities
  return steps.filter(step => {
    // Always show welcome, anchors, species, and summary
    if (["welcome", "anchors", "species", "summary"].includes(step.key)) {
      return true;
    }

    // Testing benefits: only show if testing is available
    if (step.key === "testing") {
      return testingAvailable;
    }

    // Upgrade path: only show if species supports upgrade (not induced ovulators, not observation-only)
    if (step.key === "upgrade") {
      return supportsUpgrade;
    }

    return true;
  });
}

export function EducationWizard({
  open,
  onClose,
  species,
  onComplete,
  onDismiss,
}: EducationWizardProps) {
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0);
  const [dontShowAgain, setDontShowAgain] = React.useState(false);

  // Get steps for this species
  const steps = React.useMemo(() => getStepsForSpecies(species), [species]);
  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  // Reset step when species changes or wizard opens
  React.useEffect(() => {
    if (open) {
      setCurrentStepIndex(0);
      setDontShowAgain(false);
    }
  }, [open, species]);

  const handleNext = () => {
    if (isLastStep) {
      // Complete the wizard
      if (dontShowAgain) {
        onDismiss?.();
      } else {
        onComplete?.();
      }
      onClose();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    if (dontShowAgain) {
      onDismiss?.();
    }
    onClose();
  };

  // Convert steps to progress format
  const progressSteps: WizardStepType[] = steps.map(s => ({
    key: s.key,
    label: s.label,
    shortLabel: s.shortLabel,
  }));

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep?.key) {
      case "welcome":
        return <WelcomeStep species={species} />;
      case "anchors":
        return <AnchorModesStep species={species} />;
      case "testing":
        return <TestingBenefitsStep species={species} />;
      case "upgrade":
        return <UpgradePathStep species={species} />;
      case "species":
        return <SpeciesGuidanceStep species={species} />;
      case "summary":
        return <SummaryStep species={species} />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Breeding Plan Timing" size="lg">
      <div className="flex flex-col min-h-[450px]">
        {/* Progress indicator */}
        <div className="px-2 pb-4 border-b border-hairline">
          <WizardProgress steps={progressSteps} currentStep={currentStepIndex} />
        </div>

        {/* Step content */}
        <div className="flex-1 p-4 overflow-y-auto">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="border-t border-hairline p-4">
          {/* Don't show again checkbox */}
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="dont-show-again"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded border-hairline bg-surface text-amber-500 focus:ring-amber-500 focus:ring-offset-0"
            />
            <label htmlFor="dont-show-again" className="text-xs text-secondary cursor-pointer">
              Don't show this guide again
            </label>
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between">
            <div>
              {isFirstStep ? (
                <Button variant="ghost" size="sm" onClick={handleSkip}>
                  Skip
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={handleBack}>
                  Back
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-secondary">
                Step {currentStepIndex + 1} of {steps.length}
              </span>
              <Button variant="primary" size="sm" onClick={handleNext}>
                {isLastStep ? "Got it!" : "Next"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
