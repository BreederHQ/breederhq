// apps/marketplace/src/ui/types.ts
// Minimal DTO types matching backend contract for marketplace UI

export interface PublicProgramSummaryDTO {
  slug: string;
  name: string;
  location: string | null;
  photoUrl: string | null;
}

export interface PublicProgramDTO {
  slug: string;
  name: string;
  bio: string | null;
  website: string | null;
  publicContactEmail: string | null;
  location: string | null;
  photoUrl: string | null;
}

export interface PublicOffspringGroupListingDTO {
  slug: string;
  title: string;
  description: string | null;
  status: string;
  species: string | null;
  expectedDate: string | null;
  priceMin: number | null;
  priceMax: number | null;
  currency: string | null;
  photoUrl: string | null;
  programSlug: string;
  programName: string;
}

export interface PublicOffspringDTO {
  id: string;
  name: string | null;
  status: string;
  collarColor: string | null;
  sex: string | null;
  price: number | null;
  currency: string | null;
  photoUrl: string | null;
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
