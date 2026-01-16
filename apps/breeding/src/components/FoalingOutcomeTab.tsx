// apps/breeding/src/components/FoalingOutcomeTab.tsx
// Tab content for recording foaling outcome data (horse-specific)

import * as React from "react";
import {
  CheckCircle2,
  XCircle,
  Heart,
  AlertTriangle,
  Stethoscope,
  Clock,
  Baby,
} from "lucide-react";
import { Button, DatePicker } from "@bhq/ui";
import type { FoalingOutcome, FoalingOutcomeInput, MarePostFoalingCondition } from "../api";

const inputClass =
  "w-full h-9 rounded-md border border-hairline bg-surface px-3 text-sm text-primary " +
  "placeholder:text-secondary/80 focus:outline-none focus:ring-1 focus:ring-[hsl(var(--brand-orange))] " +
  "focus:border-[hsl(var(--brand-orange))] shadow-[inset_0_0_0_9999px_rgba(255,255,255,0.02)]";

const labelClass = "text-xs text-secondary";

const sectionClass = "rounded-lg border border-hairline bg-surface/50 p-4";

const MARE_CONDITIONS: { value: MarePostFoalingCondition; label: string; color: string }[] = [
  { value: "EXCELLENT", label: "Excellent", color: "text-emerald-400" },
  { value: "GOOD", label: "Good", color: "text-green-400" },
  { value: "FAIR", label: "Fair", color: "text-amber-400" },
  { value: "POOR", label: "Poor", color: "text-orange-400" },
  { value: "VETERINARY_CARE_REQUIRED", label: "Vet Care Required", color: "text-red-400" },
];

type FoalingOutcomeTabProps = {
  planId: number;
  damName?: string | null;
  birthDate?: string | null;
  outcome: FoalingOutcome | null;
  onSave: (data: FoalingOutcomeInput) => Promise<void>;
  isLoading?: boolean;
};

