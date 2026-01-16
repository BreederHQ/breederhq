// apps/animals/src/components/ValuationSection.tsx
// Asset valuation section for animal detail view (primarily for horses)

import * as React from "react";
import { SectionCard, Button, DatePicker } from "@bhq/ui";
import { DollarSign, Calendar, FileText, Tag } from "lucide-react";

const inputClass =
  "w-full h-9 rounded-md border border-hairline bg-surface px-3 text-sm text-primary " +
  "placeholder:text-secondary/80 focus:outline-none focus:ring-1 focus:ring-[hsl(var(--brand-orange))] " +
  "focus:border-[hsl(var(--brand-orange))] shadow-[inset_0_0_0_9999px_rgba(255,255,255,0.02)]";

const selectClass =
  "w-full h-9 rounded-md border border-hairline bg-surface px-3 text-sm text-primary " +
  "focus:outline-none focus:ring-1 focus:ring-[hsl(var(--brand-orange))] " +
  "focus:border-[hsl(var(--brand-orange))]";

const labelClass = "text-xs text-secondary";

export type HorseIntendedUse = "BREEDING" | "SHOW" | "RACING";
export type HorseValuationSource = "PRIVATE_SALE" | "AUCTION" | "APPRAISAL" | "INSURANCE" | "OTHER";

export type ValuationData = {
  intendedUse: HorseIntendedUse | null;
  declaredValueCents: number | null;
  declaredValueCurrency: string | null;
  valuationDate: string | null;
  valuationSource: HorseValuationSource | null;
  forSale: boolean;
  inSyndication: boolean;
  isLeased: boolean;
};

type Mode = "view" | "edit";

type ValuationSectionProps = {
  animalId: number;
  species?: string | null;
  data: ValuationData;
  mode: Mode;
  onSave: (data: Partial<ValuationData>) => Promise<void>;
  isLoading?: boolean;
};

const INTENDED_USE_OPTIONS: { value: HorseIntendedUse; label: string }[] = [
  { value: "BREEDING", label: "Breeding" },
  { value: "SHOW", label: "Show" },
  { value: "RACING", label: "Racing" },
];

const VALUATION_SOURCE_OPTIONS: { value: HorseValuationSource; label: string }[] = [
  { value: "PRIVATE_SALE", label: "Private Sale" },
  { value: "AUCTION", label: "Auction" },
  { value: "APPRAISAL", label: "Professional Appraisal" },
  { value: "INSURANCE", label: "Insurance Valuation" },
  { value: "OTHER", label: "Other" },
];

