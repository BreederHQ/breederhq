// apps/animals/src/components/marketplace/MarketplaceLongDescription.tsx
// Full description section for listing detail page

import * as React from "react";
import type { ListingFormData } from "./types";

export interface MarketplaceLongDescriptionProps {
  form: ListingFormData;
  setForm: React.Dispatch<React.SetStateAction<ListingFormData>>;
}

export function MarketplaceLongDescription({ form, setForm }: MarketplaceLongDescriptionProps) {
  return (
    <div className="rounded-lg border border-hairline bg-surface p-4">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-primary">Long Description</label>
        <span className="text-[11px] text-tertiary">{form.longDescription.length} chars</span>
      </div>
      <textarea
        className="h-28 w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none resize-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20"
        placeholder="Detailed description for the listing page. Tell potential buyers about this animal's personality, achievements, and what makes them special."
        value={form.longDescription}
        onChange={(e) => setForm((f) => ({ ...f, longDescription: e.currentTarget.value }))}
      />
      <p className="text-[11px] text-tertiary mt-1">Shown on the listing detail page, not on cards.</p>
    </div>
  );
}
