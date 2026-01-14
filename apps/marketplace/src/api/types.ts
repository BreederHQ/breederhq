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

// Pricing tier for a program
export interface ProgramPricingTierDTO {
  tier: string;
  priceRange: string;
  description?: string;
}

export interface PublicProgramDTO {
  slug: string;
  name: string;
  bio: string | null;
  website: string | null;
  publicContactEmail: string | null;

  // === Program-specific enhanced fields ===
  // (Other breeder info like health practices, registrations, etc. comes from breeder profile)

  // Pricing & What's Included
  pricingTiers?: ProgramPricingTierDTO[] | null;
  whatsIncluded?: string | null;
  typicalWaitTime?: string | null;
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
 *
 * @stable - These types are frozen. Do not modify without backend coordination.
 */
export type AnimalListingIntent =
  | "STUD"
  | "BROOD_PLACEMENT"
  | "REHOME"
  | "GUARDIAN"
  | "TRAINED"
  | "WORKING"
  | "STARTED"
  | "CO_OWNERSHIP";
export type AnimalListingStatus = "DRAFT" | "LIVE" | "PAUSED";
export type AnimalListingPriceModel = "fixed" | "range" | "inquire";

/**
 * Intent-specific detailsJson schema definitions.
 *
 * @stable - These schemas are frozen. Backend validates these shapes.
 *
 * STUD intent:
 *   - studFeeCents?: number        // Fixed stud fee in cents
 *   - studFeeMinCents?: number     // Range stud fee minimum
 *   - studFeeMaxCents?: number     // Range stud fee maximum
 *   - healthTestingIncluded?: boolean
 *   - contractRequired?: boolean
 *   - availableForAI?: boolean     // Artificial insemination available
 *
 * BROOD_PLACEMENT intent:
 *   - coOwnershipOffered?: boolean
 *   - breedingRightsIncluded?: boolean
 *   - showQuality?: boolean
 *   - registrationTransfer?: boolean
 *
 * REHOME intent:
 *   - reasonForRehome?: string
 *   - goodWithChildren?: boolean
 *   - goodWithOtherDogs?: boolean
 *   - goodWithCats?: boolean
 *   - houseTrained?: boolean
 *   - crateTrained?: boolean
 *   - spayNeuterRequired?: boolean
 *
 * GUARDIAN intent:
 *   - guardianTerms?: string       // Co-ownership terms, breeding expectations
 *   - breedingCommitment?: string  // e.g., "2-3 litters"
 *   - vetCareProvided?: boolean    // Whether breeder covers vet expenses
 *
 * TRAINED intent:
 *   - trainingLevel?: string       // e.g., "Basic", "Advanced", "Professional"
 *   - trainingDetails?: string     // Description of training completed
 *   - certifications?: string[]    // Training certifications
 *
 * WORKING intent:
 *   - workType?: string            // e.g., "Herding", "Hunting", "Service"
 *   - workExperience?: string      // Description of work experience
 *   - activeWorking?: boolean      // Currently working
 *
 * STARTED intent:
 *   - startedTraining?: string     // Training begun but not completed
 *   - potentialUse?: string        // Intended purpose
 *
 * CO_OWNERSHIP intent:
 *   - ownershipTerms?: string      // Co-ownership agreement terms
 *   - breedingRights?: boolean     // Whether breeding rights are shared
 *   - showRights?: boolean         // Whether show rights are shared
 */
export type AnimalListingDetailsJson = Record<string, unknown>;

/**
 * Public animal listing - matches backend AnimalPublicListing
 * Only LIVE listings are returned from public endpoints
 *
 * @stable - Do not modify field names or types without backend coordination.
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
  detailsJson: AnimalListingDetailsJson | null;
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

/**
 * Public Animal Program types - for grouped animal programs on marketplace
 */
export type AnimalProgramTemplateType =
  | "STUD_SERVICES"
  | "GUARDIAN"
  | "TRAINED"
  | "REHOME"
  | "CO_OWNERSHIP"
  | "CUSTOM";

export interface PublicAnimalProgramParticipant {
  id: number;
  animalId: number;
  name: string;
  photoUrl: string | null;
  breed: string | null;
  sex: string | null;
  birthDate: string | null;
  headlineOverride: string | null;
  descriptionOverride: string | null;
  priceModel: string | null;
  priceCents: number | null;
  priceMinCents: number | null;
  priceMaxCents: number | null;
  featured: boolean;
  viewCount: number;
  inquiryCount: number;
}

export interface PublicAnimalProgramBreeder {
  tenantId: number;
  name: string;
  slug: string | null;
  location: string | null;
  contactEmail: string | null;
  website: string | null;
}

export interface PublicAnimalProgramMedia {
  id: number;
  type: string;
  url: string;
  caption: string | null;
  isPrimary: boolean;
}

export interface PublicAnimalProgramSummaryDTO extends MonetizationFields {
  id: number;
  slug: string;
  name: string;
  headline: string | null;
  description: string | null;
  coverImageUrl: string | null;
  templateType: string;
  priceModel: string;
  priceCents: number | null;
  priceMinCents: number | null;
  priceMaxCents: number | null;
  viewCount: number;
  publishedAt: string | null;
  breeder: PublicAnimalProgramBreeder;
  participants: Array<{
    id: number;
    animalId: number;
    name: string;
    photoUrl: string | null;
    breed: string | null;
    sex: string | null;
  }>;
  participantCount: number;
}

export interface PublicAnimalProgramDetailDTO extends PublicAnimalProgramSummaryDTO {
  programContent: any;
  dataDrawerConfig: any;
  acceptInquiries: boolean;
  openWaitlist: boolean;
  inquiryCount: number;
  createdAt: string;
  participants: PublicAnimalProgramParticipant[];
  media: PublicAnimalProgramMedia[];
}

export interface AnimalProgramsResponse {
  items: PublicAnimalProgramSummaryDTO[];
  total: number;
  limit: number;
  offset: number;
}
