// apps/offspring/src/components/RecordBirthDatePrompt.tsx
// Inline UI for recording birth date on offspring group when linked plan lacks birthDateActual

import * as React from "react";
import { Calendar, AlertCircle } from "lucide-react";
import { Button, DatePicker } from "@bhq/ui";
import type { OffspringRow, OffspringApi } from "../api";

const inputClass =
  "w-full h-9 rounded-md border border-amber-500/50 bg-amber-500/5 px-3 text-sm text-amber-100 " +
  "placeholder:text-amber-200/50 focus:outline-none focus:ring-1 focus:ring-amber-400";

type RecordBirthDatePromptProps = {
  group: OffspringRow;
  planId: number;
  breedDateActual?: string | null;
  api: OffspringApi | null;
  onSuccess: () => void;
};

export function RecordBirthDatePrompt({
  group,
  planId,
  breedDateActual,
  api,
  onSuccess,
}: RecordBirthDatePromptProps) {
  const [birthDate, setBirthDate] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const canRecordBirth = !!breedDateActual;

  const handleRecordBirth = async () => {
    if (!api || !birthDate || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await api.breeding.recordFoaling(planId, {
        actualBirthDate: birthDate,
        foals: [], // Empty array - no offspring created yet
      });
      onSuccess();
    } catch (err: any) {
      const msg = err?.message || "Failed to record birth date";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-amber-200 mb-1">
            Birth Date Required
          </h4>
          <p className="text-xs text-amber-200/80 mb-3">
            {canRecordBirth
              ? "Record the actual birth date before adding individual offspring to this group."
              : "The breeding date must be recorded on the linked breeding plan before the birth date can be set. Please update the breeding plan first."}
          </p>

          {canRecordBirth && (
            <div className="flex items-end gap-3">
              <div className="flex-1 max-w-[200px]">
                <label className="block text-xs text-amber-200/70 mb-1">
                  Birth Date
                </label>
                <DatePicker
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.currentTarget.value)}
                  inputClassName={inputClass}
                />
              </div>
              <Button
                size="sm"
                variant="primary"
                onClick={handleRecordBirth}
                disabled={!birthDate || isSubmitting}
                className="bg-amber-500 hover:bg-amber-600 text-black"
              >
                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                {isSubmitting ? "Recording..." : "Record Birth"}
              </Button>
            </div>
          )}

          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        </div>
      </div>
    </div>
  );
}

export default RecordBirthDatePrompt;
