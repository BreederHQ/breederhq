// apps/animals/src/components/marketplace/MarketplaceBasicsCard.tsx
// Core listing fields: Intent, Headline, Photo, Summary, Location, Pricing

import * as React from "react";
import { Input } from "@bhq/ui";
import type { ListingFormData, AnimalRow, ListingStatus } from "./types";
import { INTENT_OPTIONS, PRICE_MODEL_OPTIONS } from "./types";

export interface MarketplaceBasicsCardProps {
  form: ListingFormData;
  setForm: React.Dispatch<React.SetStateAction<ListingFormData>>;
  animal: AnimalRow;
  status: ListingStatus | null;
}

export function MarketplaceBasicsCard({ form, setForm, animal, status }: MarketplaceBasicsCardProps) {
  const [photoMode, setPhotoMode] = React.useState<"animal" | "custom">(
    form.primaryPhotoUrl && form.primaryPhotoUrl !== animal.photoUrl ? "custom" : "animal"
  );

  const handlePhotoModeChange = (mode: "animal" | "custom") => {
    setPhotoMode(mode);
    if (mode === "animal") {
      setForm((f) => ({ ...f, primaryPhotoUrl: animal.photoUrl || null }));
    }
  };

  // Intent selection with sex-based gating
  const animalSex = animal.sex?.toUpperCase();

  return (
    <div className="space-y-4">
      {/* Intent Selection */}
      <div>
        <label className="text-xs font-medium text-secondary mb-2 block">
          Listing Intent {status === "DRAFT" && <span className="text-tertiary">(Required)</span>}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {INTENT_OPTIONS.map((opt) => {
            const isDisabled =
              (opt.value === "STUD" && animalSex === "FEMALE") ||
              (opt.value === "BROOD_PLACEMENT" && animalSex === "MALE");
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => !isDisabled && setForm((f) => ({ ...f, intent: opt.value }))}
                disabled={isDisabled}
                className={`flex flex-col items-start p-2.5 rounded-md border text-left transition-colors ${
                  isDisabled
                    ? "opacity-40 cursor-not-allowed border-hairline bg-neutral-50 dark:bg-neutral-800/50"
                    : form.intent === opt.value
                      ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                      : "border-hairline hover:border-neutral-400 dark:hover:border-neutral-600"
                }`}
                title={isDisabled ? `Not available for ${animalSex?.toLowerCase()} animals` : undefined}
              >
                <span className="text-sm font-medium text-primary">{opt.label}</span>
                <span className="text-[11px] text-secondary leading-tight">{opt.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Headline with character counter */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-medium text-secondary">Headline</label>
          <span className={`text-[11px] ${form.headline.length > 100 ? "text-orange-500" : "text-tertiary"}`}>
            {form.headline.length}/120
          </span>
        </div>
        <Input
          placeholder="e.g., Champion Stud Available for Breeding"
          value={form.headline}
          maxLength={120}
          onChange={(e) => setForm((f) => ({ ...f, headline: e.currentTarget.value }))}
        />
      </div>

      {/* Photo picker */}
      <div>
        <label className="text-xs font-medium text-secondary mb-2 block">Photo</label>
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => handlePhotoModeChange("animal")}
            className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
              photoMode === "animal"
                ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300"
                : "border-hairline text-secondary hover:border-neutral-400"
            }`}
          >
            Use animal photo
          </button>
          <button
            type="button"
            onClick={() => handlePhotoModeChange("custom")}
            className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
              photoMode === "custom"
                ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300"
                : "border-hairline text-secondary hover:border-neutral-400"
            }`}
          >
            Custom URL
          </button>
        </div>
        {photoMode === "custom" && (
          <Input
            placeholder="https://example.com/photo.jpg"
            value={form.primaryPhotoUrl || ""}
            onChange={(e) => setForm((f) => ({ ...f, primaryPhotoUrl: e.currentTarget.value || null }))}
          />
        )}
        {photoMode === "animal" && (
          <div className="flex items-center gap-3 p-2 rounded-md border border-hairline bg-surface-strong">
            {form.primaryPhotoUrl ? (
              <img src={form.primaryPhotoUrl} alt={animal.name} className="w-10 h-10 rounded object-cover" />
            ) : (
              <div className="w-10 h-10 rounded bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-secondary">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <span className="text-sm text-secondary">{animal.name}'s photo</span>
          </div>
        )}
      </div>

      {/* Summary with character counter */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-medium text-secondary">Summary</label>
          <span className={`text-[11px] ${form.summary.length > 150 ? "text-orange-500" : "text-tertiary"}`}>
            {form.summary.length}/200
          </span>
        </div>
        <textarea
          className="h-16 w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none resize-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20"
          placeholder="Short description for listing cards"
          value={form.summary}
          maxLength={200}
          onChange={(e) => setForm((f) => ({ ...f, summary: e.currentTarget.value }))}
        />
      </div>

      {/* Location row - inline */}
      <div>
        <label className="text-xs font-medium text-secondary mb-2 block">Location</label>
        <div className="grid grid-cols-3 gap-2">
          <Input
            placeholder="City"
            value={form.locationCity}
            onChange={(e) => setForm((f) => ({ ...f, locationCity: e.currentTarget.value }))}
          />
          <Input
            placeholder="State/Region"
            value={form.locationRegion}
            onChange={(e) => setForm((f) => ({ ...f, locationRegion: e.currentTarget.value }))}
          />
          <Input
            placeholder="Country"
            value={form.locationCountry}
            onChange={(e) => setForm((f) => ({ ...f, locationCountry: e.currentTarget.value }))}
          />
        </div>
      </div>

      {/* Pricing row - segmented control with inline fields */}
      <div>
        <label className="text-xs font-medium text-secondary mb-2 block">Pricing</label>
        <div className="flex items-center gap-1 p-1 rounded-md bg-neutral-100 dark:bg-neutral-800 mb-2 w-fit">
          {PRICE_MODEL_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setForm((f) => ({ ...f, priceModel: opt.value }))}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                form.priceModel === opt.value
                  ? "bg-white dark:bg-neutral-700 text-primary shadow-sm"
                  : "text-secondary hover:text-primary"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {form.priceModel === "fixed" && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-secondary">$</span>
            <Input
              type="number"
              min="0"
              step="1"
              placeholder="0"
              className="w-32"
              value={form.priceCents != null ? Math.round(form.priceCents / 100) : ""}
              onChange={(e) => {
                const val = parseInt(e.currentTarget.value, 10);
                setForm((f) => ({
                  ...f,
                  priceCents: isNaN(val) ? null : val * 100,
                }));
              }}
            />
          </div>
        )}

        {form.priceModel === "range" && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-secondary">$</span>
            <Input
              type="number"
              min="0"
              step="1"
              placeholder="Min"
              className="w-24"
              value={form.priceMinCents != null ? Math.round(form.priceMinCents / 100) : ""}
              onChange={(e) => {
                const val = parseInt(e.currentTarget.value, 10);
                setForm((f) => ({
                  ...f,
                  priceMinCents: isNaN(val) ? null : val * 100,
                }));
              }}
            />
            <span className="text-sm text-secondary">–</span>
            <span className="text-sm text-secondary">$</span>
            <Input
              type="number"
              min="0"
              step="1"
              placeholder="Max"
              className="w-24"
              value={form.priceMaxCents != null ? Math.round(form.priceMaxCents / 100) : ""}
              onChange={(e) => {
                const val = parseInt(e.currentTarget.value, 10);
                setForm((f) => ({
                  ...f,
                  priceMaxCents: isNaN(val) ? null : val * 100,
                }));
              }}
            />
          </div>
        )}

        {form.priceModel === "inquire" && (
          <Input
            placeholder="e.g., Contact for pricing"
            value={form.priceText}
            onChange={(e) => setForm((f) => ({ ...f, priceText: e.currentTarget.value }))}
          />
        )}
      </div>
    </div>
  );
}
