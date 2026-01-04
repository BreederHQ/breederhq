// apps/animals/src/components/marketplace/MarketplaceIntentDetailsCard.tsx
// Intent-specific fields with reduced vertical bloat

import * as React from "react";
import { Input } from "@bhq/ui";
import type { ListingFormData } from "./types";
import { INTENT_OPTIONS } from "./types";

export interface MarketplaceIntentDetailsCardProps {
  form: ListingFormData;
  setForm: React.Dispatch<React.SetStateAction<ListingFormData>>;
}

export function MarketplaceIntentDetailsCard({ form, setForm }: MarketplaceIntentDetailsCardProps) {
  if (!form.intent) {
    return (
      <div className="rounded-lg border border-dashed border-hairline bg-surface-strong/50 p-4 text-center">
        <p className="text-sm text-secondary">Select an intent above to configure additional details.</p>
      </div>
    );
  }

  const intentLabel = INTENT_OPTIONS.find((o) => o.value === form.intent)?.label || "";

  return (
    <div className="rounded-lg border border-hairline bg-surface p-4">
      <h3 className="text-sm font-medium text-primary mb-3">{intentLabel} Details</h3>
      <div className="space-y-3">
        {form.intent === "STUD" && (
          <>
            <div>
              <label className="text-xs text-secondary mb-1 block">Stud Fee Notes</label>
              <textarea
                className="h-16 w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none resize-none"
                placeholder="Terms, repeat breeding discount, etc."
                value={form.detailsJson.studFeeNotes || ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    detailsJson: { ...f.detailsJson, studFeeNotes: e.currentTarget.value },
                  }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-secondary mb-1 block">Available For</label>
                <select
                  className="h-9 w-full rounded-md border border-hairline bg-surface px-2 text-sm text-primary"
                  value={form.detailsJson.studAvailability || ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      detailsJson: { ...f.detailsJson, studAvailability: e.currentTarget.value || undefined },
                    }))
                  }
                >
                  <option value="">Select…</option>
                  <option value="natural">Natural Only</option>
                  <option value="ai">AI Only</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-secondary mb-1 block">Shipping</label>
                <select
                  className="h-9 w-full rounded-md border border-hairline bg-surface px-2 text-sm text-primary"
                  value={String(form.detailsJson.shippingAvailable ?? "")}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      detailsJson: {
                        ...f.detailsJson,
                        shippingAvailable: e.currentTarget.value === "true" ? true : e.currentTarget.value === "false" ? false : undefined,
                      },
                    }))
                  }
                >
                  <option value="">Select…</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>
          </>
        )}

        {form.intent === "BROOD_PLACEMENT" && (
          <>
            <div>
              <label className="text-xs text-secondary mb-1 block">Placement Terms</label>
              <textarea
                className="h-16 w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none resize-none"
                placeholder="Co-ownership, breeding rights, return conditions"
                value={form.detailsJson.placementTerms || ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    detailsJson: { ...f.detailsJson, placementTerms: e.currentTarget.value },
                  }))
                }
              />
            </div>
            <div>
              <label className="text-xs text-secondary mb-1 block">Breeding Requirements</label>
              <Input
                placeholder="Minimum litters, health testing, etc."
                value={form.detailsJson.breedingRequirements || ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    detailsJson: { ...f.detailsJson, breedingRequirements: e.currentTarget.value },
                  }))
                }
              />
            </div>
          </>
        )}

        {form.intent === "REHOME" && (
          <>
            <div>
              <label className="text-xs text-secondary mb-1 block">Reason for Rehoming</label>
              <textarea
                className="h-16 w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none resize-none"
                placeholder="Why is this animal being rehomed?"
                value={form.detailsJson.rehomeReason || ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    detailsJson: { ...f.detailsJson, rehomeReason: e.currentTarget.value },
                  }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-secondary mb-1 block">Good With Kids</label>
                <select
                  className="h-9 w-full rounded-md border border-hairline bg-surface px-2 text-sm text-primary"
                  value={String(form.detailsJson.goodWithKids ?? "")}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      detailsJson: {
                        ...f.detailsJson,
                        goodWithKids: e.currentTarget.value === "true" ? true : e.currentTarget.value === "false" ? false : undefined,
                      },
                    }))
                  }
                >
                  <option value="">Unknown</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-secondary mb-1 block">Good With Pets</label>
                <select
                  className="h-9 w-full rounded-md border border-hairline bg-surface px-2 text-sm text-primary"
                  value={String(form.detailsJson.goodWithPets ?? "")}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      detailsJson: {
                        ...f.detailsJson,
                        goodWithPets: e.currentTarget.value === "true" ? true : e.currentTarget.value === "false" ? false : undefined,
                      },
                    }))
                  }
                >
                  <option value="">Unknown</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>
          </>
        )}

        {form.intent === "GUARDIAN_PLACEMENT" && (
          <>
            <div>
              <label className="text-xs text-secondary mb-1 block">Guardian Agreement Terms</label>
              <textarea
                className="h-16 w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-primary outline-none resize-none"
                placeholder="Co-ownership terms, breeding expectations, return conditions"
                value={form.detailsJson.guardianTerms || ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    detailsJson: { ...f.detailsJson, guardianTerms: e.currentTarget.value },
                  }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-secondary mb-1 block">Breeding Commitment</label>
                <Input
                  placeholder="e.g., 2-3 litters"
                  value={form.detailsJson.breedingCommitment || ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      detailsJson: { ...f.detailsJson, breedingCommitment: e.currentTarget.value },
                    }))
                  }
                />
              </div>
              <div>
                <label className="text-xs text-secondary mb-1 block">Vet Care Provided</label>
                <select
                  className="h-9 w-full rounded-md border border-hairline bg-surface px-2 text-sm text-primary"
                  value={String(form.detailsJson.vetCareProvided ?? "")}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      detailsJson: {
                        ...f.detailsJson,
                        vetCareProvided: e.currentTarget.value === "true" ? true : e.currentTarget.value === "false" ? false : undefined,
                      },
                    }))
                  }
                >
                  <option value="">Select…</option>
                  <option value="true">Yes, breeder covers</option>
                  <option value="false">No, guardian covers</option>
                </select>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
