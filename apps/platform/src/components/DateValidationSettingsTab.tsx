// apps/platform/src/components/DateValidationSettingsTab.tsx
// Settings tab for configuring breeding date validation rules

import React from "react";
import { Button, Card, SectionCard } from "@bhq/ui";
import type {
  DateValidationConfig,
  SpeciesBiologyRules,
  SpeciesCode,
} from "@bhq/ui/utils/dateValidation";
import {
  DEFAULT_VALIDATION_CONFIG,
  SPECIES_BIOLOGY_DEFAULTS,
  getValidationConfig,
  fetchValidationConfig,
  saveValidationConfig,
} from "@bhq/ui/utils/dateValidation";
import { resolveTenantId } from "@bhq/ui/utils/tenant";

// ============================================================================
// Types
// ============================================================================

export type DateValidationSettingsHandle = {
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

const BIOLOGY_FIELD_LABELS: Record<keyof SpeciesBiologyRules, { label: string; unit: string; hint?: string }> = {
  gestationMinDays: { label: "Gestation Min", unit: "days", hint: "Minimum expected gestation period" },
  gestationTypicalDays: { label: "Gestation Typical", unit: "days", hint: "Typical gestation period" },
  gestationMaxDays: { label: "Gestation Max", unit: "days", hint: "Maximum expected gestation period" },
  cycleToBreedingMinDays: { label: "Cycle to Breeding Min", unit: "days", hint: "Minimum days from cycle start to breeding" },
  cycleToBreedingMaxDays: { label: "Cycle to Breeding Max", unit: "days", hint: "Maximum days from cycle start to breeding" },
  birthToWeaningMinDays: { label: "Weaning Min Age", unit: "days", hint: "Minimum age at weaning" },
  birthToWeaningTypicalDays: { label: "Weaning Typical Age", unit: "days", hint: "Typical age at weaning" },
  birthToPlacementMinDays: { label: "Placement Min Age", unit: "days", hint: "Minimum age for placement" },
  birthToPlacementTypicalDays: { label: "Placement Typical Age", unit: "days", hint: "Typical age for placement" },
  femaleMinBreedingAgeMonths: { label: "Female Min Breeding Age", unit: "months", hint: "Minimum age for female to breed" },
  femaleMaxBreedingAgeYears: { label: "Female Max Breeding Age", unit: "years", hint: "Maximum age recommendation" },
  postpartumRecoveryMinDays: { label: "Postpartum Recovery", unit: "days", hint: "Minimum recovery between litters" },
  maxLifetimeLitters: { label: "Max Lifetime Litters", unit: "litters", hint: "Maximum recommended litters" },
  minCyclesBetweenLitters: { label: "Min Cycles Between", unit: "cycles", hint: "Minimum heat cycles to skip" },
};

// ============================================================================
// Helpers
// ============================================================================

async function resolveTenantIdSafe(): Promise<string | null> {
  try {
    const raw = await resolveTenantId();
    const trimmed = (raw == null ? "" : String(raw)).trim();
    return trimmed || null;
  } catch {
    return null;
  }
}

// ============================================================================
// Sub-components
// ============================================================================

function NumberInput({
  value,
  onChange,
  min = 0,
  max,
  disabled,
  className = "",
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
      min={min}
      max={max}
      disabled={disabled}
      className={`w-20 px-2 py-1 text-sm rounded border border-hairline bg-surface focus:outline-none focus:ring-1 focus:ring-brand-orange disabled:opacity-50 ${className}`}
    />
  );
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <label className={`flex items-start gap-2 cursor-pointer ${disabled ? "opacity-50" : ""}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="mt-1"
      />
      <div>
        <span className="text-sm">{label}</span>
        {hint && <div className="text-xs text-secondary">{hint}</div>}
      </div>
    </label>
  );
}

function BiologyRulesEditor({
  species,
  rules,
  defaults,
  onChange,
  onReset,
}: {
  species: SpeciesCode;
  rules: Partial<SpeciesBiologyRules>;
  defaults: SpeciesBiologyRules;
  onChange: (field: keyof SpeciesBiologyRules, value: number) => void;
  onReset: () => void;
}) {
  const getValue = (field: keyof SpeciesBiologyRules): number => {
    return rules[field] ?? defaults[field];
  };

  const isModified = (field: keyof SpeciesBiologyRules): boolean => {
    return rules[field] !== undefined && rules[field] !== defaults[field];
  };

  const fields = Object.keys(BIOLOGY_FIELD_LABELS) as Array<keyof SpeciesBiologyRules>;

  // Group fields by category
  const gestationFields = fields.filter((f) => f.startsWith("gestation"));
  const breedingFields = fields.filter((f) => f.startsWith("cycleTo"));
  const weaningFields = fields.filter((f) => f.startsWith("birthToWeaning"));
  const placementFields = fields.filter((f) => f.startsWith("birthToPlacement"));
  const femaleFields = fields.filter((f) => f.startsWith("female"));
  const recoveryFields = fields.filter((f) => f.startsWith("postpartum") || f.startsWith("max") || f.startsWith("min"));

  const renderFieldGroup = (title: string, groupFields: Array<keyof SpeciesBiologyRules>) => (
    <div className="space-y-2">
      <div className="text-xs font-medium text-secondary uppercase tracking-wide">{title}</div>
      {groupFields.map((field) => {
        const meta = BIOLOGY_FIELD_LABELS[field];
        const modified = isModified(field);
        return (
          <div key={field} className="flex items-center gap-2">
            <div className="flex-1 text-sm">
              {meta.label}
              {modified && <span className="text-brand-orange ml-1">*</span>}
            </div>
            <NumberInput
              value={getValue(field)}
              onChange={(v) => onChange(field, v)}
            />
            <span className="text-xs text-secondary w-12">{meta.unit}</span>
          </div>
        );
      })}
    </div>
  );

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">{SPECIES_OPTIONS.find((s) => s.value === species)?.label} Biology Rules</div>
          <div className="text-xs text-secondary">Customize validation thresholds for this species</div>
        </div>
        <Button size="sm" variant="ghost" onClick={onReset}>
          Reset to Defaults
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {renderFieldGroup("Gestation", gestationFields)}
        {renderFieldGroup("Breeding Window", breedingFields)}
        {renderFieldGroup("Weaning", weaningFields)}
        {renderFieldGroup("Placement", placementFields)}
        {renderFieldGroup("Female Age", femaleFields)}
        {renderFieldGroup("Recovery & Limits", recoveryFields)}
      </div>

      <div className="text-xs text-secondary">
        Fields marked with <span className="text-brand-orange">*</span> have been modified from species defaults.
      </div>
    </Card>
  );
}

// ============================================================================
// Main Component
// ============================================================================

const DateValidationSettingsTab = React.forwardRef<DateValidationSettingsHandle, Props>(
  function DateValidationSettingsTabImpl({ onDirty }, ref) {
    // State
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string>("");
    const [initial, setInitial] = React.useState<DateValidationConfig>(DEFAULT_VALIDATION_CONFIG);
    const [form, setForm] = React.useState<DateValidationConfig>(DEFAULT_VALIDATION_CONFIG);
    const [selectedSpecies, setSelectedSpecies] = React.useState<SpeciesCode>("DOG");

    // Dirty tracking
    const isDirty = React.useMemo(
      () => JSON.stringify(form) !== JSON.stringify(initial),
      [form, initial]
    );
    React.useEffect(() => onDirty(isDirty), [isDirty, onDirty]);

    // Load config on mount
    React.useEffect(() => {
      let ignore = false;
      (async () => {
        try {
          setLoading(true);
          setError("");
          const tenantId = await resolveTenantIdSafe();
          if (!tenantId) throw new Error("Missing tenant id");
          const config = await fetchValidationConfig(tenantId);
          if (!ignore) {
            setInitial(config);
            setForm(config);
          }
        } catch (e: any) {
          if (!ignore) setError(e?.message || "Failed to load validation settings");
        } finally {
          if (!ignore) setLoading(false);
        }
      })();
      return () => {
        ignore = true;
      };
    }, []);

    // Save handler
    async function saveAll() {
      setError("");
      try {
        const tenantId = await resolveTenantIdSafe();
        if (!tenantId) throw new Error("Missing tenant id");
        const saved = await saveValidationConfig(form, tenantId);
        setInitial(saved);
        setForm(saved);
        onDirty(false);
      } catch (e: any) {
        setError(e?.message || "Failed to save validation settings");
      }
    }

    React.useImperativeHandle(ref, () => ({
      async save() {
        await saveAll();
      },
    }));

    // Update helpers
    const updateForm = <K extends keyof DateValidationConfig>(key: K, value: DateValidationConfig[K]) => {
      setForm((f) => ({ ...f, [key]: value }));
    };

    const updateSequenceRule = <K extends keyof DateValidationConfig["sequenceRules"]>(
      key: K,
      value: DateValidationConfig["sequenceRules"][K]
    ) => {
      setForm((f) => ({
        ...f,
        sequenceRules: { ...f.sequenceRules, [key]: value },
      }));
    };

    const updateBusinessRule = <K extends keyof DateValidationConfig["businessRules"]>(
      key: K,
      value: DateValidationConfig["businessRules"][K]
    ) => {
      setForm((f) => ({
        ...f,
        businessRules: { ...f.businessRules, [key]: value },
      }));
    };

    const updateSpeciesOverride = (field: keyof SpeciesBiologyRules, value: number) => {
      setForm((f) => ({
        ...f,
        speciesOverrides: {
          ...f.speciesOverrides,
          [selectedSpecies]: {
            ...(f.speciesOverrides[selectedSpecies] || {}),
            [field]: value,
          },
        },
      }));
    };

    const resetSpeciesOverrides = () => {
      setForm((f) => {
        const next = { ...f.speciesOverrides };
        delete next[selectedSpecies];
        return { ...f, speciesOverrides: next };
      });
    };

    if (loading) {
      return (
        <SectionCard title={<>Date Validation Rules<div className="text-xs text-secondary font-normal mt-0.5">Configure validation for breeding plan dates</div></>}>
          <div className="text-sm text-secondary">Loading...</div>
        </SectionCard>
      );
    }

    return (
      <div className="space-y-6">
        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Master Toggles */}
        <SectionCard
          title={<>Validation Settings<div className="text-xs text-secondary font-normal mt-0.5">Control which validation rules are active when entering breeding plan dates</div></>}
        >
          <Card className="p-4 space-y-4">
            <div className="text-sm font-medium">Master Toggles</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Toggle
                checked={form.enableSequenceValidation}
                onChange={(v) => updateForm("enableSequenceValidation", v)}
                label="Sequence Validation"
                hint="Block dates that violate milestone order (e.g., birth before breeding)"
              />
              <Toggle
                checked={form.enableBiologyWarnings}
                onChange={(v) => updateForm("enableBiologyWarnings", v)}
                label="Biology Warnings"
                hint="Warn about biologically improbable dates (e.g., short gestation)"
              />
              <Toggle
                checked={form.enableBusinessWarnings}
                onChange={(v) => updateForm("enableBusinessWarnings", v)}
                label="Business Warnings"
                hint="Warn about operational concerns (e.g., dates too far in future)"
              />
            </div>
          </Card>
        </SectionCard>

        {/* Sequence Rules */}
        <SectionCard
          title={<>Sequence Rules<div className="text-xs text-secondary font-normal mt-0.5">Hard blocks that prevent impossible date combinations</div></>}
        >
          <Card className="p-4 space-y-4">
            <Toggle
              checked={form.sequenceRules.enforceSequenceOrder}
              onChange={(v) => updateSequenceRule("enforceSequenceOrder", v)}
              label="Enforce Milestone Order"
              hint="Prevent entering dates out of sequence (e.g., placement before birth)"
              disabled={!form.enableSequenceValidation}
            />
            <Toggle
              checked={form.sequenceRules.requirePriorMilestone}
              onChange={(v) => updateSequenceRule("requirePriorMilestone", v)}
              label="Require Prior Milestone"
              hint="Require previous milestone actual date before entering the next"
              disabled={!form.enableSequenceValidation}
            />
            <Toggle
              checked={form.sequenceRules.allowFutureActuals}
              onChange={(v) => updateSequenceRule("allowFutureActuals", v)}
              label="Allow Future Actual Dates"
              hint="Allow actual dates to be in the future (not recommended)"
              disabled={!form.enableSequenceValidation}
            />
          </Card>
        </SectionCard>

        {/* Business Rules */}
        <SectionCard
          title={<>Business Rules<div className="text-xs text-secondary font-normal mt-0.5">Soft warnings for operational concerns</div></>}
        >
          <Card className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm">Maximum Plan Duration</div>
                <div className="flex items-center gap-2">
                  <NumberInput
                    value={form.businessRules.maxPlanDurationMonths}
                    onChange={(v) => updateBusinessRule("maxPlanDurationMonths", v)}
                    min={1}
                    max={60}
                    disabled={!form.enableBusinessWarnings}
                  />
                  <span className="text-xs text-secondary">months</span>
                </div>
                <div className="text-xs text-secondary">Warn if plan spans longer than this</div>
              </div>

              <div className="space-y-2">
                <div className="text-sm">Maximum Future Cycle Start</div>
                <div className="flex items-center gap-2">
                  <NumberInput
                    value={form.businessRules.maxFutureCycleStartMonths}
                    onChange={(v) => updateBusinessRule("maxFutureCycleStartMonths", v)}
                    min={1}
                    max={36}
                    disabled={!form.enableBusinessWarnings}
                  />
                  <span className="text-xs text-secondary">months ahead</span>
                </div>
                <div className="text-xs text-secondary">Warn if cycle start is too far in the future</div>
              </div>

              <div className="space-y-2">
                <div className="text-sm">Maximum Past Cycle Start</div>
                <div className="flex items-center gap-2">
                  <NumberInput
                    value={form.businessRules.maxPastCycleStartMonths}
                    onChange={(v) => updateBusinessRule("maxPastCycleStartMonths", v)}
                    min={1}
                    max={60}
                    disabled={!form.enableBusinessWarnings}
                  />
                  <span className="text-xs text-secondary">months ago</span>
                </div>
                <div className="text-xs text-secondary">Warn if cycle start is too far in the past</div>
              </div>
            </div>

            <div className="border-t border-hairline pt-4 space-y-3">
              <Toggle
                checked={form.businessRules.requireBreedingBeforeDeposits}
                onChange={(v) => updateBusinessRule("requireBreedingBeforeDeposits", v)}
                label="Warn on Deposits Without Breeding"
                hint="Warn if deposits are recorded but no breeding date exists"
                disabled={!form.enableBusinessWarnings}
              />
              <Toggle
                checked={form.businessRules.warnOnMissingIntermediateActuals}
                onChange={(v) => updateBusinessRule("warnOnMissingIntermediateActuals", v)}
                label="Warn on Skipped Milestones"
                hint="Warn if actual dates skip intermediate milestones"
                disabled={!form.enableBusinessWarnings}
              />
            </div>
          </Card>
        </SectionCard>

        {/* Info Box */}
        <Card className="p-4 bg-blue-500/10 border-blue-500/30">
          <div className="text-sm font-medium text-blue-300 mb-2">How Validation Works</div>
          <ul className="text-xs text-blue-200 space-y-1 list-disc list-inside">
            <li>
              <strong>Sequence Validation</strong> (hard blocks): Prevents saving dates that are logically impossible (e.g., birth before breeding)
            </li>
            <li>
              <strong>Biology Warnings</strong> (soft): Alerts about improbable dates but allows override with confirmation (e.g., unusually short gestation)
            </li>
            <li>
              <strong>Business Warnings</strong> (soft): Highlights operational concerns that may need attention (e.g., plan duration too long)
            </li>
            <li>
              When a user overrides a warning, it's logged for audit purposes
            </li>
            <li>
              <strong>Note:</strong> To view or understand the biology constants used for date calculations, see the <strong>Biology & Calculations</strong> tab
            </li>
          </ul>
        </Card>
      </div>
    );
  }
);

export { DateValidationSettingsTab };
export default DateValidationSettingsTab;
