// apps/animals/src/components/marketplace/MarketplacePreviewPanel.tsx
// Sticky preview panel - live card preview + checklist + actions

import * as React from "react";
import { Button } from "@bhq/ui";
import type { ListingFormData, AnimalRow, ListingRecord, ListingStatus } from "./types";
import { INTENT_LABELS, INTENT_BADGE_CLASSES, formatCentsPreview } from "./types";
import { MarketplacePublishChecklist } from "./MarketplacePublishChecklist";

export interface MarketplacePreviewPanelProps {
  form: ListingFormData;
  animal: AnimalRow;
  listing: ListingRecord | null;
  status: ListingStatus | null;
  canPublish: boolean;
  saving: boolean;
  onSave: () => void;
  onPublish: () => void;
  onPause: () => void;
  onResume: () => void;
}

export function MarketplacePreviewPanel({
  form,
  animal,
  listing,
  status,
  canPublish,
  saving,
  onSave,
  onPublish,
  onPause,
  onResume,
}: MarketplacePreviewPanelProps) {
  // Format price for preview
  let priceDisplay: string | null = null;
  if (form.priceModel === "fixed" && form.priceCents != null) {
    priceDisplay = formatCentsPreview(form.priceCents);
  } else if (form.priceModel === "range" && form.priceMinCents != null && form.priceMaxCents != null) {
    priceDisplay = `${formatCentsPreview(form.priceMinCents)} – ${formatCentsPreview(form.priceMaxCents)}`;
  } else if (form.priceModel === "inquire") {
    priceDisplay = form.priceText || "Contact for pricing";
  }

  // Format location
  const locationParts = [form.locationCity, form.locationRegion, form.locationCountry].filter(Boolean);
  const locationText = locationParts.length > 0 ? locationParts.join(", ") : null;

  // Intent display
  const intentLabel = form.intent ? INTENT_LABELS[form.intent] : null;
  const intentBadgeClass = form.intent ? INTENT_BADGE_CLASSES[form.intent] : "";

  return (
    <div className="space-y-4">
      {/* Preview Card */}
      <div>
        <div className="text-xs text-secondary uppercase tracking-wide mb-2">Card Preview</div>
        <div className="rounded-lg border border-neutral-700 bg-neutral-800 p-4">
          {/* Intent badge */}
          {intentLabel && (
            <div className="mb-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${intentBadgeClass}`}>
                {intentLabel}
              </span>
            </div>
          )}

          {/* Photo and name row */}
          <div className="flex gap-3 mb-3">
            {form.primaryPhotoUrl ? (
              <div className="w-14 h-14 flex-shrink-0 rounded overflow-hidden bg-neutral-700">
                <img
                  src={form.primaryPhotoUrl}
                  alt={animal.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-14 h-14 flex-shrink-0 rounded bg-neutral-700 flex items-center justify-center">
                <svg className="w-6 h-6 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-[14px] font-semibold text-white mb-0.5 line-clamp-1">
                {animal.name || "Untitled"}
              </h3>
              {form.headline && (
                <p className="text-xs text-neutral-400 line-clamp-2">{form.headline}</p>
              )}
            </div>
          </div>

          {/* Breed and species */}
          <div className="text-xs text-neutral-400 mb-1">
            {animal.breed || animal.species}
            {animal.sex && ` · ${animal.sex}`}
          </div>

          {/* Location */}
          {locationText && (
            <div className="text-[11px] text-neutral-500 mb-2">{locationText}</div>
          )}

          {/* Price */}
          {priceDisplay && (
            <div className="mt-2 pt-2 border-t border-neutral-700">
              <span className="text-[13px] text-orange-400 font-semibold">{priceDisplay}</span>
            </div>
          )}
        </div>
      </div>

      {/* Checklist */}
      <div className="rounded-lg border border-hairline bg-surface p-3">
        <MarketplacePublishChecklist form={form} listing={listing} />
      </div>

      {/* Actions (duplicated from status bar for sticky panel) */}
      <div className="flex flex-col gap-2">
        {status === "DRAFT" && (
          <Button
            onClick={onPublish}
            disabled={saving || !canPublish}
            className="w-full"
          >
            Publish Listing
          </Button>
        )}
        {status === "LIVE" && (
          <Button
            variant="outline"
            onClick={onPause}
            disabled={saving}
            className="w-full"
          >
            Pause Listing
          </Button>
        )}
        {status === "PAUSED" && (
          <Button
            onClick={onResume}
            disabled={saving}
            className="w-full"
          >
            Resume Listing
          </Button>
        )}
        <Button
          variant="outline"
          onClick={onSave}
          disabled={saving}
          className="w-full"
        >
          {saving ? "Saving…" : "Save Draft"}
        </Button>
      </div>
    </div>
  );
}
