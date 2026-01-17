// apps/breeding/src/components/RecordFoalingModal.tsx
// Modal for recording actual foaling (birth) event with foal details
// This transitions a breeding plan from PREGNANT → FOALED status

import * as React from "react";
import ReactDOM from "react-dom";
import {
  X,
  Baby,
  Plus,
  Trash2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Scale,
  Clock,
} from "lucide-react";
import { Button, DatePicker } from "@bhq/ui";

const MODAL_Z = 2147485000;

const inputClass =
  "w-full h-9 rounded-md border border-hairline bg-surface px-3 text-sm text-primary " +
  "placeholder:text-secondary/80 focus:outline-none focus:ring-1 focus:ring-[hsl(var(--brand-orange))] " +
  "focus:border-[hsl(var(--brand-orange))] shadow-[inset_0_0_0_9999px_rgba(255,255,255,0.02)]";

const labelClass = "text-xs text-secondary";

type FoalSex = "MALE" | "FEMALE" | "UNKNOWN";

type FoalHealthStatus =
  | "HEALTHY"
  | "MINOR_ISSUES"
  | "VETERINARY_CARE"
  | "CRITICAL";

type FoalNursingStatus =
  | "NURSING_WELL"
  | "ASSISTED"
  | "BOTTLE_FED"
  | "NOT_YET";

type FoalEntry = {
  id: string;
  sex: FoalSex;
  name: string;
  color: string;
  markings: string;
  birthWeight: string;
  healthStatus: FoalHealthStatus;
  nursingStatus: FoalNursingStatus;
  standingMinutes: string;
  nursingMinutes: string;
  notes: string;
};

const SEX_OPTIONS: { value: FoalSex; label: string; color: string }[] = [
  { value: "MALE", label: "Colt (Male)", color: "text-blue-400" },
  { value: "FEMALE", label: "Filly (Female)", color: "text-pink-400" },
  { value: "UNKNOWN", label: "Unknown", color: "text-secondary" },
];

const HEALTH_OPTIONS: { value: FoalHealthStatus; label: string; color: string }[] = [
  { value: "HEALTHY", label: "Healthy", color: "text-emerald-400" },
  { value: "MINOR_ISSUES", label: "Minor Issues", color: "text-amber-400" },
  { value: "VETERINARY_CARE", label: "Vet Care Needed", color: "text-orange-400" },
  { value: "CRITICAL", label: "Critical", color: "text-red-400" },
];

const NURSING_OPTIONS: { value: FoalNursingStatus; label: string }[] = [
  { value: "NURSING_WELL", label: "Nursing Well" },
  { value: "ASSISTED", label: "Assisted Nursing" },
  { value: "BOTTLE_FED", label: "Bottle Fed" },
  { value: "NOT_YET", label: "Not Yet Nursing" },
];

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function createEmptyFoal(): FoalEntry {
  return {
    id: generateId(),
    sex: "UNKNOWN",
    name: "",
    color: "",
    markings: "",
    birthWeight: "",
    healthStatus: "HEALTHY",
    nursingStatus: "NURSING_WELL",
    standingMinutes: "",
    nursingMinutes: "",
    notes: "",
  };
}

type RecordFoalingModalProps = {
  open: boolean;
  onClose: () => void;
  planId: number;
  damName?: string | null;
  sireName?: string | null;
  expectedBirthDate?: string | null;
  breedDateActual?: string | null;
  onSubmit: (data: {
    actualBirthDate: string;
    foals: Array<{ sex: "MALE" | "FEMALE"; color?: string; name?: string }>;
  }) => Promise<void>;
};

