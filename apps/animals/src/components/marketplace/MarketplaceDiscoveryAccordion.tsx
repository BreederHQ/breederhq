// apps/animals/src/components/marketplace/MarketplaceDiscoveryAccordion.tsx
// Discovery accordion - collapsed by default, shows tags count in header

import * as React from "react";
import { Input } from "@bhq/ui";
import type { ListingFormData } from "./types";

export interface MarketplaceDiscoveryAccordionProps {
  form: ListingFormData;
  setForm: React.Dispatch<React.SetStateAction<ListingFormData>>;
  defaultOpen?: boolean;
}

export function MarketplaceDiscoveryAccordion({ form, setForm, defaultOpen = false }: MarketplaceDiscoveryAccordionProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  const tagCount = form.publicTags.length;
  const hasKeywords = form.searchKeywords.trim().length > 0;

  return (
    <div className="rounded-lg border border-hairline overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface hover:bg-surface-strong transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-primary">Discovery</span>
          <span className="text-xs text-tertiary">
            {tagCount > 0 || hasKeywords ? `${tagCount} tag${tagCount !== 1 ? "s" : ""}${hasKeywords ? " + keywords" : ""}` : "Not configured"}
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
          <div>
            <label className="text-xs text-secondary mb-1 block">Public Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {form.publicTags.map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, publicTags: f.publicTags.filter((_, idx) => idx !== i) }))}
                    className="hover:text-orange-900 dark:hover:text-orange-100"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <Input
              placeholder="Type and press Enter to add"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const val = e.currentTarget.value.trim();
                  if (val && !form.publicTags.includes(val)) {
                    setForm((f) => ({ ...f, publicTags: [...f.publicTags, val] }));
                    e.currentTarget.value = "";
                  }
                }
              }}
            />
          </div>
          <div>
            <label className="text-xs text-secondary mb-1 block">Search Keywords</label>
            <Input
              placeholder="Hidden keywords for search (comma-separated)"
              value={form.searchKeywords}
              onChange={(e) => setForm((f) => ({ ...f, searchKeywords: e.currentTarget.value }))}
            />
          </div>
        </div>
      )}
    </div>
  );
}
