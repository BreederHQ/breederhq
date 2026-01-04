// apps/animals/src/components/marketplace/types.ts
// Shared types and constants for Marketplace listing components

export type ListingStatus = "DRAFT" | "LIVE" | "PAUSED";
export type ListingIntent = "STUD" | "BROOD_PLACEMENT" | "REHOME" | "GUARDIAN_PLACEMENT";
export type PriceModel = "fixed" | "range" | "inquire";

export interface ListingFormData {
  intent: ListingIntent | null;
  headline: string;
  summary: string;
  priceModel: PriceModel | null;
  priceCents: number | null;
  priceMinCents: number | null;
  priceMaxCents: number | null;
  priceText: string;
  locationCity: string;
  locationRegion: string;
  locationCountry: string;
  detailsJson: Record<string, any>;
  primaryPhotoUrl: string | null;
  publicTags: string[];
  searchKeywords: string;
  healthSummary: string;
  registrySummary: string;
  contractSummary: string;
  longDescription: string;
}

export interface AnimalRow {
  id: string | number;
  name: string;
  breed?: string | null;
  species?: string | null;
  sex?: string | null;
  photoUrl?: string | null;
}

export interface ListingRecord {
  id: number;
  status: ListingStatus;
  publishedAt?: string | null;
  pausedAt?: string | null;
  detailsJson?: Record<string, any> | null;
  [key: string]: any;
}

export const INTENT_OPTIONS: { value: ListingIntent; label: string; description: string }[] = [
  { value: "STUD", label: "Stud Service", description: "Offer this male for breeding" },
  { value: "BROOD_PLACEMENT", label: "Brood Placement", description: "Place breeding female with another program" },
  { value: "REHOME", label: "Rehome", description: "Find a new home for this animal" },
  { value: "GUARDIAN_PLACEMENT", label: "Guardian Placement", description: "Place with a guardian home while retaining breeding rights" },
];

export const PRICE_MODEL_OPTIONS: { value: PriceModel; label: string }[] = [
  { value: "fixed", label: "Fixed" },
  { value: "range", label: "Range" },
  { value: "inquire", label: "Contact" },
];

export const INTENT_LABELS: Record<ListingIntent, string> = {
  STUD: "Stud Service",
  BROOD_PLACEMENT: "Brood Placement",
  REHOME: "Rehome",
  GUARDIAN_PLACEMENT: "Guardian Placement",
};

export const INTENT_BADGE_CLASSES: Record<ListingIntent, string> = {
  STUD: "bg-purple-500/15 text-purple-400",
  BROOD_PLACEMENT: "bg-pink-500/15 text-pink-400",
  REHOME: "bg-green-500/15 text-green-400",
  GUARDIAN_PLACEMENT: "bg-blue-500/15 text-blue-400",
};

export function formatCentsPreview(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
