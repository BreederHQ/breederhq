// apps/platform/src/components/BiologySettingsTab.tsx
// Settings tab for species biology constants that control breeding date calculations

import React from "react";
import { Card, SectionCard } from "@bhq/ui";
import type { SpeciesCode } from "@bhq/ui/utils/dateValidation";
import { SPECIES_BIOLOGY_DEFAULTS } from "@bhq/ui/utils/dateValidation";

// ============================================================================
// Types
// ============================================================================

export type BiologySettingsHandle = {
  save: () => Promise<void>;
};

type Props = {
  dirty: boolean;
  onDirty: (v: boolean) => void;
};

// ============================================================================
// Constants
// ============================================================================

const SPECIES_OPTIONS: Array<{ value: SpeciesCode; label: string }> = [
  { value: "DOG", label: "Dog" },
  { value: "CAT", label: "Cat" },
  { value: "HORSE", label: "Horse" },
  { value: "GOAT", label: "Goat" },
  { value: "RABBIT", label: "Rabbit" },
  { value: "SHEEP", label: "Sheep" },
];

// ============================================================================
// Main Component
// ============================================================================

const BiologySettingsTab = React.forwardRef<BiologySettingsHandle, Props>(
  function BiologySettingsTabImpl({ onDirty }, ref) {
    const [selectedSpecies, setSelectedSpecies] = React.useState<SpeciesCode>("DOG");

    React.useImperativeHandle(ref, () => ({
      async save() {
        // No-op for now - these are read-only system defaults
      },
    }));

    const biology = SPECIES_BIOLOGY_DEFAULTS[selectedSpecies] || SPECIES_BIOLOGY_DEFAULTS.DOG;

    return (
      <div className="space-y-6">
        {/* Consolidated Info Box */}
        <Card className="p-4 bg-blue-500/10 border-blue-500/30">
          <div className="text-sm font-medium text-blue-300 mb-3">About Biology & Calculation Constants</div>
          <div className="text-xs text-blue-200 space-y-3">
            <p>
              These values control <strong>how BreederHQ calculates expected dates</strong> for breeding, birth, weaning, and placement
              when you create a breeding plan. They are <strong>system defaults</strong> based on veterinary standards and industry best practices.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="flex gap-2">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/30 flex items-center justify-center text-xs font-bold">1</div>
                <div className="text-xs"><strong>Review</strong> the values used in your breeding plan calculations</div>
              </div>
              <div className="flex gap-2">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/30 flex items-center justify-center text-xs font-bold">2</div>
                <div className="text-xs"><strong>Verify</strong> your plan dates align with these standards</div>
              </div>
              <div className="flex gap-2">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/30 flex items-center justify-center text-xs font-bold">3</div>
                <div className="text-xs"><strong>Protect</strong> your female's health with proper recovery times</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Future Customization Note */}
        <Card className="p-4 bg-purple-500/10 border-purple-500/30">
          <div className="text-sm font-medium text-purple-300 mb-1">Coming Soon: Customization</div>
          <div className="text-xs text-purple-200">
            Future updates will allow breeding programs to customize these values to match their specific practices and breed standards.
          </div>
        </Card>

        {/* Species Selection */}
        <SectionCard
          title="Species Biology Constants"
          subtitle="View the calculation values used for each species"
        >
          <Card className="p-4 space-y-4">
            <div className="flex items-center gap-4">
              <div className="text-sm font-medium">Select Species:</div>
              <select
                value={selectedSpecies}
                onChange={(e) => setSelectedSpecies(e.target.value as SpeciesCode)}
                className="px-3 py-1.5 text-sm rounded border border-hairline bg-surface focus:outline-none focus:ring-1 focus:ring-brand-orange"
              >
                {SPECIES_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </Card>
        </SectionCard>

        {/* Gestation */}
        <SectionCard title="Gestation Period" subtitle="Pregnancy duration from breeding to birth">
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-secondary mb-1">Minimum</div>
                <div className="text-lg font-medium">{biology.gestationMinDays} days</div>
              </div>
              <div>
                <div className="text-xs text-secondary mb-1">Typical</div>
                <div className="text-lg font-medium text-brand-orange">{biology.gestationTypicalDays} days</div>
                <div className="text-xs text-secondary mt-1">Used for calculations</div>
              </div>
              <div>
                <div className="text-xs text-secondary mb-1">Maximum</div>
                <div className="text-lg font-medium">{biology.gestationMaxDays} days</div>
              </div>
            </div>
          </Card>
        </SectionCard>

        {/* Breeding Window */}
        <SectionCard title="Breeding Window" subtitle="Optimal timing for breeding from cycle/heat start">
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-secondary mb-1">Earliest (from cycle start)</div>
                <div className="text-lg font-medium">Day {biology.cycleToBreedingMinDays}</div>
              </div>
              <div>
                <div className="text-xs text-secondary mb-1">Latest (from cycle start)</div>
                <div className="text-lg font-medium">Day {biology.cycleToBreedingMaxDays}</div>
              </div>
            </div>
            <div className="mt-3 text-xs text-secondary">
              Breeding window timing varies by species. For dogs, ovulation is typically around day 12 from cycle start.
            </div>
          </Card>
        </SectionCard>

        {/* Weaning */}
        <SectionCard title="Weaning Age" subtitle="When offspring are typically weaned">
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-secondary mb-1">Minimum Age</div>
                <div className="text-lg font-medium">{biology.birthToWeaningMinDays} days ({Math.floor(biology.birthToWeaningMinDays / 7)} weeks)</div>
              </div>
              <div>
                <div className="text-xs text-secondary mb-1">Typical Age</div>
                <div className="text-lg font-medium text-brand-orange">{biology.birthToWeaningTypicalDays} days ({Math.floor(biology.birthToWeaningTypicalDays / 7)} weeks)</div>
                <div className="text-xs text-secondary mt-1">Used for calculations</div>
              </div>
            </div>
          </Card>
        </SectionCard>

        {/* Placement */}
        <SectionCard title="Placement Age" subtitle="When offspring can go to new homes">
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-secondary mb-1">Minimum Age (Legal/Ethical)</div>
                <div className="text-lg font-medium">{biology.birthToPlacementMinDays} days ({Math.floor(biology.birthToPlacementMinDays / 7)} weeks)</div>
                <div className="text-xs text-secondary mt-1">Enforced by most state regulations</div>
              </div>
              <div>
                <div className="text-xs text-secondary mb-1">Typical Age</div>
                <div className="text-lg font-medium text-brand-orange">{biology.birthToPlacementTypicalDays} days ({Math.floor(biology.birthToPlacementTypicalDays / 7)} weeks)</div>
                <div className="text-xs text-secondary mt-1">Used for calculations</div>
              </div>
            </div>
            <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded">
              <div className="text-xs text-amber-400">
                <strong>Note:</strong> Placement timing varies by species. The system calculates an extended placement window based on species-specific standards.
              </div>
            </div>
          </Card>
        </SectionCard>

        {/* Female Breeding Age */}
        <SectionCard title="Female Breeding Age" subtitle="Age recommendations for responsible breeding">
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-secondary mb-1">Minimum Breeding Age</div>
                <div className="text-lg font-medium">{biology.femaleMinBreedingAgeMonths} months</div>
              </div>
              <div>
                <div className="text-xs text-secondary mb-1">Maximum Breeding Age</div>
                <div className="text-lg font-medium">{biology.femaleMaxBreedingAgeYears} years</div>
              </div>
            </div>
          </Card>
        </SectionCard>

        {/* Recovery & Limits */}
        <SectionCard title="Recovery & Lifetime Limits" subtitle="Responsible breeding practices">
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-secondary mb-1">Postpartum Recovery</div>
                <div className="text-lg font-medium">{biology.postpartumRecoveryMinDays} days</div>
                <div className="text-xs text-secondary mt-1">Minimum rest between litters</div>
              </div>
              <div>
                <div className="text-xs text-secondary mb-1">Max Lifetime Litters</div>
                <div className="text-lg font-medium">{biology.maxLifetimeLitters} litters</div>
              </div>
              <div>
                <div className="text-xs text-secondary mb-1">Min Cycles to Skip</div>
                <div className="text-lg font-medium">{biology.minCyclesBetweenLitters} cycle(s)</div>
              </div>
            </div>
          </Card>
        </SectionCard>

      </div>
    );
  }
);

export { BiologySettingsTab };
export default BiologySettingsTab;
