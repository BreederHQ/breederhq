// apps/animals/src/components/marketplace/MarketplaceSummariesAccordion.tsx
// Public summaries accordion - collapsed by default

import * as React from "react";
import type { ListingFormData } from "./types";

export interface MarketplaceSummariesAccordionProps {
  form: ListingFormData;
  setForm: React.Dispatch<React.SetStateAction<ListingFormData>>;
  defaultOpen?: boolean;
}

export function MarketplaceSummariesAccordion({ form, setForm, defaultOpen = false }: MarketplaceSummariesAccordionProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  const filledCount = [form.healthSummary, form.registrySummary, form.contractSummary].filter((s) => s.trim()).length;

  return (
    <div className="rounded-lg border border-hairline overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface hover:bg-surface-strong transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-primary">Public Summaries</span>
          <span className="text-xs text-tertiary">
            {filledCount > 0 ? `${filledCount}/3 configured` : "Not configured"}
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-secondary transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-4 py-3 border-t border-hairline space-y-3">
          <p className="text-xs text-secondary">Visible to potential buyers. Keep concise.</p>
          <div>
            <label className="text-xs text-secondary mb-1 block">Health Summary</label>
            <textarea
              className="h-16 w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none resize-none"
              placeholder="OFA Excellent hips, clear genetic panel, etc."
              value={form.healthSummary}
              onChange={(e) => setForm((f) => ({ ...f, healthSummary: e.currentTarget.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-secondary mb-1 block">Registry Summary</label>
            <textarea
              className="h-16 w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none resize-none"
              placeholder="AKC registered, CH titled, CHIC certified"
              value={form.registrySummary}
              onChange={(e) => setForm((f) => ({ ...f, registrySummary: e.currentTarget.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-secondary mb-1 block">Contract Summary</label>
            <textarea
              className="h-16 w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none resize-none"
              placeholder="Health guarantee included, spay/neuter required"
              value={form.contractSummary}
              onChange={(e) => setForm((f) => ({ ...f, contractSummary: e.currentTarget.value }))}
            />
          </div>
        </div>
      )}
    </div>
  );
}
