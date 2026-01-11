// packages/ui/src/components/GeneticsEmptyState/GeneticsEmptyState.tsx
import * as React from "react";
import { Button } from "../Button/Button";
import { Dna, Upload, PenLine, Palette, Heart, Sparkles, ChevronRight, ExternalLink } from "lucide-react";

export interface GeneticsEmptyStateProps {
  /** Animal name */
  animalName: string;
  /** Animal species for relevant messaging */
  species: "DOG" | "CAT" | "HORSE" | "OTHER";
  /** Handler for "Import from Lab" action */
  onImportClick: () => void;
  /** Handler for "Add Results Manually" action */
  onManualAddClick: () => void;
  /** Whether import is available for this species */
  importAvailable?: boolean;
}

const SPECIES_INFO = {
  DOG: {
    labs: ["Embark", "Wisdom Panel", "UC Davis VGL", "Paw Print Genetics"],
    commonTests: ["Coat color", "Health screening", "Breed composition"],
    tip: "Most comprehensive DNA tests include both health markers and coat color genetics.",
  },
  CAT: {
    labs: ["Wisdom Panel", "Basepaws", "UC Davis VGL", "Optimal Selection"],
    commonTests: ["PKD", "HCM", "Blood type", "Coat genetics"],
    tip: "Blood type testing is especially important for breeding to prevent neonatal isoerythrolysis.",
  },
  HORSE: {
    labs: ["UC Davis VGL", "Animal Genetics", "Etalon Diagnostics"],
    commonTests: ["HYPP", "PSSM", "Color genetics", "Parentage"],
    tip: "Color testing helps predict foal colors and identify hidden dilution genes.",
  },
  OTHER: {
    labs: ["Various specialty labs"],
    commonTests: ["Species-specific tests"],
    tip: "Contact your breed registry for recommended testing protocols.",
  },
};

export function GeneticsEmptyState({
  animalName,
  species,
  onImportClick,
  onManualAddClick,
  importAvailable = true,
}: GeneticsEmptyStateProps) {
  const info = SPECIES_INFO[species] || SPECIES_INFO.OTHER;

  return (
    <div className="space-y-6">
      {/* Main empty state */}
      <div className="text-center py-8 px-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 flex items-center justify-center">
          <Dna className="w-8 h-8 text-purple-600 dark:text-purple-400" />
        </div>
        <h3 className="text-lg font-medium mb-2">No genetic data yet</h3>
        <p className="text-secondary max-w-md mx-auto">
          Add genetic test results for <strong>{animalName}</strong> to track health markers,
          coat color genetics, and more.
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {importAvailable && (
          <Button onClick={onImportClick} className="gap-2">
            <Upload className="w-4 h-4" />
            Import from Lab
          </Button>
        )}
        <Button variant="outline" onClick={onManualAddClick} className="gap-2">
          <PenLine className="w-4 h-4" />
          Add Results Manually
        </Button>
      </div>

      {/* Educational content */}
      <div className="mt-8 pt-8 border-t border-hairline">
        <div className="grid md:grid-cols-2 gap-6">
          {/* What you can track */}
          <div className="p-4 bg-surface-alt rounded-lg">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand" />
              What you can track
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <Palette className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                <span><strong>Coat Color & Type</strong> - Predict offspring colors and coat patterns</span>
              </li>
              <li className="flex items-start gap-2">
                <Heart className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span><strong>Health Markers</strong> - Track genetic disease carrier status</span>
              </li>
              <li className="flex items-start gap-2">
                <Dna className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <span><strong>Physical Traits</strong> - Size, tail, dewclaws, and more</span>
              </li>
            </ul>
          </div>

          {/* Getting started tips */}
          <div className="p-4 bg-surface-alt rounded-lg">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-brand" />
              Getting started
            </h4>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-secondary mb-1">Popular testing labs:</p>
                <div className="flex flex-wrap gap-1">
                  {info.labs.map((lab) => (
                    <span
                      key={lab}
                      className="px-2 py-0.5 bg-surface rounded text-xs"
                    >
                      {lab}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-secondary mb-1">Common tests:</p>
                <div className="flex flex-wrap gap-1">
                  {info.commonTests.map((test) => (
                    <span
                      key={test}
                      className="px-2 py-0.5 bg-surface rounded text-xs"
                    >
                      {test}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pro tip */}
        <div className="mt-4 p-3 bg-surface-alt border border-hairline rounded-lg">
          <p className="text-sm text-secondary">
            <span className="text-brand font-medium">Tip:</span> {info.tip}
          </p>
        </div>
      </div>

      {/* Already have results? */}
      <div className="text-center text-sm text-secondary pt-4">
        <p>
          Have a paper certificate or PDF?{" "}
          <button
            onClick={onManualAddClick}
            className="text-brand hover:underline"
          >
            Enter results manually
          </button>
        </p>
      </div>
    </div>
  );
}
