// apps/animals/src/components/marketplace/MarketplacePublishChecklist.tsx
// Publish checklist - shows validation state for publishing

import * as React from "react";
import type { ListingFormData, ListingRecord } from "./types";

export interface ChecklistItem {
  key: string;
  label: string;
  passed: boolean;
  required: boolean;
}

export interface MarketplacePublishChecklistProps {
  form: ListingFormData;
  listing: ListingRecord | null;
}

export function MarketplacePublishChecklist({ form, listing }: MarketplacePublishChecklistProps) {
  const items: ChecklistItem[] = [
    { key: "listing", label: "Listing created", passed: !!listing, required: true },
    { key: "intent", label: "Intent selected", passed: !!form.intent, required: true },
    { key: "headline", label: "Headline added", passed: form.headline.trim().length > 0, required: true },
    {
      key: "pricing",
      label: "Pricing set",
      passed: form.priceModel === "fixed"
        ? form.priceCents != null
        : form.priceModel === "range"
          ? form.priceMinCents != null && form.priceMaxCents != null
          : form.priceModel === "inquire"
            ? true
            : false,
      required: false
    },
    { key: "photo", label: "Photo added", passed: !!form.primaryPhotoUrl, required: false },
  ];

  const requiredPassed = items.filter((i) => i.required).every((i) => i.passed);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-secondary">Ready to publish</span>
        {requiredPassed ? (
          <span className="text-xs text-green-600 dark:text-green-400">Ready</span>
        ) : (
          <span className="text-xs text-secondary">Missing required</span>
        )}
      </div>
      <div className="space-y-1">
        {items.map((item) => (
          <div key={item.key} className="flex items-center gap-2">
            {item.passed ? (
              <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className={`w-3.5 h-3.5 ${item.required ? "text-red-400" : "text-neutral-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth={2} />
              </svg>
            )}
            <span className={`text-xs ${item.passed ? "text-primary" : "text-secondary"}`}>
              {item.label}
              {item.required && !item.passed && <span className="text-red-400 ml-1">*</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