export function FoalingOutcomeTab({
  planId,
  damName,
  birthDate,
  outcome,
  onSave,
  isLoading = false,
}: FoalingOutcomeTabProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  // Form state
  const [form, setForm] = React.useState<FoalingOutcomeInput>({
    hadComplications: false,
    complicationDetails: null,
    veterinarianCalled: false,
    veterinarianName: null,
    veterinarianNotes: null,
    placentaPassed: null,
    placentaPassedMinutes: null,
    mareCondition: null,
    postFoalingHeatDate: null,
    postFoalingHeatNotes: null,
    readyForRebreeding: false,
    rebredDate: null,
  });

  // Load existing outcome data
  React.useEffect(() => {
    if (outcome) {
      setForm({
        hadComplications: outcome.hadComplications ?? false,
        complicationDetails: outcome.complicationDetails ?? null,
        veterinarianCalled: outcome.veterinarianCalled ?? false,
        veterinarianName: outcome.veterinarianName ?? null,
        veterinarianNotes: outcome.veterinarianNotes ?? null,
        placentaPassed: outcome.placentaPassed ?? null,
        placentaPassedMinutes: outcome.placentaPassedMinutes ?? null,
        mareCondition: outcome.mareCondition ?? null,
        postFoalingHeatDate: outcome.postFoalingHeatDate ?? null,
        postFoalingHeatNotes: outcome.postFoalingHeatNotes ?? null,
        readyForRebreeding: outcome.readyForRebreeding ?? false,
        rebredDate: outcome.rebredDate ?? null,
      });
    }
  }, [outcome]);

  const handleChange = <K extends keyof FoalingOutcomeInput>(
    key: K,
    value: FoalingOutcomeInput[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSuccessMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await onSave(form);
      setSuccessMessage("Foaling outcome saved successfully");
    } catch (err: any) {
      const msg = err?.message || "Failed to save foaling outcome";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If no birth date, show message
  if (!birthDate) {
    return (
      <div className={sectionClass}>
        <div className="text-center py-8">
          <Baby className="h-12 w-12 text-secondary mx-auto mb-4" />
          <p className="text-secondary">
            Birth date must be recorded before you can enter foaling outcome data.
          </p>
          <p className="text-xs text-secondary/70 mt-2">
            Record the actual birth date in the Dates tab first.
          </p>
        </div>
      </div>
    );
  }

  const formattedBirthDate = new Date(birthDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Header */}
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
        <div className="flex items-center gap-3">
          <Baby className="h-6 w-6 text-emerald-400" />
          <div>
            <h3 className="text-sm font-semibold text-emerald-100">
              Foaling Outcome for {damName || "Mare"}
            </h3>
            <p className="text-xs text-emerald-200/70">
              Foaled on {formattedBirthDate}
            </p>
          </div>
        </div>
      </div>

      {/* Critical Post-Foaling Section */}
      <div className={sectionClass}>
        <div className="flex items-center gap-2 mb-4 text-sm font-semibold">
          <Clock className="h-4 w-4 text-amber-400" />
          Critical Post-Foaling Checks
        </div>
        <div className="space-y-4">
          {/* Placenta */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Placenta Passed?
                <span className="text-xs text-amber-400 ml-2">
                  (Should pass within 3 hours)
                </span>
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleChange("placentaPassed", true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                    form.placentaPassed === true
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50"
                      : "bg-surface border border-hairline text-secondary hover:text-primary"
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => handleChange("placentaPassed", false)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                    form.placentaPassed === false
                      ? "bg-red-500/20 text-red-300 border border-red-500/50"
                      : "bg-surface border border-hairline text-secondary hover:text-primary"
                  }`}
                >
                  <XCircle className="h-4 w-4" />
                  No
                </button>
              </div>
            </div>

            {form.placentaPassed === true && (
              <label className="grid gap-1.5">
                <span className={labelClass}>
                  Time until placenta passed (minutes)
                </span>
                <input
                  type="number"
                  className={inputClass + " max-w-[200px]"}
                  value={form.placentaPassedMinutes ?? ""}
                  onChange={(e) =>
                    handleChange(
                      "placentaPassedMinutes",
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  placeholder="e.g., 45"
                  min={0}
                />
                {form.placentaPassedMinutes != null &&
                  form.placentaPassedMinutes > 180 && (
                    <span className="text-xs text-amber-400">
                      Placenta took longer than 3 hours - document in vet notes
                    </span>
                  )}
              </label>
            )}

            {form.placentaPassed === false && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-300">
                <AlertTriangle className="h-4 w-4 inline mr-2" />
                Retained placenta is an emergency. Contact your veterinarian immediately.
              </div>
            )}
          </div>

          {/* Mare Condition */}
          <div className="space-y-3 pt-4 border-t border-hairline">
            <label className="text-sm font-medium">Mare Post-Foaling Condition</label>
            <div className="flex flex-wrap gap-2">
              {MARE_CONDITIONS.map((cond) => (
                <button
                  key={cond.value}
                  type="button"
                  onClick={() => handleChange("mareCondition", cond.value)}
                  className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                    form.mareCondition === cond.value
                      ? `bg-white/10 ${cond.color} border border-current`
                      : "bg-surface border border-hairline text-secondary hover:text-primary"
                  }`}
                >
                  {cond.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Complications Section */}
      <div className={sectionClass}>
        <div className="flex items-center gap-2 mb-4 text-sm font-semibold">
          <AlertTriangle className="h-4 w-4 text-rose-400" />
          Complications
        </div>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-hairline bg-surface accent-rose-500"
              checked={form.hadComplications}
              onChange={(e) =>
                handleChange("hadComplications", e.currentTarget.checked)
              }
            />
            <span className="text-sm">Foaling had complications</span>
          </label>

          {form.hadComplications && (
            <label className="grid gap-1.5">
              <span className={labelClass}>Describe the complications</span>
              <textarea
                className={inputClass + " min-h-[80px] resize-y"}
                value={form.complicationDetails ?? ""}
                onChange={(e) =>
                  handleChange("complicationDetails", e.target.value || null)
                }
                placeholder="Dystocia, malpresentation, red bag delivery, etc."
              />
            </label>
          )}
        </div>
      </div>

      {/* Veterinarian Section */}
      <div className={sectionClass}>
        <div className="flex items-center gap-2 mb-4 text-sm font-semibold">
          <Stethoscope className="h-4 w-4 text-blue-400" />
          Veterinary Care
        </div>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-hairline bg-surface accent-blue-500"
              checked={form.veterinarianCalled}
              onChange={(e) =>
                handleChange("veterinarianCalled", e.currentTarget.checked)
              }
            />
            <span className="text-sm">Veterinarian was called / present</span>
          </label>

          {form.veterinarianCalled && (
            <div className="grid grid-cols-1 gap-4">
              <label className="grid gap-1.5">
                <span className={labelClass}>Veterinarian Name</span>
                <input
                  className={inputClass}
                  value={form.veterinarianName ?? ""}
                  onChange={(e) =>
                    handleChange("veterinarianName", e.target.value || null)
                  }
                  placeholder="Dr. Smith"
                />
              </label>

              <label className="grid gap-1.5">
                <span className={labelClass}>Veterinary Notes</span>
                <textarea
                  className={inputClass + " min-h-[80px] resize-y"}
                  value={form.veterinarianNotes ?? ""}
                  onChange={(e) =>
                    handleChange("veterinarianNotes", e.target.value || null)
                  }
                  placeholder="Treatment provided, observations, recommendations..."
                />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Post-Foaling Reproductive Cycle */}
      <div className={sectionClass}>
        <div className="flex items-center gap-2 mb-4 text-sm font-semibold">
          <Heart className="h-4 w-4 text-purple-400" />
          Post-Foaling Reproductive Cycle
        </div>
        <div className="space-y-4">
          <div className="text-xs text-secondary">
            Foal heat typically occurs 7-12 days after foaling. Track for breeding decisions.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="grid gap-1.5">
              <span className={labelClass}>Foal Heat Date</span>
              <DatePicker
                value={form.postFoalingHeatDate ?? ""}
                onChange={(e) =>
                  handleChange("postFoalingHeatDate", e.currentTarget.value || null)
                }
                inputClassName={inputClass}
              />
            </label>

            <label className="grid gap-1.5">
              <span className={labelClass}>Foal Heat Notes</span>
              <input
                className={inputClass}
                value={form.postFoalingHeatNotes ?? ""}
                onChange={(e) =>
                  handleChange("postFoalingHeatNotes", e.target.value || null)
                }
                placeholder="Heat intensity, behavior, etc."
              />
            </label>
          </div>

          <div className="border-t border-hairline pt-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-hairline bg-surface accent-purple-500"
                checked={form.readyForRebreeding}
                onChange={(e) =>
                  handleChange("readyForRebreeding", e.currentTarget.checked)
                }
              />
              <span className="text-sm">Mare is ready for rebreeding</span>
            </label>

            {form.readyForRebreeding && (
              <label className="grid gap-1.5 max-w-[200px]">
                <span className={labelClass}>Rebred Date</span>
                <DatePicker
                  value={form.rebredDate ?? ""}
                  onChange={(e) =>
                    handleChange("rebredDate", e.currentTarget.value || null)
                  }
                  inputClassName={inputClass}
                />
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Error/Success display */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-300">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-300">
          {successMessage}
        </div>
      )}

      {/* Save button */}
      <div className="flex justify-end pt-4">
        <Button
          variant="primary"
          size="sm"
          disabled={isSubmitting || isLoading}
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {isSubmitting ? "Saving..." : outcome ? "Update Outcome" : "Save Outcome"}
        </Button>
      </div>
    </form>
  );
}

export default FoalingOutcomeTab;
