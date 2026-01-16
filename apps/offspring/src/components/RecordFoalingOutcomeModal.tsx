// apps/offspring/src/components/RecordFoalingOutcomeModal.tsx
// Modal for recording comprehensive foaling outcome data for horses

import * as React from "react";
import ReactDOM from "react-dom";
import {
  X,
  Heart,
  AlertTriangle,
  Stethoscope,
  Clock,
  Baby,
  Calendar,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button, DatePicker } from "@bhq/ui";
import type {
  FoalingOutcomeInput,
  FoalingOutcome,
  MarePostFoalingCondition,
  OffspringApi,
} from "../api";

const MODAL_Z = 2147485000;

const inputClass =
  "w-full h-9 rounded-md border border-hairline bg-surface px-3 text-sm text-primary " +
  "placeholder:text-secondary/80 focus:outline-none focus:ring-1 focus:ring-[hsl(var(--brand-orange))] " +
  "focus:border-[hsl(var(--brand-orange))] shadow-[inset_0_0_0_9999px_rgba(255,255,255,0.02)]";

const labelClass = "text-xs text-secondary";

const MARE_CONDITIONS: { value: MarePostFoalingCondition; label: string; color: string }[] = [
  { value: "EXCELLENT", label: "Excellent", color: "text-emerald-400" },
  { value: "GOOD", label: "Good", color: "text-green-400" },
  { value: "FAIR", label: "Fair", color: "text-amber-400" },
  { value: "POOR", label: "Poor", color: "text-orange-400" },
  { value: "VETERINARY_CARE_REQUIRED", label: "Vet Care Required", color: "text-red-400" },
];

type RecordFoalingOutcomeModalProps = {
  open: boolean;
  onClose: () => void;
  planId: number;
  damName?: string | null;
  birthDate?: string | null;
  existingOutcome?: FoalingOutcome | null;
  api: OffspringApi | null;
  onSuccess: () => void;
};

export function RecordFoalingOutcomeModal({
  open,
  onClose,
  planId,
  damName,
  birthDate,
  existingOutcome,
  api,
  onSuccess,
}: RecordFoalingOutcomeModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const panelRef = React.useRef<HTMLDivElement | null>(null);

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

  // Reset form when modal opens with existing data
  React.useEffect(() => {
    if (open) {
      if (existingOutcome) {
        setForm({
          hadComplications: existingOutcome.hadComplications ?? false,
          complicationDetails: existingOutcome.complicationDetails ?? null,
          veterinarianCalled: existingOutcome.veterinarianCalled ?? false,
          veterinarianName: existingOutcome.veterinarianName ?? null,
          veterinarianNotes: existingOutcome.veterinarianNotes ?? null,
          placentaPassed: existingOutcome.placentaPassed ?? null,
          placentaPassedMinutes: existingOutcome.placentaPassedMinutes ?? null,
          mareCondition: existingOutcome.mareCondition ?? null,
          postFoalingHeatDate: existingOutcome.postFoalingHeatDate ?? null,
          postFoalingHeatNotes: existingOutcome.postFoalingHeatNotes ?? null,
          readyForRebreeding: existingOutcome.readyForRebreeding ?? false,
          rebredDate: existingOutcome.rebredDate ?? null,
        });
      } else {
        setForm({
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
      }
      setError(null);
    }
  }, [open, existingOutcome]);

  // Lock body scroll when open
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [open]);

  const handleChange = <K extends keyof FoalingOutcomeInput>(
    key: K,
    value: FoalingOutcomeInput[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!api || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await api.breeding.addFoalingOutcome(planId, form);
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err?.message || "Failed to record foaling outcome";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  const formattedBirthDate = birthDate
    ? new Date(birthDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const modalContent = (
    <div
      className="fixed inset-0"
      style={{ zIndex: MODAL_Z, isolation: "isolate" }}
      onMouseDown={(e) => {
        const panel = panelRef.current;
        if (!panel) return;
        if (!panel.contains(e.target as Node)) {
          if (!isSubmitting) onClose();
        }
      }}
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Centered panel */}
      <div className="absolute inset-0 flex items-center justify-center overflow-y-auto p-4">
        <div
          ref={panelRef}
          className="pointer-events-auto w-[720px] max-w-[95vw] max-h-[90vh] overflow-hidden rounded-xl border border-hairline bg-surface shadow-xl"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-hairline bg-emerald-500/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <Baby className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-lg font-semibold text-emerald-100">
                  Record Foaling Outcome
                </div>
                {damName && (
                  <div className="text-sm text-emerald-200/80">
                    {damName}
                    {formattedBirthDate && ` - Foaled ${formattedBirthDate}`}
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5 text-secondary" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit}>
            <div className="p-5 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {/* Critical Post-Foaling Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-300 uppercase tracking-wide">
                  <Clock className="h-4 w-4" />
                  Critical Post-Foaling Checks
                </div>

                {/* Placenta */}
                <div className="border border-hairline rounded-lg p-4 space-y-3">
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
                <div className="border border-hairline rounded-lg p-4 space-y-3">
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

              {/* Complications Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-rose-300 uppercase tracking-wide">
                  <AlertTriangle className="h-4 w-4" />
                  Complications
                </div>

                <div className="border border-hairline rounded-lg p-4 space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-hairline bg-surface accent-rose-500"
                      checked={form.hadComplications}
                      onChange={(e) =>
                        handleChange("hadComplications", e.currentTarget.checked)
                      }
                    />
                    <span className="text-sm">
                      Foaling had complications
                    </span>
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
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-300 uppercase tracking-wide">
                  <Stethoscope className="h-4 w-4" />
                  Veterinary Care
                </div>

                <div className="border border-hairline rounded-lg p-4 space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-hairline bg-surface accent-blue-500"
                      checked={form.veterinarianCalled}
                      onChange={(e) =>
                        handleChange("veterinarianCalled", e.currentTarget.checked)
                      }
                    />
                    <span className="text-sm">
                      Veterinarian was called / present
                    </span>
                  </label>

                  {form.veterinarianCalled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                      <label className="grid gap-1.5 md:col-span-2">
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
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-purple-300 uppercase tracking-wide">
                  <Heart className="h-4 w-4" />
                  Post-Foaling Reproductive Cycle
                </div>

                <div className="border border-hairline rounded-lg p-4 space-y-4">
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
                      <span className="text-sm">
                        Mare is ready for rebreeding
                      </span>
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

              {/* Error display */}
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-300">
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-hairline">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={isSubmitting}
                type="button"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={isSubmitting}
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting
                  ? "Saving..."
                  : existingOutcome
                    ? "Update Outcome"
                    : "Save Outcome"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}

export default RecordFoalingOutcomeModal;