function formatCurrency(cents: number | null, currency: string | null): string {
  if (cents === null || cents === undefined) return "—";
  const amount = cents / 100;
  const currencyCode = currency || "USD";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currencyCode} ${amount.toLocaleString()}`;
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function StatusChip({ active, label, color }: { active: boolean; label: string; color: string }) {
  if (!active) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

export function ValuationSection({
  animalId,
  species,
  data,
  mode,
  onSave,
  isLoading = false,
}: ValuationSectionProps) {
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Local form state
  const [form, setForm] = React.useState<ValuationData>({
    intendedUse: data.intendedUse,
    declaredValueCents: data.declaredValueCents,
    declaredValueCurrency: data.declaredValueCurrency || "USD",
    valuationDate: data.valuationDate,
    valuationSource: data.valuationSource,
    forSale: data.forSale ?? false,
    inSyndication: data.inSyndication ?? false,
    isLeased: data.isLeased ?? false,
  });

  // Update form when data changes
  React.useEffect(() => {
    setForm({
      intendedUse: data.intendedUse,
      declaredValueCents: data.declaredValueCents,
      declaredValueCurrency: data.declaredValueCurrency || "USD",
      valuationDate: data.valuationDate,
      valuationSource: data.valuationSource,
      forSale: data.forSale ?? false,
      inSyndication: data.inSyndication ?? false,
      isLeased: data.isLeased ?? false,
    });
  }, [data]);

  // Only show for horses
  if (species?.toUpperCase() !== "HORSE") {
    return null;
  }

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(form);
      setEditing(false);
    } catch (err: any) {
      setError(err?.message || "Failed to save valuation data");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original data
    setForm({
      intendedUse: data.intendedUse,
      declaredValueCents: data.declaredValueCents,
      declaredValueCurrency: data.declaredValueCurrency || "USD",
      valuationDate: data.valuationDate,
      valuationSource: data.valuationSource,
      forSale: data.forSale ?? false,
      inSyndication: data.inSyndication ?? false,
      isLeased: data.isLeased ?? false,
    });
    setEditing(false);
    setError(null);
  };

  const isEditable = mode === "edit";
  const hasValue = data.declaredValueCents !== null && data.declaredValueCents > 0;

  // View mode
  if (!editing) {
    return (
      <SectionCard
        title={
          <span className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-400" />
            Asset Valuation
          </span>
        }
      >
        <div className="space-y-4">
          {/* Status chips */}
          <div className="flex flex-wrap gap-2">
            <StatusChip active={data.forSale} label="For Sale" color="bg-green-500/20 text-green-400" />
            <StatusChip active={data.inSyndication} label="In Syndication" color="bg-purple-500/20 text-purple-400" />
            <StatusChip active={data.isLeased} label="Leased" color="bg-amber-500/20 text-amber-400" />
            {!data.forSale && !data.inSyndication && !data.isLeased && (
              <span className="text-xs text-secondary">No special status</span>
            )}
          </div>

          {/* Value display */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className={labelClass}>Declared Value</div>
              <div className={`text-sm font-medium ${hasValue ? "text-emerald-400" : "text-secondary"}`}>
                {formatCurrency(data.declaredValueCents, data.declaredValueCurrency)}
              </div>
            </div>
            <div>
              <div className={labelClass}>Valuation Date</div>
              <div className="text-sm">{formatDate(data.valuationDate)}</div>
            </div>
            <div>
              <div className={labelClass}>Source</div>
              <div className="text-sm">
                {data.valuationSource
                  ? VALUATION_SOURCE_OPTIONS.find((o) => o.value === data.valuationSource)?.label || data.valuationSource
                  : "—"}
              </div>
            </div>
            <div>
              <div className={labelClass}>Intended Use</div>
              <div className="text-sm">
                {data.intendedUse
                  ? INTENDED_USE_OPTIONS.find((o) => o.value === data.intendedUse)?.label || data.intendedUse
                  : "—"}
              </div>
            </div>
          </div>

          {/* Edit button */}
          {isEditable && (
            <div className="flex justify-end pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditing(true)}
                disabled={isLoading}
              >
                Edit Valuation
              </Button>
            </div>
          )}
        </div>
      </SectionCard>
    );
  }

  // Edit mode
  return (
    <SectionCard
      title={
        <span className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-emerald-400" />
          Asset Valuation
        </span>
      }
    >
      <div className="space-y-4">
        {/* Error display */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Status toggles */}
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-hairline bg-surface accent-green-500"
              checked={form.forSale}
              onChange={(e) => setForm((prev) => ({ ...prev, forSale: e.target.checked }))}
            />
            <span className="text-sm">For Sale</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-hairline bg-surface accent-purple-500"
              checked={form.inSyndication}
              onChange={(e) => setForm((prev) => ({ ...prev, inSyndication: e.target.checked }))}
            />
            <span className="text-sm">In Syndication</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-hairline bg-surface accent-amber-500"
              checked={form.isLeased}
              onChange={(e) => setForm((prev) => ({ ...prev, isLeased: e.target.checked }))}
            />
            <span className="text-sm">Leased</span>
          </label>
        </div>

        {/* Value inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <label className={labelClass}>Declared Value</label>
            <div className="flex gap-2">
              <select
                className={selectClass + " w-24 flex-shrink-0"}
                value={form.declaredValueCurrency || "USD"}
                onChange={(e) => setForm((prev) => ({ ...prev, declaredValueCurrency: e.target.value }))}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="CAD">CAD</option>
                <option value="AUD">AUD</option>
              </select>
              <input
                type="number"
                className={inputClass}
                value={form.declaredValueCents !== null ? form.declaredValueCents / 100 : ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    declaredValueCents: val ? Math.round(parseFloat(val) * 100) : null,
                  }));
                }}
                placeholder="0"
                min={0}
                step={100}
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <label className={labelClass}>Valuation Date</label>
            <DatePicker
              value={form.valuationDate || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, valuationDate: e.currentTarget.value || null }))}
              inputClassName={inputClass}
            />
          </div>

          <div className="grid gap-1.5">
            <label className={labelClass}>Valuation Source</label>
            <select
              className={selectClass}
              value={form.valuationSource || ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  valuationSource: (e.target.value as HorseValuationSource) || null,
                }))
              }
            >
              <option value="">Select source...</option>
              {VALUATION_SOURCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-1.5">
            <label className={labelClass}>Intended Use</label>
            <select
              className={selectClass}
              value={form.intendedUse || ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  intendedUse: (e.target.value as HorseIntendedUse) || null,
                }))
              }
            >
              <option value="">Select use...</option>
              {INTENDED_USE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={handleCancel} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {saving ? "Saving..." : "Save Valuation"}
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}

export default ValuationSection;