export function RecordFoalingModal({
  open,
  onClose,
  planId,
  damName,
  sireName,
  expectedBirthDate,
  breedDateActual,
  onSubmit,
}: RecordFoalingModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const panelRef = React.useRef<HTMLDivElement | null>(null);

  // Form state
  const [birthDate, setBirthDate] = React.useState("");
  const [birthTime, setBirthTime] = React.useState("");
  const [foals, setFoals] = React.useState<FoalEntry[]>([createEmptyFoal()]);

  // Reset form when modal opens
  React.useEffect(() => {
    if (open) {
      setBirthDate("");
      setBirthTime("");
      setFoals([createEmptyFoal()]);
      setError(null);
    }
  }, [open]);

  // Lock body scroll when open
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [open]);

  const addFoal = () => {
    setFoals((prev) => [...prev, createEmptyFoal()]);
  };

  const removeFoal = (id: string) => {
    setFoals((prev) => prev.filter((f) => f.id !== id));
  };

  const updateFoal = (id: string, updates: Partial<FoalEntry>) => {
    setFoals((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validation
    if (!birthDate) {
      setError("Birth date is required");
      return;
    }

    if (!breedDateActual) {
      setError("Cannot record foaling: breeding date has not been recorded on this plan");
      return;
    }

    // Build actual birth date (combine date + time if provided)
    let actualBirthDate = birthDate;
    if (birthTime) {
      actualBirthDate = `${birthDate}T${birthTime}:00`;
    }

    // Filter foals - only include those with sex selected (not UNKNOWN or that have been filled in)
    const validFoals = foals
      .filter((f) => f.sex !== "UNKNOWN" || f.name || f.color)
      .map((f) => ({
        sex: f.sex === "UNKNOWN" ? "FEMALE" : f.sex, // Default UNKNOWN to FEMALE for API
        color: f.color || undefined,
        name: f.name || undefined,
      }));

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        actualBirthDate,
        foals: validFoals as Array<{ sex: "MALE" | "FEMALE"; color?: string; name?: string }>,
      });
      onClose();
    } catch (err: any) {
      const msg = err?.message || "Failed to record foaling";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate gestation length if we have both dates
  const gestationDays = React.useMemo(() => {
    if (!breedDateActual || !birthDate) return null;
    const breed = new Date(breedDateActual);
    const birth = new Date(birthDate);
    const diffTime = birth.getTime() - breed.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [breedDateActual, birthDate]);

  // Calculate days early/late compared to expected
  const daysFromExpected = React.useMemo(() => {
    if (!expectedBirthDate || !birthDate) return null;
    const expected = new Date(expectedBirthDate);
    const actual = new Date(birthDate);
    const diffTime = expected.getTime() - actual.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }, [expectedBirthDate, birthDate]);

  if (!open) return null;

  const formattedExpected = expectedBirthDate
    ? new Date(expectedBirthDate).toLocaleDateString("en-US", {
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
          className="pointer-events-auto w-[800px] max-w-[95vw] max-h-[90vh] overflow-hidden rounded-xl border border-hairline bg-surface shadow-xl"
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
                  Record Foaling
                </div>
                <div className="text-sm text-emerald-200/80">
                  {damName || "Mare"}
                  {sireName && ` × ${sireName}`}
                </div>
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
              {/* No breeding date warning */}
              {!breedDateActual && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-300">
                        Breeding Date Required
                      </p>
                      <p className="text-xs text-red-200/80 mt-1">
                        The actual breeding date must be recorded on this plan before you can record the foaling.
                        Please update the breeding plan's "Actual Dates" section first.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Birth Date & Time Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300 uppercase tracking-wide">
                  <Calendar className="h-4 w-4" />
                  Foaling Date & Time
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="grid gap-1.5">
                    <span className={labelClass}>Birth Date *</span>
                    <DatePicker
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.currentTarget.value)}
                      inputClassName={inputClass}
                    />
                  </label>

                  <label className="grid gap-1.5">
                    <span className={labelClass}>Birth Time (optional)</span>
                    <input
                      type="time"
                      className={inputClass}
                      value={birthTime}
                      onChange={(e) => setBirthTime(e.target.value)}
                    />
                  </label>
                </div>

                {/* Gestation info */}
                {birthDate && (
                  <div className="flex flex-wrap gap-4 text-sm">
                    {gestationDays !== null && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-secondary" />
                        <span className="text-secondary">Gestation:</span>
                        <span className="font-medium text-primary">
                          {gestationDays} days
                        </span>
                      </div>
                    )}
                    {formattedExpected && daysFromExpected !== null && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-secondary" />
                        <span className="text-secondary">vs Expected:</span>
                        <span
                          className={`font-medium ${
                            daysFromExpected > 0
                              ? "text-emerald-400"
                              : daysFromExpected < 0
                                ? "text-amber-400"
                                : "text-primary"
                          }`}
                        >
                          {daysFromExpected === 0
                            ? "On time"
                            : daysFromExpected > 0
                              ? `${daysFromExpected} days early`
                              : `${Math.abs(daysFromExpected)} days late`}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Foals Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-blue-300 uppercase tracking-wide">
                    <Baby className="h-4 w-4" />
                    Foal Details ({foals.length})
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addFoal}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Foal
                  </Button>
                </div>

                <p className="text-xs text-secondary">
                  Record details for each foal born. You can leave fields blank and update them later.
                  For horses, most births result in a single foal.
                </p>

                <div className="space-y-4">
                  {foals.map((foal, index) => (
                    <div
                      key={foal.id}
                      className="rounded-lg border border-hairline bg-surface/50 p-4 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-primary">
                          Foal #{index + 1}
                        </h4>
                        {foals.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeFoal(foal.id)}
                            className="p-1 rounded hover:bg-red-500/20 text-red-400 transition-colors"
                            title="Remove foal"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {/* Sex Selection */}
                      <div className="space-y-2">
                        <span className={labelClass}>Sex *</span>
                        <div className="flex flex-wrap gap-2">
                          {SEX_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => updateFoal(foal.id, { sex: opt.value })}
                              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                                foal.sex === opt.value
                                  ? `bg-white/10 ${opt.color} border border-current`
                                  : "bg-surface border border-hairline text-secondary hover:text-primary"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Name and Color */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="grid gap-1.5">
                          <span className={labelClass}>Name (optional)</span>
                          <input
                            type="text"
                            className={inputClass}
                            value={foal.name}
                            onChange={(e) =>
                              updateFoal(foal.id, { name: e.target.value })
                            }
                            placeholder={`${damName || "Mare"}'s ${new Date().getFullYear()} ${
                              foal.sex === "MALE"
                                ? "Colt"
                                : foal.sex === "FEMALE"
                                  ? "Filly"
                                  : "Foal"
                            }`}
                          />
                        </label>

                        <label className="grid gap-1.5">
                          <span className={labelClass}>Color</span>
                          <input
                            type="text"
                            className={inputClass}
                            value={foal.color}
                            onChange={(e) =>
                              updateFoal(foal.id, { color: e.target.value })
                            }
                            placeholder="Bay, Chestnut, Black, Grey..."
                          />
                        </label>
                      </div>

                      {/* Markings */}
                      <label className="grid gap-1.5">
                        <span className={labelClass}>Markings</span>
                        <input
                          type="text"
                          className={inputClass}
                          value={foal.markings}
                          onChange={(e) =>
                            updateFoal(foal.id, { markings: e.target.value })
                          }
                          placeholder="Star, stripe, blaze, socks..."
                        />
                      </label>

                      {/* Health Status */}
                      <div className="space-y-2">
                        <span className={labelClass}>Health Status</span>
                        <div className="flex flex-wrap gap-2">
                          {HEALTH_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() =>
                                updateFoal(foal.id, { healthStatus: opt.value })
                              }
                              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                                foal.healthStatus === opt.value
                                  ? `bg-white/10 ${opt.color} border border-current`
                                  : "bg-surface border border-hairline text-secondary hover:text-primary"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Birth metrics - collapsible details */}
                      <details className="group">
                        <summary className="cursor-pointer text-sm text-secondary hover:text-primary flex items-center gap-1">
                          <span>Additional Details</span>
                          <span className="text-xs text-secondary/70">(weight, nursing, timing)</span>
                        </summary>

                        <div className="mt-3 space-y-4 pl-2 border-l-2 border-hairline">
                          {/* Birth Weight */}
                          <label className="grid gap-1.5 max-w-[200px]">
                            <span className={labelClass}>
                              <Scale className="h-3 w-3 inline mr-1" />
                              Birth Weight
                            </span>
                            <input
                              type="text"
                              className={inputClass}
                              value={foal.birthWeight}
                              onChange={(e) =>
                                updateFoal(foal.id, { birthWeight: e.target.value })
                              }
                              placeholder="e.g., 100 lbs"
                            />
                          </label>

                          {/* Nursing Status */}
                          <div className="space-y-2">
                            <span className={labelClass}>Nursing Status</span>
                            <div className="flex flex-wrap gap-2">
                              {NURSING_OPTIONS.map((opt) => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() =>
                                    updateFoal(foal.id, { nursingStatus: opt.value })
                                  }
                                  className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                                    foal.nursingStatus === opt.value
                                      ? "bg-white/10 text-emerald-300 border border-emerald-500/50"
                                      : "bg-surface border border-hairline text-secondary hover:text-primary"
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Standing and Nursing Times */}
                          <div className="grid grid-cols-2 gap-4">
                            <label className="grid gap-1.5">
                              <span className={labelClass}>
                                <Clock className="h-3 w-3 inline mr-1" />
                                Time to Stand (minutes)
                              </span>
                              <input
                                type="number"
                                className={inputClass}
                                value={foal.standingMinutes}
                                onChange={(e) =>
                                  updateFoal(foal.id, {
                                    standingMinutes: e.target.value,
                                  })
                                }
                                placeholder="e.g., 45"
                                min="0"
                              />
                            </label>

                            <label className="grid gap-1.5">
                              <span className={labelClass}>
                                <Clock className="h-3 w-3 inline mr-1" />
                                Time to Nurse (minutes)
                              </span>
                              <input
                                type="number"
                                className={inputClass}
                                value={foal.nursingMinutes}
                                onChange={(e) =>
                                  updateFoal(foal.id, {
                                    nursingMinutes: e.target.value,
                                  })
                                }
                                placeholder="e.g., 120"
                                min="0"
                              />
                            </label>
                          </div>

                          {/* Notes */}
                          <label className="grid gap-1.5">
                            <span className={labelClass}>Notes</span>
                            <textarea
                              className={inputClass + " min-h-[60px] resize-y"}
                              value={foal.notes}
                              onChange={(e) =>
                                updateFoal(foal.id, { notes: e.target.value })
                              }
                              placeholder="Any observations about this foal..."
                            />
                          </label>
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
              </div>

              {/* Error display */}
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-300">
                  <AlertTriangle className="h-4 w-4 inline mr-2" />
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-hairline">
              <div className="text-xs text-secondary">
                <CheckCircle2 className="h-3.5 w-3.5 inline mr-1 text-emerald-400" />
                This will mark the breeding plan as foaled and create offspring records
              </div>
              <div className="flex items-center gap-3">
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
                  disabled={isSubmitting || !birthDate || !breedDateActual}
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isSubmitting ? "Recording..." : "Record Foaling"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}

export default RecordFoalingModal;
