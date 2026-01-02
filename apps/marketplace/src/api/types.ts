// apps/marketplace/src/api/types.ts
// DTO types matching backend public-marketplace.ts contract

export interface PublicProgramSummaryDTO {
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
export interface PublicOffspringGroupListingDTO {
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
