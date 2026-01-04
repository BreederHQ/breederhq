// apps/marketplace/src/api/types.ts
// DTO types matching backend public-marketplace.ts contract

/**
 * Monetization fields for boosted/featured/sponsored items.
 * These are optional fields that can be added to any listing or program.
 */
export interface MonetizationFields {
  boosted?: boolean;
  boostCategory?: "animals" | "breeders" | "services";
  boostWeight?: number;
  boostExpiresAt?: string;
  featured?: boolean;
  featuredWeight?: number;
  isSponsored?: boolean;
  sponsorshipType?: "boosted" | "featured" | "sponsored-card" | "sponsored-content";
  sponsorDisclosureText?: string;
}

export interface PublicProgramSummaryDTO extends MonetizationFields {
  slug: string;
  name: string;
  location: string | null;
  species: string[];
  breed: string | null;
  photoUrl: string | null;
}

export interface PublicProgramDTO {
  slug: string;
  name: string;
  bio: string | null;
  website: string | null;
  publicContactEmail: string | null;
}

/**
 * Parent animal info (dam or sire)
 */
export interface ParentAnimalDTO {
  name: string;
  photoUrl: string | null;
  breed: string | null;
}

/**
 * Offspring group listing - matches backend toPublicOffspringGroupListingDTO
 */
export interface PublicOffspringGroupListingDTO extends MonetizationFields {
  slug: string;
  title: string | null;
  description: string | null;
  species: string;
  breed: string | null;
  expectedBirthOn: string | null;
  actualBirthOn: string | null;
  countAvailable: number;
  dam: ParentAnimalDTO | null;
  sire: ParentAnimalDTO | null;
  coverImageUrl: string | null;
  priceRange: { min: number; max: number } | null;
  programSlug: string;
  programName: string;
}

/**
 * Individual offspring - matches backend toPublicOffspringDTO
 * Note: priceCents is in cents, status is derived from keeperIntent/placementState
 */
export interface PublicOffspringDTO {
  id: number;
  name: string | null;
  sex: string | null;
  collarColorName: string | null;
  collarColorHex: string | null;
  priceCents: number | null;
  status: "available" | "reserved" | "placed";
}

export interface ListingDetailDTO extends PublicOffspringGroupListingDTO {
  offspring: PublicOffspringDTO[];
}

export interface ProgramsResponse {
  items: PublicProgramSummaryDTO[];
  total: number;
}

export interface ListingsResponse {
  items: PublicOffspringGroupListingDTO[];
  total: number;
  page: number;
  limit: number;
}

export interface MarketplaceMeResponse {
  userId: string | null;
  marketplaceEntitled: boolean;
}

/**
 * Program animal listing types - for individual animals listed on marketplace
 */
export type AnimalListingIntent = "STUD" | "BROOD_PLACEMENT" | "REHOME" | "SHOWCASE";
export type AnimalListingStatus = "DRAFT" | "LIVE" | "PAUSED";
export type AnimalListingPriceModel = "fixed" | "range" | "inquire";

/**
 * Public animal listing - matches backend AnimalPublicListing
 * Only LIVE listings are returned from public endpoints
 */
export interface PublicAnimalListingDTO extends MonetizationFields {
  id: number;
  urlSlug: string;
  intent: AnimalListingIntent;
  headline: string | null;
  title: string | null;
  summary: string | null;
  description: string | null;
  priceCents: number | null;
  priceMinCents: number | null;
  priceMaxCents: number | null;
  priceText: string | null;
  priceModel: AnimalListingPriceModel | null;
  locationCity: string | null;
  locationRegion: string | null;
  locationCountry: string | null;
  primaryPhotoUrl: string | null;
  detailsJson: Record<string, any> | null;
  // Animal details
  animalName: string;
  animalBreed: string | null;
  animalSpecies: string;
  animalSex: string | null;
  animalDob: string | null;
  // Program details
  programSlug: string;
  programName: string;
}

export interface AnimalListingsResponse {
  items: PublicAnimalListingDTO[];
  total: number;
  page: number;
  limit: number;
}
