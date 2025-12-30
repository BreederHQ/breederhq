// apps/marketplace/src/types.ts
// TypeScript types for public marketplace DTOs

/** Program summary in list responses */
export interface PublicProgramSummary {
  id: number;
  slug: string;
  name: string;
  photoUrl?: string | null;
  species?: string | null;
  breed?: string | null;
  location?: {
    city?: string | null;
    region?: string | null;
    country?: string | null;
  } | null;
}

/** Program profile DTO returned from GET /public/marketplace/programs/:programSlug */
export interface PublicProgramDTO {
  id: number;
  slug: string;
  name: string;
  bio?: string | null;
  publicContactEmail?: string | null;
  photoUrl?: string | null;
  species?: string | null;
  location?: {
    city?: string | null;
    region?: string | null;
    country?: string | null;
  } | null;
}

/** Query parameters for listing programs */
export interface ProgramsListParams {
  search?: string;
  species?: string;
  breed?: string;
  location?: string;
  limit?: number;
  offset?: number;
}

/** Offspring group summary in list responses */
export interface PublicOffspringGroupSummary {
  id: number;
  slug: string;
  name: string;
  status?: string | null;
  expectedDate?: string | null;
  photoUrl?: string | null;
  offspringCount?: number | null;
}

/** Offspring group detail DTO */
export interface PublicOffspringGroupDTO {
  id: number;
  slug: string;
  name: string;
  status?: string | null;
  expectedDate?: string | null;
  birthDate?: string | null;
  description?: string | null;
  photoUrl?: string | null;
  sire?: PublicAnimalSummary | null;
  dam?: PublicAnimalSummary | null;
  offspring?: PublicOffspringSummary[];
}

/** Offspring entry within a group */
export interface PublicOffspringSummary {
  id: number;
  name?: string | null;
  sex?: "MALE" | "FEMALE" | null;
  status?: string | null;
  photoUrl?: string | null;
  color?: string | null;
  urlSlug?: string | null;
}

/** Animal summary in list responses */
export interface PublicAnimalSummary {
  id: number;
  urlSlug: string;
  name: string;
  sex?: "MALE" | "FEMALE" | null;
  breed?: string | null;
  photoUrl?: string | null;
  status?: string | null;
  birthDate?: string | null;
}

/** Animal detail DTO */
export interface PublicAnimalDTO {
  id: number;
  urlSlug: string;
  name: string;
  sex?: "MALE" | "FEMALE" | null;
  species?: string | null;
  breed?: string | null;
  color?: string | null;
  birthDate?: string | null;
  status?: string | null;
  description?: string | null;
  photoUrl?: string | null;
  registrations?: PublicRegistration[];
  titles?: PublicTitle[];
  healthTests?: PublicHealthTest[];
}

/** Registration record */
export interface PublicRegistration {
  registryName: string;
  identifier: string;
}

/** Title/achievement */
export interface PublicTitle {
  title: string;
  organization?: string | null;
  date?: string | null;
}

/** Health test result */
export interface PublicHealthTest {
  testName: string;
  result?: string | null;
  date?: string | null;
}

/** List response wrapper */
export interface PublicListResponse<T> {
  items: T[];
  total?: number;
}

/** API error with status code */
export interface ApiError extends Error {
  status?: number;
  data?: unknown;
}
