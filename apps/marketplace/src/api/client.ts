// apps/marketplace/src/api/client.ts

import type {
  ProgramsResponse,
  PublicProgramDTO,
  ListingsResponse,
  ListingDetailDTO,
  AnimalListingsResponse,
  PublicAnimalListingDTO,
  AnimalProgramsResponse,
  PublicAnimalProgramSummaryDTO,
  PublicAnimalProgramDetailDTO,
  DirectListingsResponse,
  PublicDirectListingDTO,
} from "./types";

export type { GetAnimalProgramsParams };

/**
 * API client utilities for marketplace.
 */

/**
 * DEV-only warning tracker to prevent spam.
 * Tracks which fetch URLs have already warned.
 */
const devWarnedFetches = new Set<string>();

/**
 * DEV-only: Log when a marketplace data fetch is attempted.
 * This helps debug if data is being fetched before gate resolves.
 */
function devLogFetch(path: string): void {
  if (import.meta.env.PROD) return;

  // Only log once per path to avoid console spam
  if (devWarnedFetches.has(path)) return;
  devWarnedFetches.add(path);

  // Check if gate context exists by looking for marker
  const gateMarker = document.querySelector("[data-gate-status]");
  const gateStatus = gateMarker?.getAttribute("data-gate-status") || "unknown";

  if (gateStatus !== "entitled" && gateStatus !== "unknown") {
    console.warn(
      `[MarketplaceGate] DEV WARNING: Marketplace API fetch while gate=${gateStatus}: ${path}`,
      "\nThis may indicate a data fetch before authentication/entitlement was confirmed."
    );
  }
}

/**
 * Get API base URL.
 * Priority:
 * 1. window.__BHQ_API_BASE__ (set by Platform when embedded)
 * 2. VITE_API_URL env var (for standalone marketplace)
 * 3. Empty string (relative path, uses same origin)
 */
export function getApiBase(): string {
  // Check for Platform-provided base URL first (used when embedded)
  const w = typeof window !== "undefined" ? (window as any) : {};
  if (w.__BHQ_API_BASE__ && typeof w.__BHQ_API_BASE__ === "string") {
    return w.__BHQ_API_BASE__.replace(/\/+$/, "");
  }

  // Check env var (standalone marketplace mode)
  const envUrl = (import.meta as any)?.env?.VITE_API_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.trim() !== "") {
    return envUrl.trim().replace(/\/+$/, "");
  }

  // Default to empty (relative path)
  return "";
}

/**
 * Join API base with path.
 */
export function joinApi(path: string): string {
  const base = getApiBase();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

/**
 * Get CSRF token from cookies.
 */
export function getCsrfToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Safely parse JSON response, returning null on failure.
 */
export async function safeReadJson<T>(response: Response): Promise<T | null> {
  try {
    const text = await response.text();
    if (!text || text.trim() === "") return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/**
 * API Error class.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Make GET request with credentials.
 */
export async function apiGet<T>(path: string): Promise<{ data: T }> {
  const url = joinApi(path);
  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string }>(response);
    throw new ApiError(
      body?.message || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<T>(response);
  return { data: data as T };
}

// =====================================
// Marketplace API functions
// =====================================

export interface GetProgramsParams {
  search?: string;
  location?: string;
  limit?: number;
  offset?: number;
  signal?: AbortSignal;
}

export async function getPrograms(params: GetProgramsParams): Promise<ProgramsResponse> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.location) query.set("location", params.location);
  if (params.limit != null) query.set("limit", String(params.limit));
  if (params.offset != null) query.set("offset", String(params.offset));

  const queryStr = query.toString();
  const path = `/api/v1/marketplace/programs${queryStr ? `?${queryStr}` : ""}`;

  devLogFetch(path);
  const { data } = await apiGet<ProgramsResponse>(path);
  return data;
}

export async function getProgram(programSlug: string): Promise<PublicProgramDTO> {
  const path = `/api/v1/marketplace/programs/${encodeURIComponent(programSlug)}`;
  devLogFetch(path);
  const { data } = await apiGet<PublicProgramDTO>(path);
  return data;
}

export async function getProgramListings(programSlug: string): Promise<ListingsResponse> {
  const path = `/api/v1/marketplace/programs/${encodeURIComponent(programSlug)}/offspring-groups`;
  devLogFetch(path);
  const { data } = await apiGet<ListingsResponse>(path);
  return data;
}

export async function getListing(
  programSlug: string,
  listingSlug: string
): Promise<ListingDetailDTO> {
  const path = `/api/v1/marketplace/programs/${encodeURIComponent(programSlug)}/offspring-groups/${encodeURIComponent(listingSlug)}`;
  devLogFetch(path);
  const { data } = await apiGet<ListingDetailDTO>(path);
  return data;
}

/**
 * Origin tracking data for conversion attribution.
 */
export interface OriginPayload {
  source?: string; // "direct" | "utm" | "referrer" | "embed" | "social"
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  pagePath?: string;
  programSlug?: string;
}

export interface InquiryPayload {
  message: string;
  origin?: OriginPayload;
}

export interface InquiryResponse {
  success: boolean;
  inquiryId?: string;
}

/**
 * Submit an inquiry for a listing. Requires authentication.
 * Uses the unified /inquiries endpoint with programSlug and listingSlug in body.
 */
export async function submitInquiry(
  programSlug: string,
  listingSlug: string,
  payload: InquiryPayload
): Promise<InquiryResponse> {
  const path = `/api/v1/marketplace/inquiries`;
  const url = joinApi(path);

  // Get CSRF token from cookie (XSRF-TOKEN)
  const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (xsrf) {
    headers["x-csrf-token"] = decodeURIComponent(xsrf);
  }

  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify({
      programSlug,
      listingSlug,
      listingType: "offspring_group",
      message: payload.message,
      origin: payload.origin,
    }),
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string }>(response);
    throw new ApiError(
      body?.message || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<InquiryResponse>(response);
  return data || { success: true };
}

// =====================================
// Animal Listings API (Program Animals)
// =====================================

export interface GetAnimalListingsParams {
  search?: string;
  intent?: string;
  species?: string;
  breed?: string;
  location?: string;
  limit?: number;
  offset?: number;
}

/**
 * Get all LIVE animal listings across all programs.
 */
export async function getAnimalListings(params: GetAnimalListingsParams = {}): Promise<AnimalListingsResponse> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.intent) query.set("intent", params.intent);
  if (params.species) query.set("species", params.species);
  if (params.breed) query.set("breed", params.breed);
  if (params.location) query.set("location", params.location);
  if (params.limit != null) query.set("limit", String(params.limit));
  if (params.offset != null) query.set("offset", String(params.offset));

  const queryStr = query.toString();
  const path = `/api/v1/marketplace/animals${queryStr ? `?${queryStr}` : ""}`;

  devLogFetch(path);
  const { data } = await apiGet<AnimalListingsResponse>(path);
  return data;
}

/**
 * Get a single animal listing by program and slug.
 */
export async function getAnimalListing(
  programSlug: string,
  listingSlug: string
): Promise<PublicAnimalListingDTO> {
  const path = `/api/v1/marketplace/programs/${encodeURIComponent(programSlug)}/animals/${encodeURIComponent(listingSlug)}`;
  devLogFetch(path);
  const { data } = await apiGet<PublicAnimalListingDTO>(path);
  return data;
}

// ============================================================================
// Direct Animal Listings (V2 Individual Listings)
// ============================================================================

export interface GetDirectListingsParams {
  search?: string;
  species?: string;
  breed?: string;
  templateType?: string;
  location?: string;
  priceMin?: string;
  priceMax?: string;
  limit?: number;
  offset?: number;
}

/**
 * Get all ACTIVE direct animal listings across all breeders.
 * Uses the public V1 endpoint for individual animal listings (DirectAnimalListing model).
 */
export async function getPublicDirectListings(params: GetDirectListingsParams = {}): Promise<DirectListingsResponse> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.species) query.set("species", params.species);
  if (params.breed) query.set("breed", params.breed);
  if (params.templateType) query.set("templateType", params.templateType);
  if (params.location) query.set("location", params.location);
  if (params.priceMin) query.set("priceMin", params.priceMin);
  if (params.priceMax) query.set("priceMax", params.priceMax);
  if (params.limit != null) query.set("limit", String(params.limit));
  if (params.offset != null) query.set("offset", String(params.offset));

  const queryStr = query.toString();
  const path = `/api/v1/marketplace/direct-listings${queryStr ? `?${queryStr}` : ""}`;

  devLogFetch(path);
  const { data } = await apiGet<DirectListingsResponse>(path);
  return data;
}

/**
 * Get a single direct animal listing by slug.
 * Note: Uses V2 endpoint which has detailed data drawer filtering.
 */
export async function getPublicDirectListing(slug: string): Promise<PublicDirectListingDTO> {
  const path = `/api/v2/marketplace/listings/${encodeURIComponent(slug)}`;
  devLogFetch(path);
  const { data } = await apiGet<PublicDirectListingDTO>(path);
  return data;
}

// ============================================================================
// Public Animal Programs
// ============================================================================

export interface GetAnimalProgramsParams {
  search?: string;
  species?: string;
  breed?: string;
  location?: string;
  templateType?: string;
  tenantId?: string; // Filter by breeder for storefront context
  limit?: number;
  offset?: number;
}

/**
 * Get all published Animal Programs across all breeders.
 * Used in the public Animals browse page to show grouped programs.
 */
export async function getPublicAnimalPrograms(params: GetAnimalProgramsParams = {}): Promise<AnimalProgramsResponse> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.species) query.set("species", params.species);
  if (params.breed) query.set("breed", params.breed);
  if (params.location) query.set("location", params.location);
  if (params.templateType) query.set("templateType", params.templateType);
  if (params.tenantId) query.set("tenantId", params.tenantId);
  if (params.limit != null) query.set("limit", String(params.limit));
  if (params.offset != null) query.set("offset", String(params.offset));

  const queryStr = query.toString();
  const path = `/api/v1/marketplace/animal-programs${queryStr ? `?${queryStr}` : ""}`;

  devLogFetch(path);
  const { data } = await apiGet<AnimalProgramsResponse>(path);
  return data;
}

/**
 * Get a single Animal Program by slug.
 * Used in the public Animal Program detail page.
 */
export async function getAnimalProgramDetail(slug: string): Promise<PublicAnimalProgramDetailDTO> {
  const path = `/api/v1/marketplace/animal-programs/${encodeURIComponent(slug)}`;
  devLogFetch(path);
  const { data } = await apiGet<PublicAnimalProgramDetailDTO>(path);
  return data;
}

/**
 * Submit an inquiry for an animal listing. Requires authentication.
 * Uses the unified /inquiries endpoint with programSlug and listingSlug in body.
 */
export async function submitAnimalInquiry(
  programSlug: string,
  listingSlug: string,
  payload: InquiryPayload
): Promise<InquiryResponse> {
  const path = `/api/v1/marketplace/inquiries`;
  const url = joinApi(path);

  // Get CSRF token from cookie (XSRF-TOKEN)
  const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (xsrf) {
    headers["x-csrf-token"] = decodeURIComponent(xsrf);
  }

  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify({
      programSlug,
      listingSlug,
      listingType: "animal",
      message: payload.message,
      origin: payload.origin,
    }),
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string }>(response);
    throw new ApiError(
      body?.message || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<InquiryResponse>(response);
  return data || { success: true };
}

// =====================================
// Waitlist API (Breeder Waitlist Requests)
// =====================================

export interface WaitlistRequestPayload {
  programName: string;
  message?: string;
  name: string;
  email: string;
  phone?: string;
  origin?: OriginPayload;
}

export interface WaitlistRequestResponse {
  success: boolean;
  entryId?: number;
}

/**
 * Submit a request to join a breeder's waitlist. Requires authentication.
 */
export async function submitWaitlistRequest(
  tenantSlug: string,
  payload: WaitlistRequestPayload
): Promise<WaitlistRequestResponse> {
  const path = `/api/v1/marketplace/waitlist/${encodeURIComponent(tenantSlug)}`;
  const url = joinApi(path);

  // Get CSRF token from cookie (XSRF-TOKEN)
  const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (xsrf) {
    headers["x-csrf-token"] = decodeURIComponent(xsrf);
  }

  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string; error?: string }>(response);
    throw new ApiError(
      body?.message || body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<WaitlistRequestResponse>(response);
  return data || { success: true };
}

// =====================================
// Breeder Programs Management API
// =====================================

export interface BreedingProgramListItem {
  id: number;
  slug: string;
  name: string;
  species: string;
  breedText?: string | null;
  listed: boolean;
  acceptInquiries: boolean;
  openWaitlist: boolean;
  acceptReservations: boolean;
  comingSoon?: boolean;
  createdAt: string;
  _count?: { breedingPlans: number };
  /** Summary stats for linked breeding plans and offspring groups */
  summary?: {
    totalPlans: number;
    activePlans: number;
    totalLitters: number;
    upcomingLitters: number;
    nextExpectedBirth: string | null;
    availableLitters: number;
    totalAvailable: number;
  };
}

export interface BreedingProgramDetail extends BreedingProgramListItem {
  tenantId: number;
  breedId?: number | null;
  description?: string | null;
  programStory?: string | null;
  pricingTiers?: ProgramPricingTier[] | null;
  whatsIncluded?: string | null;
  typicalWaitTime?: string | null;
  coverImageUrl?: string | null;
  showWhatsIncluded?: boolean;
  showWaitTime?: boolean;
  showCoverImage?: boolean;
  updatedAt: string;
  publishedAt?: string | null;
}

export interface ProgramPricingTier {
  tier: string;
  priceRange: string;
  description?: string;
}

export interface BreedingProgramCreateInput {
  name: string;
  species: string;
  breedText?: string | null;
  breedId?: number | null;
  description?: string | null;
  programStory?: string | null;
  listed?: boolean;
  acceptInquiries?: boolean;
  openWaitlist?: boolean;
  acceptReservations?: boolean;
  comingSoon?: boolean;
  pricingTiers?: ProgramPricingTier[] | null;
  whatsIncluded?: string | null;
  typicalWaitTime?: string | null;
  coverImageUrl?: string | null;
  // Visibility flags
  showWhatsIncluded?: boolean;
  showWaitTime?: boolean;
  showCoverImage?: boolean;
}

export interface BreedingProgramsListResponse {
  items: BreedingProgramListItem[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Get all breeding programs for the current tenant (breeder management).
 */
export async function getBreederPrograms(tenantId: string): Promise<BreedingProgramsListResponse> {
  const path = `/api/v1/breeding/programs`;
  const url = joinApi(path);

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Tenant-Id": tenantId,
    },
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string }>(response);
    throw new ApiError(
      body?.message || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<BreedingProgramsListResponse>(response);
  return data || { items: [], total: 0, page: 1, limit: 25 };
}

/**
 * Get a single breeding program by ID (breeder management).
 */
export async function getBreederProgram(tenantId: string, programId: number): Promise<BreedingProgramDetail> {
  const path = `/api/v1/breeding/programs/${programId}`;
  const url = joinApi(path);

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Tenant-Id": tenantId,
    },
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string }>(response);
    throw new ApiError(
      body?.message || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<BreedingProgramDetail>(response);
  if (!data) throw new ApiError("Program not found", 404);
  return data;
}

/**
 * Create a new breeding program (breeder management).
 */
export async function createBreederProgram(
  tenantId: string,
  input: BreedingProgramCreateInput
): Promise<BreedingProgramDetail> {
  const path = `/api/v1/breeding/programs`;
  const url = joinApi(path);

  const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Tenant-Id": tenantId,
  };
  if (xsrf) {
    headers["x-csrf-token"] = decodeURIComponent(xsrf);
  }

  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string; error?: string }>(response);
    throw new ApiError(
      body?.message || body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<BreedingProgramDetail>(response);
  if (!data) throw new ApiError("Failed to create program", 500);
  return data;
}

/**
 * Update a breeding program (breeder management).
 */
export async function updateBreederProgram(
  tenantId: string,
  programId: number,
  input: Partial<BreedingProgramCreateInput>
): Promise<BreedingProgramDetail> {
  const path = `/api/v1/breeding/programs/${programId}`;
  const url = joinApi(path);

  const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Tenant-Id": tenantId,
  };
  if (xsrf) {
    headers["x-csrf-token"] = decodeURIComponent(xsrf);
  }

  const response = await fetch(url, {
    method: "PUT",
    credentials: "include",
    headers,
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string; error?: string }>(response);
    throw new ApiError(
      body?.message || body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<BreedingProgramDetail>(response);
  if (!data) throw new ApiError("Failed to update program", 500);
  return data;
}

/**
 * Delete a breeding program (breeder management).
 */
export async function deleteBreederProgram(tenantId: string, programId: number): Promise<void> {
  const path = `/api/v1/breeding/programs/${programId}`;
  const url = joinApi(path);

  const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Tenant-Id": tenantId,
  };
  if (xsrf) {
    headers["x-csrf-token"] = decodeURIComponent(xsrf);
  }

  const response = await fetch(url, {
    method: "DELETE",
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string; error?: string }>(response);
    throw new ApiError(
      body?.message || body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }
}

// =====================================
// Public Breeding Programs API (Consumer-facing)
// =====================================

export interface PublicBreedingProgramDTO {
  id: number;
  slug: string;
  name: string;
  description?: string | null;
  species: string;
  breedText?: string | null;
  acceptInquiries: boolean;
  openWaitlist: boolean;
  acceptReservations: boolean;
  typicalWaitTime?: string | null;
  activePlansCount: number;
  breeder?: {
    slug: string | null;
    name: string;
    location: string | null;
  } | null;
}

export interface PublicBreedingProgramsResponse {
  items: PublicBreedingProgramDTO[];
  total: number;
  page: number;
  limit: number;
}

export interface GetPublicBreedingProgramsParams {
  search?: string;
  species?: string;
  breed?: string;
  page?: number;
  limit?: number;
}

/**
 * Get all listed breeding programs (consumer-facing browse).
 */
export async function getPublicBreedingPrograms(
  params: GetPublicBreedingProgramsParams = {}
): Promise<PublicBreedingProgramsResponse> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.species) query.set("species", params.species);
  if (params.breed) query.set("breed", params.breed);
  if (params.page != null) query.set("page", String(params.page));
  if (params.limit != null) query.set("limit", String(params.limit));

  const queryStr = query.toString();
  const path = `/api/v1/marketplace/breeding-programs${queryStr ? `?${queryStr}` : ""}`;

  devLogFetch(path);
  const { data } = await apiGet<PublicBreedingProgramsResponse>(path);
  return data;
}

/**
 * Get breeding programs for a specific breeder (consumer-facing).
 */
export async function getBreederBreedingPrograms(
  breederSlug: string
): Promise<PublicBreedingProgramsResponse> {
  const path = `/api/v1/marketplace/programs/${encodeURIComponent(breederSlug)}/breeding-programs`;

  devLogFetch(path);
  const { data } = await apiGet<PublicBreedingProgramsResponse>(path);
  return data;
}

// =====================================
// Breeder Report API
// =====================================

export type BreederReportReason =
  | "SPAM"
  | "FRAUD"
  | "HARASSMENT"
  | "MISREPRESENTATION"
  | "OTHER";

export type BreederReportSeverity = "LIGHT" | "MEDIUM" | "HEAVY";

export interface ReportBreederPayload {
  /** Tenant ID (number) - provide either this or breederTenantSlug */
  breederTenantId?: number;
  /** Tenant slug (string) - provide either this or breederTenantId */
  breederTenantSlug?: string;
  reason: BreederReportReason;
  severity: BreederReportSeverity;
  description?: string;
}

export interface ReportBreederResponse {
  success: boolean;
  message?: string;
}

/**
 * Submit a report against a breeder. Requires authentication.
 * Reports are reviewed by platform admins before any action is taken.
 */
export async function reportBreeder(
  payload: ReportBreederPayload
): Promise<ReportBreederResponse> {
  const path = `/api/v1/marketplace/report-breeder`;
  const url = joinApi(path);

  // Get CSRF token from cookie (XSRF-TOKEN)
  const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (xsrf) {
    headers["x-csrf-token"] = decodeURIComponent(xsrf);
  }

  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string; error?: string }>(response);
    throw new ApiError(
      body?.message || body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<ReportBreederResponse>(response);
  return data || { success: true };
}

// =====================================
// Breeder Services API
// =====================================

export type BreederServiceType =
  | "STUD_SERVICE"
  | "TRAINING"
  | "GROOMING"
  | "TRANSPORT"
  | "BOARDING"
  | "OTHER_SERVICE";

export type ServiceListingStatus = "DRAFT" | "ACTIVE" | "PAUSED";

export interface ServiceListingItem {
  id: number;
  listingType: BreederServiceType;
  title: string;
  description: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  city: string | null;
  state: string | null;
  country: string;
  priceCents: number | null;
  priceType: "fixed" | "starting_at" | "contact" | null;
  images: string[] | null;
  videoUrl: string | null;
  status: ServiceListingStatus;
  slug: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceListingCreateInput {
  listingType: BreederServiceType;
  title: string;
  description?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  city?: string;
  state?: string;
  priceCents?: number;
  priceType?: "fixed" | "starting_at" | "contact";
  images?: string[];
  videoUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface ServiceListingsResponse {
  items: ServiceListingItem[];
  total: number;
}

/**
 * Get all service listings for the current tenant.
 */
export async function getBreederServices(
  tenantId: string,
  params: { status?: string; type?: string; limit?: number } = {}
): Promise<ServiceListingsResponse> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.type) query.set("type", params.type);
  if (params.limit) query.set("limit", params.limit.toString());

  const queryStr = query.toString();
  const path = `/api/v1/services${queryStr ? `?${queryStr}` : ""}`;
  const url = joinApi(path);

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Tenant-Id": tenantId,
    },
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string }>(response);
    throw new ApiError(
      body?.message || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<ServiceListingsResponse>(response);
  return data || { items: [], total: 0 };
}

/**
 * Get a single service listing by ID.
 */
export async function getBreederService(
  tenantId: string,
  serviceId: number
): Promise<ServiceListingItem> {
  const path = `/api/v1/services/${serviceId}`;
  const url = joinApi(path);

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Tenant-Id": tenantId,
    },
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string }>(response);
    throw new ApiError(
      body?.message || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<ServiceListingItem>(response);
  if (!data) throw new ApiError("Service not found", 404);
  return data;
}

/**
 * Create a new service listing.
 */
export async function createBreederService(
  tenantId: string,
  input: ServiceListingCreateInput
): Promise<ServiceListingItem> {
  const path = `/api/v1/services`;
  const url = joinApi(path);

  const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Tenant-Id": tenantId,
  };
  if (xsrf) {
    headers["x-csrf-token"] = decodeURIComponent(xsrf);
  }

  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string; error?: string }>(response);
    throw new ApiError(
      body?.message || body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<ServiceListingItem>(response);
  if (!data) throw new ApiError("Failed to create service", 500);
  return data;
}

/**
 * Update a service listing.
 */
export async function updateBreederService(
  tenantId: string,
  serviceId: number,
  input: Partial<ServiceListingCreateInput>
): Promise<ServiceListingItem> {
  const path = `/api/v1/services/${serviceId}`;
  const url = joinApi(path);

  const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Tenant-Id": tenantId,
  };
  if (xsrf) {
    headers["x-csrf-token"] = decodeURIComponent(xsrf);
  }

  const response = await fetch(url, {
    method: "PUT",
    credentials: "include",
    headers,
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string; error?: string }>(response);
    throw new ApiError(
      body?.message || body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<ServiceListingItem>(response);
  if (!data) throw new ApiError("Failed to update service", 500);
  return data;
}

/**
 * Publish a service listing.
 */
export async function publishBreederService(
  tenantId: string,
  serviceId: number
): Promise<ServiceListingItem> {
  const path = `/api/v1/services/${serviceId}/publish`;
  const url = joinApi(path);

  const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Tenant-Id": tenantId,
  };
  if (xsrf) {
    headers["x-csrf-token"] = decodeURIComponent(xsrf);
  }

  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string; error?: string }>(response);
    throw new ApiError(
      body?.message || body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<ServiceListingItem>(response);
  if (!data) throw new ApiError("Failed to publish service", 500);
  return data;
}

/**
 * Unpublish (pause) a service listing.
 */
export async function unpublishBreederService(
  tenantId: string,
  serviceId: number
): Promise<ServiceListingItem> {
  const path = `/api/v1/services/${serviceId}/unpublish`;
  const url = joinApi(path);

  const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Tenant-Id": tenantId,
  };
  if (xsrf) {
    headers["x-csrf-token"] = decodeURIComponent(xsrf);
  }

  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string; error?: string }>(response);
    throw new ApiError(
      body?.message || body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<ServiceListingItem>(response);
  if (!data) throw new ApiError("Failed to unpublish service", 500);
  return data;
}

/**
 * Delete a service listing.
 */
export async function deleteBreederService(
  tenantId: string,
  serviceId: number
): Promise<void> {
  const path = `/api/v1/services/${serviceId}`;
  const url = joinApi(path);

  const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Tenant-Id": tenantId,
  };
  if (xsrf) {
    headers["x-csrf-token"] = decodeURIComponent(xsrf);
  }

  const response = await fetch(url, {
    method: "DELETE",
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string; error?: string }>(response);
    throw new ApiError(
      body?.message || body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }
}

// =====================================
// Service Provider Portal API
// =====================================

export type ServiceProviderPlan = "FREE" | "PREMIUM" | "BUSINESS";

export type ProviderServiceType =
  | "TRAINING"
  | "VETERINARY"
  | "PHOTOGRAPHY"
  | "GROOMING"
  | "TRANSPORT"
  | "BOARDING"
  | "PRODUCT"
  | "OTHER_SERVICE";

// Service Tags - marketplace-wide tags for service discovery
export interface ServiceTag {
  id: number;
  name: string;
  slug: string;
  usageCount: number;
  suggested: boolean; // System-suggested vs user-created
  createdAt: string;
}

export interface ServiceTagsResponse {
  items: ServiceTag[];
  total: number;
}

export interface ServiceProviderProfile {
  id: number;
  businessName: string;
  email: string;
  phone: string | null;
  website: string | null;
  city: string | null;
  state: string | null;
  country: string;
  plan: ServiceProviderPlan;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  createdAt: string;
  updatedAt: string;
  listingsCount?: number;
  activeListingsCount?: number;
}

export interface ServiceProviderProfileInput {
  businessName: string;
  email: string;
  phone?: string;
  website?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface ProviderListingItem {
  id: number;
  listingType: ProviderServiceType;
  title: string;
  description: string | null;
  customServiceType: string | null; // For OTHER_SERVICE - custom service type name
  tags: ServiceTag[]; // Associated service tags
  images: string[]; // Image URLs
  city: string | null;
  state: string | null;
  priceCents: number | null;
  priceType: "fixed" | "starting_at" | "contact" | null;
  status: "DRAFT" | "ACTIVE" | "PAUSED";
  slug: string | null;
  viewCount: number;
  inquiryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderListingCreateInput {
  listingType: ProviderServiceType;
  title: string;
  description?: string;
  customServiceType?: string; // For OTHER_SERVICE category - custom service type name
  tagIds?: number[]; // Service tag IDs to associate with listing
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  city?: string;
  state?: string;
  priceCents?: number;
  priceType?: "fixed" | "starting_at" | "contact";
  images?: string[];
  videoUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface ProviderListingsResponse {
  items: ProviderListingItem[];
  total: number;
}

export interface ProviderDashboard {
  profile: {
    id: number;
    businessName: string;
    plan: ServiceProviderPlan;
    hasStripeSubscription: boolean;
  };
  stats: {
    totalListings: number;
    activeListings: number;
    draftListings: number;
    totalViews: number;
    totalInquiries: number;
  };
  limits: {
    maxListings: number;
    currentListings: number;
  };
}

function getProviderHeaders(): Record<string, string> {
  const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (xsrf) {
    headers["x-csrf-token"] = decodeURIComponent(xsrf);
  }
  return headers;
}

/**
 * Get current user's service provider profile.
 */
export async function getServiceProviderProfile(): Promise<ServiceProviderProfile | null> {
  const path = `/api/v1/provider/profile`;
  const url = joinApi(path);

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (response.status === 404) {
    return null; // No profile exists yet
  }

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string; error?: string }>(response);
    throw new ApiError(
      body?.message || body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  return safeReadJson<ServiceProviderProfile>(response);
}

/**
 * Create a service provider profile.
 */
export async function createServiceProviderProfile(
  input: ServiceProviderProfileInput
): Promise<ServiceProviderProfile> {
  const path = `/api/v1/provider/profile`;
  const url = joinApi(path);

  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: getProviderHeaders(),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string; error?: string }>(response);
    throw new ApiError(
      body?.message || body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<ServiceProviderProfile>(response);
  if (!data) throw new ApiError("Failed to create profile", 500);
  return data;
}

/**
 * Update service provider profile.
 */
export async function updateServiceProviderProfile(
  input: Partial<ServiceProviderProfileInput>
): Promise<ServiceProviderProfile> {
  const path = `/api/v1/provider/profile`;
  const url = joinApi(path);

  const response = await fetch(url, {
    method: "PUT",
    credentials: "include",
    headers: getProviderHeaders(),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string; error?: string }>(response);
    throw new ApiError(
      body?.message || body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<ServiceProviderProfile>(response);
  if (!data) throw new ApiError("Failed to update profile", 500);
  return data;
}

/**
 * Get service provider dashboard stats.
 */
export async function getServiceProviderDashboard(): Promise<ProviderDashboard> {
  const path = `/api/v1/provider/dashboard`;
  const url = joinApi(path);

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string; error?: string }>(response);
    throw new ApiError(
      body?.message || body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<ProviderDashboard>(response);
  if (!data) throw new ApiError("Failed to load dashboard", 500);
  return data;
}

/**
 * Get service provider's listings.
 */
export async function getServiceProviderListings(
  params: { status?: string } = {}
): Promise<ProviderListingsResponse> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);

  const queryStr = query.toString();
  const path = `/api/v1/provider/listings${queryStr ? `?${queryStr}` : ""}`;
  const url = joinApi(path);

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string }>(response);
    throw new ApiError(
      body?.message || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<ProviderListingsResponse>(response);
  return data || { items: [], total: 0 };
}

/**
 * Create a new service provider listing.
 */
export async function createServiceProviderListing(
  input: ProviderListingCreateInput
): Promise<ProviderListingItem> {
  const path = `/api/v1/provider/listings`;
  const url = joinApi(path);

  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: getProviderHeaders(),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string; error?: string; limit?: number }>(response);
    if (body?.error === "listing_limit_reached") {
      throw new ApiError(`You've reached your plan limit of ${body.limit} listing(s)`, 403);
    }
    throw new ApiError(
      body?.message || body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<ProviderListingItem>(response);
  if (!data) throw new ApiError("Failed to create listing", 500);
  return data;
}

/**
 * Update a service provider listing.
 */
export async function updateServiceProviderListing(
  listingId: number,
  input: Partial<ProviderListingCreateInput>
): Promise<ProviderListingItem> {
  const path = `/api/v1/provider/listings/${listingId}`;
  const url = joinApi(path);

  const response = await fetch(url, {
    method: "PUT",
    credentials: "include",
    headers: getProviderHeaders(),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string; error?: string }>(response);
    throw new ApiError(
      body?.message || body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<ProviderListingItem>(response);
  if (!data) throw new ApiError("Failed to update listing", 500);
  return data;
}

/**
 * Publish a service provider listing.
 */
export async function publishServiceProviderListing(
  listingId: number
): Promise<{ id: number; status: string; publishedAt: string }> {
  const path = `/api/v1/provider/listings/${listingId}/publish`;
  const url = joinApi(path);

  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: getProviderHeaders(),
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string; error?: string }>(response);
    throw new ApiError(
      body?.message || body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<{ id: number; status: string; publishedAt: string }>(response);
  if (!data) throw new ApiError("Failed to publish listing", 500);
  return data;
}

/**
 * Unpublish (pause) a service provider listing.
 */
export async function unpublishServiceProviderListing(
  listingId: number
): Promise<{ id: number; status: string }> {
  const path = `/api/v1/provider/listings/${listingId}/unpublish`;
  const url = joinApi(path);

  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: getProviderHeaders(),
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string; error?: string }>(response);
    throw new ApiError(
      body?.message || body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<{ id: number; status: string }>(response);
  if (!data) throw new ApiError("Failed to unpublish listing", 500);
  return data;
}

/**
 * Delete a service provider listing.
 */
export async function deleteServiceProviderListing(listingId: number): Promise<void> {
  const path = `/api/v1/provider/listings/${listingId}`;
  const url = joinApi(path);

  const response = await fetch(url, {
    method: "DELETE",
    credentials: "include",
    headers: getProviderHeaders(),
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string; error?: string }>(response);
    throw new ApiError(
      body?.message || body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }
}

/**
 * Create Stripe checkout session for plan upgrade.
 */
export async function createProviderCheckout(
  plan: "PREMIUM" | "BUSINESS",
  successUrl: string,
  cancelUrl: string
): Promise<{ checkoutUrl: string }> {
  const path = `/api/v1/provider/billing/checkout`;
  const url = joinApi(path);

  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: getProviderHeaders(),
    body: JSON.stringify({ plan, successUrl, cancelUrl }),
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string; error?: string }>(response);
    throw new ApiError(
      body?.message || body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<{ checkoutUrl: string }>(response);
  if (!data?.checkoutUrl) throw new ApiError("Failed to create checkout session", 500);
  return data;
}

/**
 * Create Stripe customer portal session.
 */
export async function createProviderBillingPortal(
  returnUrl: string
): Promise<{ portalUrl: string }> {
  const path = `/api/v1/provider/billing/portal`;
  const url = joinApi(path);

  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: getProviderHeaders(),
    body: JSON.stringify({ returnUrl }),
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string; error?: string }>(response);
    throw new ApiError(
      body?.message || body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<{ portalUrl: string }>(response);
  if (!data?.portalUrl) throw new ApiError("Failed to create portal session", 500);
  return data;
}

// =====================================
// Public Browse API - Services
// =====================================

export type ServiceListingType =
  | "STUD_SERVICE"
  | "TRAINING"
  | "VETERINARY"
  | "PHOTOGRAPHY"
  | "GROOMING"
  | "TRANSPORT"
  | "BOARDING"
  | "PRODUCT"
  | "OTHER_SERVICE";

export interface PublicServiceListing {
  id: number;
  slug: string | null;
  listingType: ServiceListingType;
  title: string;
  description: string | null;
  customServiceType: string | null; // For OTHER_SERVICE - custom service type name
  tags: ServiceTag[]; // Associated service tags
  city: string | null;
  state: string | null;
  country: string | null;
  priceCents: number | null;
  priceType: "fixed" | "starting_at" | "contact" | null;
  images: string[] | null;
  publishedAt: string | null;
  provider: {
    type: "service_provider" | "breeder";
    id?: number;
    slug?: string | null;
    name: string;
    email?: string | null;
    phone?: string | null;
    website?: string | null;
  } | null;
}

export interface PublicServicesResponse {
  items: PublicServiceListing[];
  total: number;
  page: number;
  limit: number;
}

export interface GetPublicServicesParams {
  type?: string;
  search?: string;
  city?: string;
  state?: string;
  page?: number;
  limit?: number;
}

// =============================================================================
// Service Tags API (marketplace-wide tags for service discovery)
// =============================================================================

/**
 * Get all available service tags (marketplace-wide).
 */
export async function getServiceTags(params?: {
  q?: string;
  suggested?: boolean;
  limit?: number;
}): Promise<ServiceTagsResponse> {
  const queryParams = new URLSearchParams();
  if (params?.q) queryParams.set("q", params.q);
  if (params?.suggested !== undefined) queryParams.set("suggested", String(params.suggested));
  if (params?.limit) queryParams.set("limit", String(params.limit));

  const path = `/api/v1/marketplace/service-tags${queryParams.toString() ? `?${queryParams}` : ""}`;
  const url = joinApi(path);

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string; error?: string }>(response);
    throw new ApiError(
      body?.message || body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<ServiceTagsResponse>(response);
  if (!data) throw new ApiError("Failed to load service tags", 500);
  return data;
}

/**
 * Create a new service tag (user-generated).
 */
export async function createServiceTag(name: string): Promise<ServiceTag> {
  const path = `/api/v1/marketplace/service-tags`;
  const url = joinApi(path);

  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: getProviderHeaders(),
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string; error?: string }>(response);
    throw new ApiError(
      body?.message || body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<ServiceTag>(response);
  if (!data) throw new ApiError("Failed to create service tag", 500);
  return data;
}

/**
 * Browse published service listings (public marketplace).
 */
export async function getPublicServices(
  params: GetPublicServicesParams = {}
): Promise<PublicServicesResponse> {
  const query = new URLSearchParams();
  if (params.type) query.set("type", params.type);
  if (params.search) query.set("search", params.search);
  if (params.city) query.set("city", params.city);
  if (params.state) query.set("state", params.state);
  if (params.page != null) query.set("page", String(params.page));
  if (params.limit != null) query.set("limit", String(params.limit));

  const queryStr = query.toString();
  // Services endpoint requires marketplace entitlement (not truly public)
  const path = `/api/v1/marketplace/services${queryStr ? `?${queryStr}` : ""}`;

  devLogFetch(path);
  const { data } = await apiGet<PublicServicesResponse>(path);
  return data;
}

/**
 * Get a single public service by slug or ID
 * GET /api/v1/marketplace/services/:slugOrId
 */
export async function getPublicServiceById(slugOrId: string | number): Promise<PublicServiceListing> {
  const path = `/api/v1/marketplace/services/${slugOrId}`;

  devLogFetch(path);
  const { data } = await apiGet<PublicServiceListing>(path);
  return data;
}

// =====================================
// Public Browse API - Offspring Groups
// =====================================

export interface PublicOffspringGroupListing {
  id: number;
  listingSlug: string | null;
  title: string | null;
  description: string | null;
  species: string;
  breed: string | null;
  expectedBirthOn: string | null;
  actualBirthOn: string | null;
  coverImageUrl: string | null;
  availableCount: number;
  priceMinCents: number | null;
  priceMaxCents: number | null;
  dam: { name: string | null; photoUrl: string | null } | null;
  sire: { name: string | null; photoUrl: string | null } | null;
  breeder: {
    slug: string | null;
    name: string;
    location: string | null;
  } | null;
}

export interface PublicOffspringGroupsResponse {
  items: PublicOffspringGroupListing[];
  total: number;
  page: number;
  limit: number;
}

export interface GetPublicOffspringGroupsParams {
  species?: string;
  breed?: string;
  search?: string;
  location?: string;
  page?: number;
  limit?: number;
}

/**
 * Browse published offspring groups (public marketplace).
 */
export async function getPublicOffspringGroups(
  params: GetPublicOffspringGroupsParams = {}
): Promise<PublicOffspringGroupsResponse> {
  const query = new URLSearchParams();
  if (params.species) query.set("species", params.species);
  if (params.breed) query.set("breed", params.breed);
  if (params.search) query.set("search", params.search);
  if (params.location) query.set("location", params.location);
  if (params.page != null) query.set("page", String(params.page));
  if (params.limit != null) query.set("limit", String(params.limit));

  const queryStr = query.toString();
  const path = `/api/v1/marketplace/offspring-groups${queryStr ? `?${queryStr}` : ""}`;

  devLogFetch(path);
  const { data } = await apiGet<PublicOffspringGroupsResponse>(path);
  return data;
}

// =====================================
// Saved Listings API
// =====================================

export type SavedListingType = "offspring_group" | "animal" | "service";

export interface SavedListingItem {
  id: number;
  listingType: SavedListingType;
  listingId: number;
  savedAt: string;
  // Expanded listing details
  listing?: {
    title: string;
    slug: string | null;
    coverImageUrl: string | null;
    status: string;
    isAvailable: boolean;
    species?: string;
    breed?: string;
    priceCents?: number | null;
    priceMinCents?: number | null;
    priceMaxCents?: number | null;
    breederName?: string;
    breederSlug?: string;
  };
}

export interface SavedListingsResponse {
  items: SavedListingItem[];
  total: number;
  page: number;
  limit: number;
}

export interface GetSavedListingsParams {
  type?: SavedListingType;
  page?: number;
  limit?: number;
}

/**
 * Get user's saved listings.
 */
export async function getSavedListings(
  params: GetSavedListingsParams = {}
): Promise<SavedListingsResponse> {
  const query = new URLSearchParams();
  if (params.type) query.set("type", params.type);
  if (params.page != null) query.set("page", String(params.page));
  if (params.limit != null) query.set("limit", String(params.limit));

  const queryStr = query.toString();
  const path = `/api/v1/marketplace/saved${queryStr ? `?${queryStr}` : ""}`;

  const { data } = await apiGet<SavedListingsResponse>(path);
  return data;
}

/**
 * Save a listing to favorites.
 */
export async function saveListing(
  listingType: SavedListingType,
  listingId: number | string
): Promise<{ success: boolean; id?: number }> {
  const path = `/api/v1/marketplace/saved`;
  const url = joinApi(path);

  const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (xsrf) {
    headers["x-csrf-token"] = decodeURIComponent(xsrf);
  }

  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify({ listingType, listingId: Number(listingId) }),
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string; error?: string }>(response);
    throw new ApiError(
      body?.message || body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<{ success: boolean; id?: number }>(response);
  return data || { success: true };
}

/**
 * Remove a listing from favorites.
 */
export async function unsaveListing(
  listingType: SavedListingType,
  listingId: number | string
): Promise<{ success: boolean }> {
  const path = `/api/v1/marketplace/saved/${listingType}/${listingId}`;
  const url = joinApi(path);

  const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (xsrf) {
    headers["x-csrf-token"] = decodeURIComponent(xsrf);
  }

  const response = await fetch(url, {
    method: "DELETE",
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string; error?: string }>(response);
    throw new ApiError(
      body?.message || body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  return { success: true };
}

/**
 * Check if a specific listing is saved.
 */
export async function checkSavedListing(
  listingType: SavedListingType,
  listingId: number | string
): Promise<{ saved: boolean }> {
  const path = `/api/v1/marketplace/saved/check/${listingType}/${listingId}`;

  try {
    const { data } = await apiGet<{ saved: boolean }>(path);
    return data || { saved: false };
  } catch {
    return { saved: false };
  }
}

// =====================================
// Marketplace Stats API
// =====================================

/**
 * Get marketplace aggregate statistics for trust bar
 */
export async function getMarketplaceStats(): Promise<{
  breederCount: number;
  animalCount: number;
  reviewCount: number;
}> {
  // TODO: Replace with actual API call when endpoint exists
  // For now, aggregate from existing endpoints
  try {
    const [programs, offspring] = await Promise.all([
      getPrograms({ limit: 1 }),
      getPublicOffspringGroups({ limit: 1 }),
    ]);

    return {
      breederCount: programs.total || 0,
      animalCount: offspring.total || 0,
      reviewCount: 0, // Reviews not yet implemented
    };
  } catch {
    return { breederCount: 0, animalCount: 0, reviewCount: 0 };
  }
}

// =====================================
// Breeder Animal Listings Management API
// =====================================

export type BreederAnimalListingIntent =
  | "STUD"
  | "BROOD_PLACEMENT"
  | "REHOME"
  | "GUARDIAN"
  | "TRAINED"
  | "WORKING"
  | "STARTED"
  | "CO_OWNERSHIP";

export type BreederAnimalListingStatus = "DRAFT" | "LIVE" | "PAUSED" | "SOLD";
export type BreederAnimalPriceModel = "fixed" | "range" | "inquire";

/**
 * Breeder-side animal listing item for management view.
 */
export interface BreederAnimalListingItem {
  id: number;
  animalId: number;
  urlSlug: string;
  intent: BreederAnimalListingIntent;
  status: BreederAnimalListingStatus;
  headline: string | null;
  title: string | null;
  summary: string | null;
  description: string | null;
  priceModel: BreederAnimalPriceModel | null;
  priceCents: number | null;
  priceMinCents: number | null;
  priceMaxCents: number | null;
  priceText: string | null;
  locationCity: string | null;
  locationRegion: string | null;
  locationCountry: string | null;
  primaryPhotoUrl: string | null;
  detailsJson: Record<string, unknown> | null;
  // Animal details
  animalName: string;
  animalBreed: string | null;
  animalSpecies: string;
  animalSex: string | null;
  animalDob: string | null;
  // Program association
  programId: number | null;
  programSlug: string | null;
  programName: string | null;
  // Timestamps
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface BreederAnimalListingsResponse {
  items: BreederAnimalListingItem[];
  total: number;
  page: number;
  limit: number;
}

export interface BreederAnimalListingCreateInput {
  animalId: number;
  programId?: number | null;
  intent: BreederAnimalListingIntent;
  headline?: string | null;
  title?: string | null;
  summary?: string | null;
  description?: string | null;
  priceModel?: BreederAnimalPriceModel;
  priceCents?: number | null;
  priceMinCents?: number | null;
  priceMaxCents?: number | null;
  priceText?: string | null;
  locationCity?: string | null;
  locationRegion?: string | null;
  locationCountry?: string | null;
  detailsJson?: Record<string, unknown> | null;
}

/**
 * Get all animal listings for the current tenant (breeder management).
 * Uses GET /api/v1/animal-listings - the dedicated tenant-scoped endpoint.
 */
export async function getBreederAnimalListings(
  tenantId: string,
  params: { status?: string; intent?: string; programId?: string; limit?: number } = {}
): Promise<BreederAnimalListingsResponse> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.intent) query.set("intent", params.intent);
  if (params.programId) query.set("programId", params.programId);
  if (params.limit) query.set("limit", params.limit.toString());

  const queryStr = query.toString();
  const path = `/api/v1/animal-listings${queryStr ? `?${queryStr}` : ""}`;
  const url = joinApi(path);

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Tenant-Id": tenantId,
    },
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string }>(response);
    throw new ApiError(
      body?.message || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<BreederAnimalListingsResponse>(response);
  return data || { items: [], total: 0, page: 1, limit: 25 };
}

/**
 * Get a single animal listing by animal ID (breeder management).
 * Uses GET /api/v1/animals/:id/public-listing
 */
export async function getBreederAnimalListing(
  tenantId: string,
  animalId: number
): Promise<BreederAnimalListingItem> {
  const path = `/api/v1/animals/${animalId}/public-listing`;
  const url = joinApi(path);

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Tenant-Id": tenantId,
    },
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string }>(response);
    throw new ApiError(
      body?.message || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<BreederAnimalListingItem>(response);
  if (!data) throw new ApiError("Listing not found", 404);
  return data;
}

/**
 * Create or update an animal listing (breeder management).
 * Uses PUT /api/v1/animals/:id/public-listing (upsert)
 */
export async function createBreederAnimalListing(
  tenantId: string,
  input: BreederAnimalListingCreateInput
): Promise<BreederAnimalListingItem> {
  const path = `/api/v1/animals/${input.animalId}/public-listing`;
  const url = joinApi(path);

  const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Tenant-Id": tenantId,
  };
  if (xsrf) {
    headers["x-csrf-token"] = decodeURIComponent(xsrf);
  }

  const response = await fetch(url, {
    method: "PUT", // Upsert - creates or updates
    credentials: "include",
    headers,
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string; error?: string }>(response);
    throw new ApiError(
      body?.message || body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<BreederAnimalListingItem>(response);
  if (!data) throw new ApiError("Failed to create listing", 500);
  return data;
}

/**
 * Update an animal listing (breeder management).
 * Uses PUT /api/v1/animals/:id/public-listing (upsert)
 */
export async function updateBreederAnimalListing(
  tenantId: string,
  animalId: number,
  input: Partial<Omit<BreederAnimalListingCreateInput, "animalId">>
): Promise<BreederAnimalListingItem> {
  const path = `/api/v1/animals/${animalId}/public-listing`;
  const url = joinApi(path);

  const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Tenant-Id": tenantId,
  };
  if (xsrf) {
    headers["x-csrf-token"] = decodeURIComponent(xsrf);
  }

  const response = await fetch(url, {
    method: "PUT",
    credentials: "include",
    headers,
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string; error?: string }>(response);
    throw new ApiError(
      body?.message || body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<BreederAnimalListingItem>(response);
  if (!data) throw new ApiError("Failed to update listing", 500);
  return data;
}

/**
 * Update listing status (publish/pause/mark sold).
 * Uses PATCH /api/v1/animals/:id/public-listing/status
 */
export async function updateBreederAnimalListingStatus(
  tenantId: string,
  animalId: number,
  status: BreederAnimalListingStatus
): Promise<BreederAnimalListingItem> {
  const path = `/api/v1/animals/${animalId}/public-listing/status`;
  const url = joinApi(path);

  const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Tenant-Id": tenantId,
  };
  if (xsrf) {
    headers["x-csrf-token"] = decodeURIComponent(xsrf);
  }

  const response = await fetch(url, {
    method: "PATCH",
    credentials: "include",
    headers,
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string; error?: string }>(response);
    throw new ApiError(
      body?.message || body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<BreederAnimalListingItem>(response);
  if (!data) throw new ApiError("Failed to update listing status", 500);
  return data;
}

/**
 * Delete an animal listing (breeder management).
 * Uses DELETE /api/v1/animals/:id/public-listing
 */
export async function deleteBreederAnimalListing(
  tenantId: string,
  animalId: number
): Promise<void> {
  const path = `/api/v1/animals/${animalId}/public-listing`;
  const url = joinApi(path);

  const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Tenant-Id": tenantId,
  };
  if (xsrf) {
    headers["x-csrf-token"] = decodeURIComponent(xsrf);
  }

  const response = await fetch(url, {
    method: "DELETE",
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string; error?: string }>(response);
    throw new ApiError(
      body?.message || body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }
}

// =====================================
// Breeder Offspring Group Management API
// =====================================

export type OffspringKeeperIntent =
  | "AVAILABLE"
  | "RESERVED"
  | "PLACED"
  | "KEEPER"
  | "DECEASED";

export interface BreederOffspringIndividual {
  id: number;
  offspringGroupId: number;
  name: string | null;
  sex: "MALE" | "FEMALE" | null;
  collarColorName: string | null;
  collarColorHex: string | null;
  coatDescription: string | null;
  photos: string[];
  keeperIntent: OffspringKeeperIntent;
  marketplaceListed: boolean;
  marketplacePriceCents: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface BreederOffspringGroupItem {
  id: number;
  tenantId: number;
  // Breeding context
  breedingPlanId: number | null;
  breedingProgramId: number | null;
  damId: number | null;
  sireId: number | null;
  // Parent info
  dam: { id: number; name: string; photoUrl: string | null; breed: string | null } | null;
  sire: { id: number; name: string; photoUrl: string | null; breed: string | null } | null;
  // Program info
  program: { id: number; slug: string; name: string } | null;
  // Dates
  expectedBirthOn: string | null;
  actualBirthOn: string | null;
  // Species/breed inferred
  species: string;
  breed: string | null;
  // Marketplace fields
  listingTitle: string | null;
  listingDescription: string | null;
  listingSlug: string | null;
  coverImageUrl: string | null;
  marketplaceDefaultPriceCents: number | null;
  published: boolean;
  publishedAt: string | null;
  // Offspring
  offspring: BreederOffspringIndividual[];
  // Computed
  availableCount: number;
  totalCount: number;
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface BreederOffspringGroupsResponse {
  items: BreederOffspringGroupItem[];
  total: number;
  page: number;
  limit: number;
}

export interface BreederOffspringGroupUpdateInput {
  listingTitle?: string | null;
  listingDescription?: string | null;
  listingSlug?: string | null;
  coverImageUrl?: string | null;
  marketplaceDefaultPriceCents?: number | null;
  published?: boolean;
}

export interface BreederOffspringIndividualCreateInput {
  offspringGroupId: number;
  name?: string | null;
  sex?: "MALE" | "FEMALE" | null;
  collarColorName?: string | null;
  collarColorHex?: string | null;
  coatDescription?: string | null;
  photos?: string[];
  keeperIntent?: OffspringKeeperIntent;
  marketplaceListed?: boolean;
  marketplacePriceCents?: number | null;
}

export interface BreederOffspringIndividualUpdateInput {
  name?: string | null;
  sex?: "MALE" | "FEMALE" | null;
  collarColorName?: string | null;
  collarColorHex?: string | null;
  coatDescription?: string | null;
  photos?: string[];
  keeperIntent?: OffspringKeeperIntent;
  marketplaceListed?: boolean;
  marketplacePriceCents?: number | null;
}

/**
 * Get all offspring groups for the current tenant (breeder management).
 * Uses GET /api/v1/offspring-groups
 */
export async function getBreederOffspringGroups(
  tenantId: string,
  params: { published?: string; programId?: string; limit?: number } = {}
): Promise<BreederOffspringGroupsResponse> {
  const query = new URLSearchParams();
  if (params.published) query.set("published", params.published);
  if (params.programId) query.set("programId", params.programId);
  if (params.limit) query.set("limit", params.limit.toString());

  const queryStr = query.toString();
  const path = `/api/v1/offspring-groups${queryStr ? `?${queryStr}` : ""}`;
  const url = joinApi(path);

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Tenant-Id": tenantId,
    },
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string }>(response);
    throw new ApiError(
      body?.message || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<BreederOffspringGroupsResponse>(response);
  return data || { items: [], total: 0, page: 1, limit: 25 };
}

/**
 * Get a single offspring group by ID (breeder management).
 * Uses GET /api/v1/offspring-groups/:id
 */
export async function getBreederOffspringGroup(
  tenantId: string,
  groupId: number
): Promise<BreederOffspringGroupItem> {
  const path = `/api/v1/offspring-groups/${groupId}`;
  const url = joinApi(path);

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Tenant-Id": tenantId,
    },
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string }>(response);
    throw new ApiError(
      body?.message || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<BreederOffspringGroupItem>(response);
  if (!data) throw new ApiError("Offspring group not found", 404);
  return data;
}

/**
 * Update an offspring group's marketplace fields (breeder management).
 * Uses PATCH /api/v1/offspring-groups/:id
 */
export async function updateBreederOffspringGroup(
  tenantId: string,
  groupId: number,
  input: BreederOffspringGroupUpdateInput
): Promise<BreederOffspringGroupItem> {
  const path = `/api/v1/offspring-groups/${groupId}`;
  const url = joinApi(path);

  const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Tenant-Id": tenantId,
  };
  if (xsrf) {
    headers["x-csrf-token"] = decodeURIComponent(xsrf);
  }

  const response = await fetch(url, {
    method: "PATCH",
    credentials: "include",
    headers,
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string; error?: string }>(response);
    throw new ApiError(
      body?.message || body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<BreederOffspringGroupItem>(response);
  if (!data) throw new ApiError("Failed to update offspring group", 500);
  return data;
}

/**
 * Add an individual offspring to a group.
 */
export async function createBreederOffspringIndividual(
  tenantId: string,
  input: BreederOffspringIndividualCreateInput
): Promise<BreederOffspringIndividual> {
  const path = `/api/v1/offspring/individuals`;
  const url = joinApi(path);

  const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Tenant-Id": tenantId,
  };
  if (xsrf) {
    headers["x-csrf-token"] = decodeURIComponent(xsrf);
  }

  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string; error?: string }>(response);
    throw new ApiError(
      body?.message || body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<BreederOffspringIndividual>(response);
  if (!data) throw new ApiError("Failed to create offspring", 500);
  return data;
}

/**
 * Update an individual offspring.
 */
export async function updateBreederOffspringIndividual(
  tenantId: string,
  individualId: number,
  input: BreederOffspringIndividualUpdateInput
): Promise<BreederOffspringIndividual> {
  const path = `/api/v1/offspring/individuals/${individualId}`;
  const url = joinApi(path);

  const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Tenant-Id": tenantId,
  };
  if (xsrf) {
    headers["x-csrf-token"] = decodeURIComponent(xsrf);
  }

  const response = await fetch(url, {
    method: "PATCH",
    credentials: "include",
    headers,
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string; error?: string }>(response);
    throw new ApiError(
      body?.message || body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<BreederOffspringIndividual>(response);
  if (!data) throw new ApiError("Failed to update offspring", 500);
  return data;
}

/**
 * Bulk update offspring marketplace listings (list all available / unlist all).
 * Uses POST /api/v1/offspring-groups/:id/offspring/bulk
 */
export async function bulkUpdateOffspringListing(
  tenantId: string,
  groupId: number,
  action: "list_all_available" | "unlist_all"
): Promise<{ updated: number }> {
  const path = `/api/v1/offspring-groups/${groupId}/offspring/bulk`;
  const url = joinApi(path);

  const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Tenant-Id": tenantId,
  };
  if (xsrf) {
    headers["x-csrf-token"] = decodeURIComponent(xsrf);
  }

  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify({ action }),
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string; error?: string }>(response);
    throw new ApiError(
      body?.message || body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<{ updated: number }>(response);
  return data || { updated: 0 };
}

// =====================================
// Breeder Breeding Plans API
// =====================================

export type BreedingPlanStatus =
  | "PLANNING"
  | "COMMITTED"
  | "IN_HEAT"
  | "BRED"
  | "CONFIRMED"
  | "WHELPING"
  | "NURSING"
  | "WEANING"
  | "PLACING"
  | "COMPLETED"
  | "CANCELLED"
  | "ARCHIVED";

export interface BreederBreedingPlanItem {
  id: number;
  tenantId: number;
  programId: number | null;
  name: string;
  nickname?: string | null;
  status: BreedingPlanStatus;
  species: string;
  breedText: string | null;
  notes?: string | null;
  // Parents
  damId: number | null;
  sireId: number | null;
  dam?: { id: number; name: string; photoUrl?: string | null } | null;
  sire?: { id: number; name: string; photoUrl?: string | null } | null;
  // Locked/Original Timeline (captured when plan was committed)
  lockedCycleStart?: string | null;
  lockedOvulationDate?: string | null;
  lockedDueDate?: string | null;
  lockedPlacementStartDate?: string | null;
  // Expected Timeline (may be recalculated based on actuals)
  expectedCycleStart?: string | null;
  expectedBreedDate?: string | null;
  expectedBirthDate: string | null;
  expectedWeaned?: string | null;
  expectedPlacementStart?: string | null;
  expectedPlacementCompleted?: string | null;
  // Actual Timeline
  cycleStartDateActual?: string | null;
  breedDateActual?: string | null;
  birthDateActual: string | null;
  weanedDateActual?: string | null;
  placementStartDateActual?: string | null;
  placementCompletedDateActual?: string | null;
  completedDateActual?: string | null;
  // Commitment
  committedAt?: string | null;
  // Financial
  depositsCommittedCents?: number | null;
  depositsPaidCents?: number | null;
  // Related data (when included)
  offspringGroup?: {
    id: number;
    totalCount: number;
    availableCount: number;
    offspring?: Array<{
      id: number;
      name?: string | null;
      sex?: string | null;
      keeperIntent?: string | null;
      marketplaceListed?: boolean;
    }>;
  } | null;
  Waitlist?: Array<{
    id: number;
    buyerName: string;
    status: string;
    createdAt: string;
  }>;
  _count?: {
    Waitlist?: number;
  };
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface BreederBreedingPlansResponse {
  items: BreederBreedingPlanItem[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Get all breeding plans for the current tenant.
 * Uses GET /api/v1/breeding/plans
 */
export async function getBreederBreedingPlans(
  tenantId: string,
  params: { status?: string; programId?: string; limit?: number; include?: string } = {}
): Promise<BreederBreedingPlansResponse> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.programId) query.set("programId", params.programId);
  if (params.limit) query.set("limit", params.limit.toString());
  // Include parents, offspring group, and waitlist count by default
  query.set("include", params.include || "parents,offspringgroup,waitlist");

  const queryStr = query.toString();
  const path = `/api/v1/breeding/plans${queryStr ? `?${queryStr}` : ""}`;
  const url = joinApi(path);

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Tenant-Id": tenantId,
    },
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string }>(response);
    throw new ApiError(
      body?.message || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<BreederBreedingPlansResponse>(response);
  return data || { items: [], total: 0, page: 1, limit: 25 };
}

// =====================================
// Breeder Inquiries Management API
// =====================================

export type InquiryStatus = "NEW" | "READ" | "REPLIED" | "ARCHIVED";
export type InquiryListingType = "offspring_group" | "animal" | "service" | "program" | "general";

export interface BreederInquiryItem {
  id: number;
  tenantId: number;
  // Buyer info
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  // Listing context
  listingType: InquiryListingType;
  listingId: number | null;
  listingTitle: string | null;
  listingSlug: string | null;
  programSlug: string | null;
  // Message content
  message: string;
  // Status
  status: InquiryStatus;
  // Origin tracking
  origin: OriginPayload | null;
  // Timestamps
  createdAt: string;
  updatedAt: string;
  readAt: string | null;
  repliedAt: string | null;
}

export interface BreederInquiriesResponse {
  items: BreederInquiryItem[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Get all inquiries for the current tenant (breeder management).
 */
export async function getBreederInquiries(
  tenantId: string,
  params: { status?: string; listingType?: string; page?: number; limit?: number } = {}
): Promise<BreederInquiriesResponse> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.listingType) query.set("listingType", params.listingType);
  if (params.page != null) query.set("page", String(params.page));
  if (params.limit != null) query.set("limit", String(params.limit));

  const queryStr = query.toString();
  const path = `/api/v1/inquiries${queryStr ? `?${queryStr}` : ""}`;
  const url = joinApi(path);

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Tenant-Id": tenantId,
    },
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string }>(response);
    throw new ApiError(
      body?.message || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<BreederInquiriesResponse>(response);
  return data || { items: [], total: 0, page: 1, limit: 25 };
}

/**
 * Update inquiry status (mark read, replied, archived).
 */
export async function updateBreederInquiryStatus(
  tenantId: string,
  inquiryId: number,
  status: InquiryStatus
): Promise<BreederInquiryItem> {
  const path = `/api/v1/inquiries/${inquiryId}/status`;
  const url = joinApi(path);

  const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Tenant-Id": tenantId,
  };
  if (xsrf) {
    headers["x-csrf-token"] = decodeURIComponent(xsrf);
  }

  const response = await fetch(url, {
    method: "PATCH",
    credentials: "include",
    headers,
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string; error?: string }>(response);
    throw new ApiError(
      body?.message || body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<BreederInquiryItem>(response);
  if (!data) throw new ApiError("Failed to update inquiry status", 500);
  return data;
}

// =====================================
// Breeder Waitlist Management API
// =====================================

export type WaitlistEntryStatus = "PENDING" | "APPROVED" | "DECLINED" | "MATCHED" | "WITHDRAWN";

export interface BreederWaitlistEntry {
  id: number;
  tenantId: number;
  // Buyer info
  buyerId: string | null;
  name: string;
  email: string;
  phone: string | null;
  // Program context
  programId: number | null;
  programName: string | null;
  programSlug: string | null;
  // Status
  status: WaitlistEntryStatus;
  // Preferences
  preferences: {
    sex?: "MALE" | "FEMALE" | "ANY";
    color?: string;
    notes?: string;
  } | null;
  // Deposit info
  depositRequired: boolean;
  depositAmountCents: number | null;
  depositPaidAt: string | null;
  // Position
  position: number;
  // Timestamps
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null;
  matchedAt: string | null;
}

export interface BreederWaitlistResponse {
  items: BreederWaitlistEntry[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Get waitlist entries for the current tenant (breeder management).
 */
export async function getBreederWaitlist(
  tenantId: string,
  params: { status?: string; programId?: string; page?: number; limit?: number } = {}
): Promise<BreederWaitlistResponse> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.programId) query.set("programId", params.programId);
  if (params.page != null) query.set("page", String(params.page));
  if (params.limit != null) query.set("limit", String(params.limit));

  const queryStr = query.toString();
  const path = `/api/v1/waitlist-entries${queryStr ? `?${queryStr}` : ""}`;
  const url = joinApi(path);

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Tenant-Id": tenantId,
    },
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string }>(response);
    throw new ApiError(
      body?.message || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<BreederWaitlistResponse>(response);
  return data || { items: [], total: 0, page: 1, limit: 25 };
}

/**
 * Update waitlist entry status (approve, decline, match).
 */
export async function updateBreederWaitlistStatus(
  tenantId: string,
  entryId: number,
  status: WaitlistEntryStatus
): Promise<BreederWaitlistEntry> {
  const path = `/api/v1/waitlist/${entryId}/status`;
  const url = joinApi(path);

  const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Tenant-Id": tenantId,
  };
  if (xsrf) {
    headers["x-csrf-token"] = decodeURIComponent(xsrf);
  }

  const response = await fetch(url, {
    method: "PATCH",
    credentials: "include",
    headers,
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string; error?: string }>(response);
    throw new ApiError(
      body?.message || body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<BreederWaitlistEntry>(response);
  if (!data) throw new ApiError("Failed to update waitlist entry status", 500);
  return data;
}

/**
 * Reorder waitlist entries.
 */
export async function reorderBreederWaitlist(
  tenantId: string,
  programId: number,
  entryIds: number[]
): Promise<{ success: boolean }> {
  const path = `/api/v1/waitlist/reorder`;
  const url = joinApi(path);

  const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Tenant-Id": tenantId,
  };
  if (xsrf) {
    headers["x-csrf-token"] = decodeURIComponent(xsrf);
  }

  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify({ programId, entryIds }),
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string; error?: string }>(response);
    throw new ApiError(
      body?.message || body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  return { success: true };
}

// =====================================
// Marketplace Profile API
// =====================================

/**
 * Marketplace profile data structure from the API.
 * Contains draft (editable) and published (live) versions.
 */
export interface MarketplaceProfileData {
  draft: MarketplaceProfileDraft | null;
  draftUpdatedAt: string | null;
  published: MarketplaceProfileDraft | null;
  publishedAt: string | null;
}

/**
 * Draft profile structure - can be saved and edited before publishing.
 */
export interface MarketplaceProfileDraft {
  businessName?: string;
  bio?: string;
  logoAssetId?: string | null;
  logoUrl?: string | null;
  bannerImageUrl?: string | null;

  // Location (full address for draft, stripped on publish)
  address?: {
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    streetAddress?: string;
    streetAddress2?: string;
  };
  publicLocationMode?: "city_state" | "zip_only" | "full" | "hidden";

  // Contact & Social
  websiteUrl?: string;
  showWebsite?: boolean;
  instagram?: string;
  showInstagram?: boolean;
  facebook?: string;
  showFacebook?: boolean;

  // Breeds list
  breeds?: Array<{ name: string; species?: string | null; isPublic?: boolean }>;

  // Listed Programs
  listedPrograms?: Array<{
    name: string;
    species?: string | null;
    breedText?: string | null;
    breedId?: number | null;
    description?: string | null;
    programStory?: string | null;
    acceptInquiries?: boolean;
    openWaitlist?: boolean;
    acceptReservations?: boolean;
    comingSoon?: boolean;
    // Pricing
    pricingTiers?: Array<{
      tier: string;
      priceRange: string;
      description?: string;
    }> | null;
    whatsIncluded?: string | null;
    showWhatsIncluded?: boolean;
    typicalWaitTime?: string | null;
    showWaitTime?: boolean;
    // Media
    coverImageUrl?: string | null;
    showCoverImage?: boolean;
  }>;

  // Standards & Credentials
  standardsAndCredentials?: {
    registrations?: string[];
    healthPractices?: string[];
    breedingPractices?: string[];
    carePractices?: string[];
    registrationsNote?: string | null;
    healthNote?: string | null;
    breedingNote?: string | null;
    careNote?: string | null;
    showRegistrations?: boolean;
    showHealthPractices?: boolean;
    showBreedingPractices?: boolean;
    showCarePractices?: boolean;
  };

  // Placement Policies
  placementPolicies?: {
    requireApplication?: boolean;
    requireInterview?: boolean;
    requireContract?: boolean;
    hasReturnPolicy?: boolean;
    offersSupport?: boolean;
    note?: string | null;
    showPolicies?: boolean;
  };

  // Business Identity
  showBusinessIdentity?: boolean;
  showLogo?: boolean;
  showBanner?: boolean;
  yearEstablished?: number | null;
}

/**
 * Get the breeder's marketplace profile (draft + published).
 */
export async function getMarketplaceProfile(
  tenantId: string
): Promise<MarketplaceProfileData> {
  const path = `/api/v1/marketplace/profile`;
  const url = joinApi(path);

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Tenant-Id": tenantId,
    },
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string; error?: string }>(response);
    throw new ApiError(
      body?.message || body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<MarketplaceProfileData>(response);
  return data || { draft: null, draftUpdatedAt: null, published: null, publishedAt: null };
}

/**
 * Save draft marketplace profile.
 */
export async function saveMarketplaceProfileDraft(
  tenantId: string,
  draft: MarketplaceProfileDraft
): Promise<{ ok: boolean; draftUpdatedAt: string }> {
  const path = `/api/v1/marketplace/profile/draft`;
  const url = joinApi(path);

  const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Tenant-Id": tenantId,
  };
  if (xsrf) {
    headers["x-csrf-token"] = decodeURIComponent(xsrf);
  }

  const response = await fetch(url, {
    method: "PUT",
    credentials: "include",
    headers,
    body: JSON.stringify(draft),
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string; error?: string }>(response);
    throw new ApiError(
      body?.message || body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<{ ok: boolean; draftUpdatedAt: string }>(response);
  if (!data) throw new ApiError("Failed to save draft", 500);
  return data;
}

/**
 * Publish the marketplace profile (makes it publicly visible).
 */
export async function publishMarketplaceProfile(
  tenantId: string,
  profile: MarketplaceProfileDraft
): Promise<{ ok: boolean; publishedAt: string; tenantSlug?: string }> {
  const path = `/api/v1/marketplace/profile/publish`;
  const url = joinApi(path);

  const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Tenant-Id": tenantId,
  };
  if (xsrf) {
    headers["x-csrf-token"] = decodeURIComponent(xsrf);
  }

  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify(profile),
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string; error?: string; errors?: string[] }>(response);
    const errorMessage = body?.errors?.join(", ") || body?.message || body?.error || `Request failed with status ${response.status}`;
    throw new ApiError(errorMessage, response.status);
  }

  const data = await safeReadJson<{ ok: boolean; publishedAt: string; tenantSlug?: string }>(response);
  if (!data) throw new ApiError("Failed to publish profile", 500);
  return data;
}

/**
 * Unpublish the marketplace profile (removes from public listing).
 */
export async function unpublishMarketplaceProfile(
  tenantId: string
): Promise<{ ok: boolean }> {
  const path = `/api/v1/marketplace/profile/unpublish`;
  const url = joinApi(path);

  const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Tenant-Id": tenantId,
  };
  if (xsrf) {
    headers["x-csrf-token"] = decodeURIComponent(xsrf);
  }

  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string; error?: string }>(response);
    throw new ApiError(
      body?.message || body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<{ ok: boolean }>(response);
  return data || { ok: true };
}

// ═══════════════════════════════════════════════════════════════════════════
// V2 MARKETPLACE - DIRECT ANIMAL LISTINGS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get direct animal listings
 * GET /api/v2/marketplace/direct-listings
 */
export async function getDirectListings(
  tenantId: string,
  params?: { status?: string; templateType?: string; page?: number; limit?: number }
): Promise<{ items: DirectAnimalListing[]; total: number; page: number; limit: number }> {
  const qs = new URLSearchParams();
  qs.append("tenantId", tenantId);
  if (params?.status) {
    qs.append("status", params.status);
  }
  if (params?.templateType) {
    qs.append("templateType", params.templateType);
  }
  if (params?.page) {
    qs.append("page", String(params.page));
  }
  if (params?.limit) {
    qs.append("limit", String(params.limit));
  }

  const response = await fetch(joinApi(`/api/v2/marketplace/direct-listings?${qs}`), {
    credentials: "include",
    headers: { "X-Tenant-ID": tenantId },
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string }>(response);
    throw new ApiError(
      body?.message || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<{ items: DirectAnimalListing[]; total: number; page: number; limit: number }>(
    response
  );
  return data || { items: [], total: 0, page: 1, limit: 25 };
}

/**
 * Get a single direct listing
 * GET /api/v2/marketplace/direct-listings/:id
 */
export async function getDirectListing(tenantId: string, id: number): Promise<DirectAnimalListing> {
  const qs = new URLSearchParams();
  qs.append("tenantId", tenantId);

  const response = await fetch(joinApi(`/api/v2/marketplace/direct-listings/${id}?${qs}`), {
    credentials: "include",
    headers: { "X-Tenant-ID": tenantId },
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string }>(response);
    throw new ApiError(
      body?.message || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<DirectAnimalListing>(response);
  if (!data) {
    throw new ApiError("No data returned", response.status);
  }
  return data;
}

/**
 * Create or update a direct listing
 * POST /api/v2/marketplace/direct-listings
 */
export async function saveDirectListing(
  tenantId: string,
  input: DirectAnimalListingCreate
): Promise<DirectAnimalListing> {
  const xsrf = getCsrfToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Tenant-ID": tenantId,
  };
  if (xsrf) {
    headers["x-csrf-token"] = xsrf;
  }

  const response = await fetch(joinApi(`/api/v2/marketplace/direct-listings?tenantId=${tenantId}`), {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string }>(response);
    throw new ApiError(
      body?.message || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<DirectAnimalListing>(response);
  if (!data) {
    throw new ApiError("No data returned", response.status);
  }
  return data;
}

/**
 * Update direct listing status
 * PATCH /api/v2/marketplace/direct-listings/:id/status
 */
export async function updateDirectListingStatus(
  tenantId: string,
  id: number,
  status: DirectListingStatus
): Promise<{ success: boolean }> {
  const xsrf = getCsrfToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Tenant-ID": tenantId,
  };
  if (xsrf) {
    headers["x-csrf-token"] = xsrf;
  }

  const response = await fetch(
    joinApi(`/api/v2/marketplace/direct-listings/${id}/status?tenantId=${tenantId}`),
    {
      method: "PATCH",
      credentials: "include",
      headers,
      body: JSON.stringify({ status }),
    }
  );

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string }>(response);
    throw new ApiError(
      body?.message || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<{ success: boolean }>(response);
  return data || { success: true };
}

/**
 * Delete a direct listing
 * DELETE /api/v2/marketplace/direct-listings/:id
 */
export async function deleteDirectListing(tenantId: string, id: number): Promise<{ success: boolean }> {
  const xsrf = getCsrfToken();
  const url = joinApi(`/api/v2/marketplace/direct-listings/${id}?tenantId=${tenantId}`);
  const headers: Record<string, string> = {
    "X-Tenant-ID": tenantId,
  };
  if (xsrf) {
    headers["x-csrf-token"] = xsrf;
  }

  const response = await fetch(url, {
    method: "DELETE",
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string }>(response);
    throw new ApiError(
      body?.message || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<{ success: boolean }>(response);
  return data || { success: true };
}

// ═══════════════════════════════════════════════════════════════════════════
// V2 MARKETPLACE - ANIMAL PROGRAMS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get animal programs
 * GET /api/v2/marketplace/animal-programs
 */
export async function getAnimalPrograms(
  tenantId: string,
  params?: { published?: boolean; templateType?: string; page?: number; limit?: number }
): Promise<{ items: AnimalProgram[]; total: number; page: number; limit: number }> {
  const qs = new URLSearchParams();
  qs.append("tenantId", tenantId);
  if (params?.published !== undefined) {
    qs.append("published", String(params.published));
  }
  if (params?.templateType) {
    qs.append("templateType", params.templateType);
  }
  if (params?.page) {
    qs.append("page", String(params.page));
  }
  if (params?.limit) {
    qs.append("limit", String(params.limit));
  }

  const response = await fetch(joinApi(`/api/v2/marketplace/animal-programs?${qs}`), {
    credentials: "include",
    headers: { "X-Tenant-ID": tenantId },
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string }>(response);
    throw new ApiError(
      body?.message || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<{ items: AnimalProgram[]; total: number; page: number; limit: number }>(response);
  return data || { items: [], total: 0, page: 1, limit: 25 };
}

/**
 * Get a single animal program
 * GET /api/v2/marketplace/animal-programs/:id
 */
export async function getAnimalProgram(tenantId: string, id: number): Promise<AnimalProgram> {
  const qs = new URLSearchParams();
  qs.append("tenantId", tenantId);

  const response = await fetch(joinApi(`/api/v2/marketplace/animal-programs/${id}?${qs}`), {
    credentials: "include",
    headers: { "X-Tenant-ID": tenantId },
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string }>(response);
    throw new ApiError(
      body?.message || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<AnimalProgram>(response);
  if (!data) {
    throw new ApiError("No data returned", response.status);
  }
  return data;
}

/**
 * Create or update an animal program
 * POST /api/v2/marketplace/animal-programs
 */
export async function saveAnimalProgram(tenantId: string, input: AnimalProgramCreate): Promise<AnimalProgram> {
  const xsrf = getCsrfToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Tenant-ID": tenantId,
  };
  if (xsrf) {
    headers["x-csrf-token"] = xsrf;
  }

  const response = await fetch(joinApi(`/api/v2/marketplace/animal-programs?tenantId=${tenantId}`), {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string }>(response);
    throw new ApiError(
      body?.message || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<AnimalProgram>(response);
  if (!data) {
    throw new ApiError("No data returned", response.status);
  }
  return data;
}

/**
 * Update animal program published status
 * PATCH /api/v2/marketplace/animal-programs/:id/publish
 */
export async function updateAnimalProgramPublished(
  tenantId: string,
  id: number,
  published: boolean
): Promise<{ success: boolean }> {
  const xsrf = getCsrfToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Tenant-ID": tenantId,
  };
  if (xsrf) {
    headers["x-csrf-token"] = xsrf;
  }

  const response = await fetch(
    joinApi(`/api/v2/marketplace/animal-programs/${id}/publish?tenantId=${tenantId}`),
    {
      method: "PATCH",
      credentials: "include",
      headers,
      body: JSON.stringify({ published }),
    }
  );

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string }>(response);
    throw new ApiError(
      body?.message || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<{ success: boolean }>(response);
  return data || { success: true };
}

/**
 * Delete an animal program
 * DELETE /api/v2/marketplace/animal-programs/:id
 */
export async function deleteAnimalProgram(tenantId: string, id: number): Promise<{ success: boolean }> {
  const xsrf = getCsrfToken();
  const url = joinApi(`/api/v2/marketplace/animal-programs/${id}?tenantId=${tenantId}`);
  const headers: Record<string, string> = {
    "X-Tenant-ID": tenantId,
  };
  if (xsrf) {
    headers["x-csrf-token"] = xsrf;
  }

  const response = await fetch(url, {
    method: "DELETE",
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string }>(response);
    throw new ApiError(
      body?.message || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<{ success: boolean }>(response);
  return data || { success: true };
}

/**
 * Add animals to a program
 * POST /api/v2/marketplace/animal-programs/:id/participants
 */
export async function addAnimalsToProgram(
  tenantId: string,
  programId: number,
  animalIds: number[]
): Promise<{ success: boolean }> {
  const xsrf = getCsrfToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Tenant-ID": tenantId,
  };
  if (xsrf) {
    headers["x-csrf-token"] = xsrf;
  }

  const response = await fetch(
    joinApi(`/api/v2/marketplace/animal-programs/${programId}/participants?tenantId=${tenantId}`),
    {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify({ animalIds }),
    }
  );

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string }>(response);
    throw new ApiError(
      body?.message || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<{ success: boolean }>(response);
  return data || { success: true };
}

/**
 * Remove an animal from a program
 * DELETE /api/v2/marketplace/animal-programs/:programId/participants/:participantId
 */
export async function removeAnimalFromProgram(
  tenantId: string,
  programId: number,
  participantId: number
): Promise<{ success: boolean }> {
  const xsrf = getCsrfToken();
  const url = joinApi(`/api/v2/marketplace/animal-programs/${programId}/participants/${participantId}?tenantId=${tenantId}`);
  const headers: Record<string, string> = {
    "X-Tenant-ID": tenantId,
  };
  if (xsrf) {
    headers["x-csrf-token"] = xsrf;
  }

  const response = await fetch(url, {
    method: "DELETE",
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string }>(response);
    throw new ApiError(
      body?.message || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<{ success: boolean }>(response);
  return data || { success: true };
}

// ═══════════════════════════════════════════════════════════════════════════
// TENANT ANIMALS
// ═══════════════════════════════════════════════════════════════════════════

export interface TenantAnimalItem {
  id: number;
  name: string;
  species: string;
  breed: string | null;
  sex: string | null;
  photoUrl: string | null;
}

/**
 * Get tenant animals for animal selector (lightweight)
 * GET /api/v2/marketplace/animals?search=&limit=
 */
export async function getTenantAnimals(
  tenantId: string,
  params?: { search?: string; limit?: number }
): Promise<{ items: TenantAnimalItem[]; total: number }> {
  const qs = new URLSearchParams();
  if (params?.search) {
    qs.append("search", params.search);
  }
  if (params?.limit) {
    qs.append("limit", String(params.limit));
  }

  const response = await fetch(joinApi(`/api/v2/marketplace/animals?${qs}`), {
    credentials: "include",
    headers: { "X-Tenant-ID": tenantId },
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string }>(response);
    throw new ApiError(
      body?.message || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<{ items: TenantAnimalItem[]; total: number }>(response);
  return data || { items: [], total: 0 };
}

// ═══════════════════════════════════════════════════════════════════════════
// DATA DRAWER - LISTING DATA CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Configuration for which animal data to display in a marketplace listing.
 * Each section can be enabled/disabled and have specific items selected.
 * This config is saved to DirectAnimalListing.dataDrawerConfig field.
 */
export interface DataDrawerConfig {
  // Note: Identity (name, photo, DOB) is always included based on animal-level privacy settings
  // The Data Drawer controls only optional data sections
  registry?: {
    enabled: boolean;
    registryIds?: number[];
  };
  health?: {
    enabled: boolean;
    traitIds?: number[];
    /** Per-trait setting to show full history instead of just latest value */
    traitHistoryEnabled?: Record<number, boolean>;
  };
  genetics?: {
    enabled: boolean;
    showBreedComposition?: boolean;
    showHealthGenetics?: boolean;
    showCoatColor?: boolean;
    showCOI?: boolean;
    showPredictedWeight?: boolean;
  };
  media?: {
    enabled: boolean;
    mediaIds?: number[];
  };
  achievements?: {
    enabled: boolean;
    titleIds?: number[];
    competitionIds?: number[];
  };
  lineage?: {
    enabled: boolean;
    showSire?: boolean;
    showDam?: boolean;
  };
  breeding?: {
    enabled: boolean;
    showOffspringCount?: boolean;
  };
  documents?: {
    enabled: boolean;
    documentIds?: number[];
  };
}

/**
 * Privacy settings for an animal (from AnimalPrivacySettings table)
 */
export interface AnimalPrivacySettings {
  animalId: number;
  allowCrossTenantMatching: boolean;
  showName: boolean;
  showPhoto: boolean;
  showFullDob: boolean;
  showRegistryFull: boolean;
  showBreeder: boolean;
  enableHealthSharing: boolean;
  enableGeneticsSharing: boolean;
  enableDocumentSharing: boolean;
  enableMediaSharing: boolean;
  showTitles: boolean;
  showTitleDetails: boolean;
  showCompetitions: boolean;
  showCompetitionDetails: boolean;
  showBreedingHistory: boolean;
  allowInfoRequests: boolean;
  allowDirectContact: boolean;
}

/**
 * Historical entry for a health trait
 */
export interface HealthTraitHistoryEntry {
  id: number;
  recordedAt: string;
  data: any;
  performedBy: string | null;
  location: string | null;
  notes: string | null;
}

/**
 * Health trait eligible for marketplace listing
 */
export interface HealthTrait {
  id: number;
  key: string;
  displayName: string;
  category: string;
  valueType: string;
  value: any;
  status: string | null;
  performedAt: string | null;
  verified: boolean;
  /** Whether this trait supports historical entries (e.g., weight, wellness exams) */
  supportsHistory: boolean;
  /** Historical entries for this trait (only populated if supportsHistory is true) */
  history?: HealthTraitHistoryEntry[];
  /** Total count of historical entries */
  historyCount?: number;
}

/**
 * Title eligible for marketplace listing
 */
export interface TitleItem {
  id: number;
  name: string;
  abbreviation: string;
  organization: string | null;
  dateEarned: string | null;
  eventName: string | null;
  eventLocation: string | null;
  pointsEarned: number | null;
  majorWins: number | null;
  verified: boolean;
}

/**
 * Competition entry eligible for marketplace listing
 */
export interface CompetitionItem {
  id: number;
  eventName: string;
  eventDate: string | null;
  organization: string | null;
  competitionType: string | null;
  className: string | null;
  placement: number | null;
  placementLabel: string | null;
  pointsEarned: number | null;
  isMajorWin: boolean;
}

/**
 * Media item eligible for marketplace listing
 */
export interface MediaItem {
  id: number;
  kind: string;
  filename: string;
  caption: string | null;
}

/**
 * Document eligible for marketplace listing
 */
export interface DocumentItem {
  id: number;
  kind: string;
  filename: string;
}

/**
 * Registry identifier
 */
export interface RegistryItem {
  id: number;
  registryId: number | null;
  registryName: string | null;
  registryAbbr: string | null;
  identifier: string;
}

/**
 * Genetics data for animal
 */
export interface GeneticsData {
  id: number;
  testProvider: string | null;
  testDate: string | null;
  breedComposition: any;
  coatColorData: any;
  healthGeneticsData: any;
  coatTypeData: any;
  physicalTraitsData: any;
  eyeColorData: any;
  coi: number | null;
  predictedAdultWeight: number | null;
}

/**
 * Parent info for lineage
 */
export interface ParentInfo {
  id: number;
  name: string;
  breed: string | null;
  photoUrl: string | null;
  titles: string;
}

/**
 * Response from GET /api/v2/marketplace/animals/:id/listing-data
 * Contains all animal data eligible for marketplace listing
 */
export interface AnimalListingData {
  animal: {
    id: number;
    name: string;
    species: string;
    breed: string | null;
    sex: string | null;
    birthDate: string | null;
    photoUrl: string | null;
  };
  privacySettings: AnimalPrivacySettings;
  registrations: RegistryItem[];
  health: {
    enabled: boolean;
    eligibleTraits: HealthTrait[];
    allTraits: Array<{ id: number; key: string; displayName: string; marketplaceVisible: boolean | null }>;
  };
  genetics: {
    enabled: boolean;
    data: GeneticsData | null;
  };
  titles: {
    enabled: boolean;
    showDetails: boolean;
    eligibleTitles: TitleItem[];
    allTitles: Array<{ id: number; abbreviation: string; isPublic: boolean | null }>;
  };
  competitions: {
    enabled: boolean;
    showDetails: boolean;
    eligibleCompetitions: CompetitionItem[];
    allCompetitions: Array<{ id: number; eventName: string; isPublic: boolean | null }>;
  };
  media: {
    enabled: boolean;
    items: MediaItem[];
  };
  documents: {
    enabled: boolean;
    items: DocumentItem[];
  };
  lineage: {
    sire: ParentInfo | null;
    dam: ParentInfo | null;
  };
  breeding: {
    enabled: boolean;
    offspringCount: number;
  };
}

/**
 * Get comprehensive animal data for Data Drawer
 * GET /api/v2/marketplace/animals/:id/listing-data
 */
export async function getAnimalListingData(
  tenantId: string,
  animalId: number
): Promise<AnimalListingData> {
  const response = await fetch(joinApi(`/api/v2/marketplace/animals/${animalId}/listing-data`), {
    credentials: "include",
    headers: { "X-Tenant-ID": tenantId },
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string }>(response);
    throw new ApiError(
      body?.message || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<AnimalListingData>(response);
  if (!data) {
    throw new ApiError("Failed to parse response", response.status);
  }

  return data;
}

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC LISTING - For viewing published listings (no auth required)
// ═══════════════════════════════════════════════════════════════════════════

export interface PublicListingResponse {
  listing: {
    id: number;
    slug: string;
    templateType: string;
    headline: string | null;
    title: string | null;
    summary: string | null;
    description: string | null;
    priceModel: string;
    priceCents: number | null;
    priceMinCents: number | null;
    priceMaxCents: number | null;
    locationCity: string | null;
    locationRegion: string | null;
    locationCountry: string | null;
    publishedAt: string | null;
    viewCount: number;
  };
  breeder: {
    id: number;
    slug: string | null;
    name: string;
    city: string | null;
    region: string | null;
    country: string | null;
  };
  animal: {
    id: number;
    name: string | null;
    species: string | null;
    breed: string | null;
    sex: string | null;
    birthDate: string | null;
    photoUrl: string | null;
  };
  data: {
    registrations?: Array<{
      id: number;
      registryName: string;
      identifier: string;
    }>;
    healthTests?: Array<{
      id: number;
      key: string;
      displayName: string;
      value: string;
    }>;
    genetics?: Array<{
      id: number;
      key: string;
      displayName: string;
      value: string;
    }>;
    titles?: Array<{
      id: number;
      name: string;
      abbreviation: string | null;
      dateEarned: string | null;
    }>;
    competitions?: Array<{
      id: number;
      eventName: string;
      placement: string | null;
      date: string | null;
    }>;
    media?: Array<{
      id: number;
      type: string;
      url: string;
      caption: string | null;
    }>;
    documents?: Array<{
      id: number;
      kind: string;
      filename: string;
      url: string;
    }>;
    lineage?: {
      sire?: {
        id: number;
        name: string;
        birthDate: string | null;
        photoUrl: string | null;
      };
      dam?: {
        id: number;
        name: string;
        birthDate: string | null;
        photoUrl: string | null;
      };
    };
    breeding?: {
      offspringCount: number;
    };
  };
}

/**
 * Fetch a public listing by slug (no authentication required)
 */
export async function getPublicListing(slug: string): Promise<PublicListingResponse> {
  const response = await fetch(joinApi(`/api/v2/marketplace/listings/${slug}`), {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    const body = await safeReadJson<{ error?: string; message?: string }>(response);
    throw new ApiError(
      body?.message || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<PublicListingResponse>(response);
  if (!data) {
    throw new ApiError("Failed to parse response", response.status);
  }

  return data;
}

// ═══════════════════════════════════════════════════════════════════════════
// MARKETPLACE ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════

/** Daily data point for sparkline charts */
export interface DailyDataPoint {
  date: string;
  value: number;
}

/** Stats for an individual program */
export interface ProgramStats {
  programId: number;
  programName: string;
  templateType: string;
  viewsThisMonth: number;
  viewsLastMonth: number;
  viewsThisWeek: number;
  viewsLastWeek: number;
  inquiriesThisMonth: number;
  inquiriesLastMonth: number;
  inquiriesThisWeek: number;
  inquiriesLastWeek: number;
  totalViews: number;
  totalInquiries: number;
  viewsTrend7d: DailyDataPoint[];
  viewsTrend30d: DailyDataPoint[];
  inquiriesTrend7d: DailyDataPoint[];
  isTrending: boolean;
  trendMultiplier?: number;
}

/** Stats for an individual listing */
export interface ListingStats {
  listingId: number;
  animalName: string;
  templateType: string;
  viewsThisMonth: number;
  viewsLastMonth: number;
  viewsThisWeek: number;
  viewsLastWeek: number;
  inquiriesThisMonth: number;
  inquiriesLastMonth: number;
  totalViews: number;
  totalInquiries: number;
  viewsTrend7d: DailyDataPoint[];
  viewsTrend30d: DailyDataPoint[];
  isTrending: boolean;
  trendMultiplier?: number;
}

/** Aggregate summary stats */
export interface PerformanceSummary {
  totalViewsThisMonth: number;
  totalViewsLastMonth: number;
  totalViewsThisWeek: number;
  totalViewsLastWeek: number;
  viewsChangePercent: number;
  totalInquiriesThisMonth: number;
  totalInquiriesLastMonth: number;
  totalInquiriesThisWeek: number;
  totalInquiriesLastWeek: number;
  inquiriesChangePercent: number;
  unansweredInquiries: number;
  responseRate: number;
  avgResponseTimeHours: number | null;
  viewsTrend7d: DailyDataPoint[];
  viewsTrend30d: DailyDataPoint[];
  topProgramId?: number;
  topProgramName?: string;
  topProgramViews?: number;
}

/** Insight item for actionable callouts */
export interface InsightItem {
  id: string;
  type: "success" | "warning" | "info" | "trending";
  icon: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
  priority: number;
}

/** Response from program analytics endpoint */
export interface ProgramAnalyticsResponse {
  summary: PerformanceSummary;
  programStats: ProgramStats[];
  insights: InsightItem[];
  generatedAt: string;
}

/** Response from listing analytics endpoint */
export interface ListingAnalyticsResponse {
  summary: PerformanceSummary;
  listingStats: ListingStats[];
  insights: InsightItem[];
  generatedAt: string;
}

/**
 * Get analytics for all animal programs
 * GET /api/v2/marketplace/analytics/programs
 */
export async function getProgramAnalytics(
  tenantId: string,
  params?: { period?: "week" | "month" }
): Promise<ProgramAnalyticsResponse> {
  const qs = new URLSearchParams();
  qs.append("tenantId", tenantId);
  if (params?.period) {
    qs.append("period", params.period);
  }

  const response = await fetch(joinApi(`/api/v2/marketplace/analytics/programs?${qs}`), {
    credentials: "include",
    headers: { "X-Tenant-ID": tenantId },
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string }>(response);
    throw new ApiError(
      body?.message || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<ProgramAnalyticsResponse>(response);
  if (!data) {
    // Return empty default response
    return {
      summary: {
        totalViewsThisMonth: 0,
        totalViewsLastMonth: 0,
        totalViewsThisWeek: 0,
        totalViewsLastWeek: 0,
        viewsChangePercent: 0,
        totalInquiriesThisMonth: 0,
        totalInquiriesLastMonth: 0,
        totalInquiriesThisWeek: 0,
        totalInquiriesLastWeek: 0,
        inquiriesChangePercent: 0,
        unansweredInquiries: 0,
        responseRate: 100,
        avgResponseTimeHours: null,
        viewsTrend7d: [],
        viewsTrend30d: [],
      },
      programStats: [],
      insights: [],
      generatedAt: new Date().toISOString(),
    };
  }
  return data;
}

/**
 * Get analytics for direct animal listings
 * GET /api/v2/marketplace/analytics/listings
 */
export async function getListingAnalytics(
  tenantId: string,
  params?: { period?: "week" | "month" }
): Promise<ListingAnalyticsResponse> {
  const qs = new URLSearchParams();
  qs.append("tenantId", tenantId);
  if (params?.period) {
    qs.append("period", params.period);
  }

  const response = await fetch(joinApi(`/api/v2/marketplace/analytics/listings?${qs}`), {
    credentials: "include",
    headers: { "X-Tenant-ID": tenantId },
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string }>(response);
    throw new ApiError(
      body?.message || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<ListingAnalyticsResponse>(response);
  if (!data) {
    return {
      summary: {
        totalViewsThisMonth: 0,
        totalViewsLastMonth: 0,
        totalViewsThisWeek: 0,
        totalViewsLastWeek: 0,
        viewsChangePercent: 0,
        totalInquiriesThisMonth: 0,
        totalInquiriesLastMonth: 0,
        totalInquiriesThisWeek: 0,
        totalInquiriesLastWeek: 0,
        inquiriesChangePercent: 0,
        unansweredInquiries: 0,
        responseRate: 100,
        avgResponseTimeHours: null,
        viewsTrend7d: [],
        viewsTrend30d: [],
      },
      listingStats: [],
      insights: [],
      generatedAt: new Date().toISOString(),
    };
  }
  return data;
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVICE ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════

export interface ServiceStats {
  serviceId: number;
  serviceName: string;
  serviceType: string;
  status: string;
  viewsThisMonth: number;
  viewsLastMonth: number;
  viewsChangePercent: number;
  inquiriesThisMonth: number;
  inquiriesLastMonth: number;
  inquiriesChangePercent: number;
  viewsTrend7d: DailyDataPoint[];
  isTrending: boolean;
  trendMultiplier: number | null;
  // Compatibility aliases for shared components
  programId: number;
  programName: string;
}

export interface ServiceAnalyticsResponse {
  summary: PerformanceSummary & {
    topServiceName: string | null;
    topServiceViews: number;
  };
  serviceStats: ServiceStats[];
  insights: InsightItem[];
  generatedAt: string;
}

/**
 * Get analytics for breeder service listings
 * GET /api/v2/marketplace/analytics/services
 */
export async function getServiceAnalytics(
  tenantId: string,
  params?: { period?: "week" | "month" }
): Promise<ServiceAnalyticsResponse> {
  const qs = new URLSearchParams();
  qs.append("tenantId", tenantId);
  if (params?.period) {
    qs.append("period", params.period);
  }

  const response = await fetch(joinApi(`/api/v2/marketplace/analytics/services?${qs}`), {
    credentials: "include",
    headers: { "X-Tenant-ID": tenantId },
  });

  if (!response.ok) {
    const body = await safeReadJson<{ message?: string }>(response);
    throw new ApiError(
      body?.message || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<ServiceAnalyticsResponse>(response);
  if (!data) {
    return {
      summary: {
        totalViewsThisMonth: 0,
        totalViewsLastMonth: 0,
        totalViewsThisWeek: 0,
        totalViewsLastWeek: 0,
        viewsChangePercent: 0,
        totalInquiriesThisMonth: 0,
        totalInquiriesLastMonth: 0,
        totalInquiriesThisWeek: 0,
        totalInquiriesLastWeek: 0,
        inquiriesChangePercent: 0,
        unansweredInquiries: 0,
        responseRate: 100,
        avgResponseTimeHours: null,
        viewsTrend7d: [],
        viewsTrend30d: [],
        topServiceName: null,
        topServiceViews: 0,
      },
      serviceStats: [],
      insights: [],
      generatedAt: new Date().toISOString(),
    };
  }
  return data;
}

// ═══════════════════════════════════════════════════════════════════════════
// BREEDING PROGRAM RULES
// ═══════════════════════════════════════════════════════════════════════════

export type BreedingRuleLevel = 'PROGRAM' | 'PLAN' | 'GROUP' | 'OFFSPRING';
export type BreedingRuleCategory = 'LISTING' | 'PRICING' | 'VISIBILITY' | 'BUYER_INTERACTION' | 'STATUS' | 'NOTIFICATIONS';

export interface BreedingProgramRule {
  id: number;
  tenantId: number;
  category: BreedingRuleCategory;
  ruleType: string;
  name: string;
  description: string | null;
  enabled: boolean;
  config: Record<string, any>;
  level: BreedingRuleLevel;
  levelId: string;
  inheritsFromId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface BreedingProgramRuleExecution {
  id: number;
  tenantId: number;
  ruleId: number;
  triggeredBy: string;
  entityType: string;
  entityId: number;
  success: boolean;
  action: string | null;
  changes: Record<string, any> | null;
  error: string | null;
  executedAt: string;
}

export interface CreateRuleParams {
  category: BreedingRuleCategory;
  ruleType: string;
  name: string;
  description?: string;
  enabled?: boolean;
  config?: Record<string, any>;
  level: BreedingRuleLevel;
  levelId: string;
  inheritsFromId?: number;
}

/**
 * Get breeding programs for tenant
 * GET /api/v1/breeding/programs
 */
export async function getBreedingPrograms(
  tenantId: string,
  params?: { species?: string; listed?: boolean; q?: string; page?: number; limit?: number }
): Promise<{ items: any[]; total: number; page: number; limit: number }> {
  devLogFetch("/api/v1/breeding/programs");

  const qs = new URLSearchParams();
  if (params?.species) qs.append("species", params.species);
  if (params?.listed !== undefined) qs.append("listed", String(params.listed));
  if (params?.q) qs.append("q", params.q);
  if (params?.page) qs.append("page", String(params.page));
  if (params?.limit) qs.append("limit", String(params.limit));

  const response = await fetch(
    joinApi(`/api/v1/breeding/programs?${qs}`),
    {
      credentials: "include",
      headers: { "X-Tenant-ID": tenantId },
    }
  );

  if (!response.ok) {
    const body = await safeReadJson<{ error?: string }>(response);
    throw new ApiError(
      body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<{ items: any[]; total: number; page: number; limit: number }>(response);
  return data || { items: [], total: 0, page: 1, limit: 25 };
}

/**
 * Sync breeding programs from marketplace profile to database
 * POST /api/v1/marketplace/profile/sync-programs
 */
export async function syncBreedingProgramsFromProfile(tenantId: string): Promise<void> {
  devLogFetch("/api/v1/marketplace/profile/sync-programs");

  // Get CSRF token from cookie (XSRF-TOKEN)
  const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];

  const headers: Record<string, string> = {
    "X-Tenant-ID": tenantId,
  };
  if (xsrf) {
    headers["x-csrf-token"] = decodeURIComponent(xsrf);
  }

  const response = await fetch(joinApi("/api/v1/marketplace/profile/sync-programs"), {
    method: "POST",
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    const body = await safeReadJson<{ error?: string }>(response);
    throw new ApiError(
      body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }
}

/**
 * Get effective rules for an entity (with inheritance resolved)
 * GET /api/v1/breeding/programs/rules/effective?level=&id=
 */
export async function getEffectiveRules(
  tenantId: string,
  level: BreedingRuleLevel,
  id: string
): Promise<{ level: string; id: string; rules: BreedingProgramRule[] }> {
  devLogFetch(`/api/v1/breeding/programs/rules/effective?level=${level}&id=${id}`);

  const response = await fetch(
    joinApi(`/api/v1/breeding/programs/rules/effective?level=${level}&id=${id}`),
    {
      credentials: "include",
      headers: { "X-Tenant-ID": tenantId },
    }
  );

  if (!response.ok) {
    const body = await safeReadJson<{ error?: string }>(response);
    throw new ApiError(
      body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<{ level: string; id: string; rules: BreedingProgramRule[] }>(response);
  return data || { level, id, rules: [] };
}

/**
 * Get all rules for a specific level/entity
 * GET /api/v1/breeding/programs/rules?level=&levelId=&category=&enabled=
 */
export async function getBreedingProgramRules(
  tenantId: string,
  params?: {
    level?: BreedingRuleLevel;
    levelId?: string;
    category?: BreedingRuleCategory;
    enabled?: boolean;
  }
): Promise<{ rules: BreedingProgramRule[] }> {
  devLogFetch("/api/v1/breeding/programs/rules");

  const qs = new URLSearchParams();
  if (params?.level) qs.append("level", params.level);
  if (params?.levelId) qs.append("levelId", params.levelId);
  if (params?.category) qs.append("category", params.category);
  if (params?.enabled !== undefined) qs.append("enabled", String(params.enabled));

  const response = await fetch(
    joinApi(`/api/v1/breeding/programs/rules?${qs}`),
    {
      credentials: "include",
      headers: { "X-Tenant-ID": tenantId },
    }
  );

  if (!response.ok) {
    const body = await safeReadJson<{ error?: string }>(response);
    throw new ApiError(
      body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<{ rules: BreedingProgramRule[] }>(response);
  return data || { rules: [] };
}

/**
 * Get a specific rule by ID
 * GET /api/v1/breeding/programs/rules/:id
 */
export async function getBreedingProgramRule(
  tenantId: string,
  ruleId: number
): Promise<{ rule: BreedingProgramRule }> {
  devLogFetch(`/api/v1/breeding/programs/rules/${ruleId}`);

  const response = await fetch(
    joinApi(`/api/v1/breeding/programs/rules/${ruleId}`),
    {
      credentials: "include",
      headers: { "X-Tenant-ID": tenantId },
    }
  );

  if (!response.ok) {
    const body = await safeReadJson<{ error?: string }>(response);
    throw new ApiError(
      body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<{ rule: BreedingProgramRule }>(response);
  if (!data) {
    throw new ApiError("Failed to parse response", 500);
  }
  return data;
}

/**
 * Create or update a breeding program rule
 * POST /api/v1/breeding/programs/rules
 */
export async function createOrUpdateBreedingProgramRule(
  tenantId: string,
  params: CreateRuleParams
): Promise<{ rule: BreedingProgramRule }> {
  const response = await fetch(joinApi("/api/v1/breeding/programs/rules"), {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Tenant-ID": tenantId,
      "X-CSRF-Token": getCsrfToken() || "",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const body = await safeReadJson<{ error?: string }>(response);
    throw new ApiError(
      body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<{ rule: BreedingProgramRule }>(response);
  if (!data) {
    throw new ApiError("Failed to parse response", 500);
  }
  return data;
}

/**
 * Create an override for a rule at a more specific level
 * POST /api/v1/breeding/programs/rules/:id/override
 */
export async function overrideBreedingProgramRule(
  tenantId: string,
  ruleId: number,
  params: {
    level: BreedingRuleLevel;
    levelId: string;
    enabled?: boolean;
    config?: Record<string, any>;
  }
): Promise<{ override: BreedingProgramRule }> {
  const response = await fetch(
    joinApi(`/api/v1/breeding/programs/rules/${ruleId}/override`),
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": tenantId,
        "X-CSRF-Token": getCsrfToken() || "",
      },
      body: JSON.stringify(params),
    }
  );

  if (!response.ok) {
    const body = await safeReadJson<{ error?: string }>(response);
    throw new ApiError(
      body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<{ override: BreedingProgramRule }>(response);
  if (!data) {
    throw new ApiError("Failed to parse response", 500);
  }
  return data;
}

/**
 * Delete a breeding program rule
 * DELETE /api/v1/breeding/programs/rules/:id
 */
export async function deleteBreedingProgramRule(
  tenantId: string,
  ruleId: number
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(
    joinApi(`/api/v1/breeding/programs/rules/${ruleId}`),
    {
      method: "DELETE",
      credentials: "include",
      headers: {
        "X-Tenant-ID": tenantId,
        "X-CSRF-Token": getCsrfToken() || "",
      },
    }
  );

  if (!response.ok) {
    const body = await safeReadJson<{ error?: string }>(response);
    throw new ApiError(
      body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<{ success: boolean; message: string }>(response);
  return data || { success: true, message: "Rule deleted" };
}

/**
 * Toggle a rule enabled/disabled
 * PATCH /api/v1/breeding/programs/rules/:id/toggle
 */
export async function toggleBreedingProgramRule(
  tenantId: string,
  ruleId: number
): Promise<{ rule: BreedingProgramRule }> {
  const response = await fetch(
    joinApi(`/api/v1/breeding/programs/rules/${ruleId}/toggle`),
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "X-Tenant-ID": tenantId,
        "X-CSRF-Token": getCsrfToken() || "",
      },
    }
  );

  if (!response.ok) {
    const body = await safeReadJson<{ error?: string }>(response);
    throw new ApiError(
      body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<{ rule: BreedingProgramRule }>(response);
  if (!data) {
    throw new ApiError("Failed to parse response", 500);
  }
  return data;
}

/**
 * Disable inheritance from a specific level by creating disabled overrides
 * POST /api/v1/breeding/programs/rules/disable-inheritance
 */
export async function disableRuleInheritance(
  tenantId: string,
  currentLevel: BreedingRuleLevel,
  currentLevelId: string,
  fromLevel: BreedingRuleLevel
): Promise<{ success: boolean; overridesCreated: number; overrides: BreedingProgramRule[] }> {
  const response = await fetch(
    joinApi("/api/v1/breeding/programs/rules/disable-inheritance"),
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": tenantId,
        "X-CSRF-Token": getCsrfToken() || "",
      },
      body: JSON.stringify({ currentLevel, currentLevelId, fromLevel }),
    }
  );

  if (!response.ok) {
    const body = await safeReadJson<{ error?: string }>(response);
    throw new ApiError(
      body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<{ success: boolean; overridesCreated: number; overrides: BreedingProgramRule[] }>(response);
  return data || { success: true, overridesCreated: 0, overrides: [] };
}

/**
 * Manually execute all rules for an entity (for testing/debugging)
 * POST /api/v1/breeding/programs/rules/execute
 */
export async function executeBreedingProgramRules(
  tenantId: string,
  level: BreedingRuleLevel,
  id: string | number
): Promise<{ success: boolean; results: any[] }> {
  const response = await fetch(
    joinApi("/api/v1/breeding/programs/rules/execute"),
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": tenantId,
        "X-CSRF-Token": getCsrfToken() || "",
      },
      body: JSON.stringify({ level, id }),
    }
  );

  if (!response.ok) {
    const body = await safeReadJson<{ error?: string }>(response);
    throw new ApiError(
      body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<{ success: boolean; results: any[] }>(response);
  return data || { success: false, results: [] };
}

/**
 * Get execution history for a rule
 * GET /api/v1/breeding/programs/rules/:id/executions?limit=&offset=
 */
export async function getBreedingProgramRuleExecutions(
  tenantId: string,
  ruleId: number,
  params?: { limit?: number; offset?: number }
): Promise<{
  executions: BreedingProgramRuleExecution[];
  total: number;
  limit: number;
  offset: number;
}> {
  devLogFetch(`/api/v1/breeding/programs/rules/${ruleId}/executions`);

  const qs = new URLSearchParams();
  if (params?.limit) qs.append("limit", String(params.limit));
  if (params?.offset) qs.append("offset", String(params.offset));

  const response = await fetch(
    joinApi(`/api/v1/breeding/programs/rules/${ruleId}/executions?${qs}`),
    {
      credentials: "include",
      headers: { "X-Tenant-ID": tenantId },
    }
  );

  if (!response.ok) {
    const body = await safeReadJson<{ error?: string }>(response);
    throw new ApiError(
      body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<{
    executions: BreedingProgramRuleExecution[];
    total: number;
    limit: number;
    offset: number;
  }>(response);
  return data || { executions: [], total: 0, limit: params?.limit || 50, offset: params?.offset || 0 };
}

/**
 * Get the inheritance chain for an entity (debugging)
 * GET /api/v1/breeding/programs/rules/chain?level=&id=
 */
export async function getBreedingProgramRuleChain(
  tenantId: string,
  level: BreedingRuleLevel,
  id: string
): Promise<{ chain: Array<{ level: BreedingRuleLevel; id: string | number }> }> {
  devLogFetch(`/api/v1/breeding/programs/rules/chain?level=${level}&id=${id}`);

  const response = await fetch(
    joinApi(`/api/v1/breeding/programs/rules/chain?level=${level}&id=${id}`),
    {
      credentials: "include",
      headers: { "X-Tenant-ID": tenantId },
    }
  );

  if (!response.ok) {
    const body = await safeReadJson<{ error?: string }>(response);
    throw new ApiError(
      body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<{
    chain: Array<{ level: BreedingRuleLevel; id: string | number }>;
  }>(response);
  return data || { chain: [] };
}

// ============================================================================
// Verification & 2FA API
// ============================================================================

export type TwoFactorMethod = "PASSKEY" | "TOTP" | "SMS";
export type ServiceProviderVerificationTier =
  | "LISTED"
  | "IDENTITY_VERIFIED"
  | "VERIFIED_PROFESSIONAL"
  | "ACCREDITED_PROVIDER";

export interface TwoFactorStatus {
  enabled: boolean;
  method: TwoFactorMethod | null;
  enabledAt: string | null;
  availableMethods: {
    passkey: boolean;
    totp: boolean;
    sms: boolean;
  };
}

export interface VerificationBadges {
  quickResponder: boolean;
  established: boolean;
  topRated: boolean;
  trusted: boolean;
  acceptsPayments: boolean;
}

export interface VerificationPackageStatus {
  active: boolean;
  purchasedAt: string | null;
  approvedAt: string | null;
  expiresAt: string | null;
}

export interface VerificationPendingRequest {
  id: number;
  packageType: "VERIFIED" | "ACCREDITED";
  status: "PENDING" | "IN_REVIEW" | "NEEDS_INFO";
  createdAt: string;
  infoRequestNote: string | null;
}

export interface UserVerificationStatus {
  tier: ServiceProviderVerificationTier;
  tierAchievedAt: string | null;
  phoneVerified: boolean;
  phoneVerifiedAt: string | null;
  identityVerified: boolean;
  identityVerifiedAt: string | null;
  verifiedPackage: VerificationPackageStatus;
  accreditedPackage: VerificationPackageStatus;
  badges: VerificationBadges;
  pendingRequest: VerificationPendingRequest | null;
}

export interface TOTPSetupResponse {
  ok: boolean;
  secret: string;
  otpauthUrl: string;
}

export interface IdentityVerificationStartResponse {
  ok: boolean;
  sessionId: string;
  clientSecret: string;
}

/**
 * Get 2FA status for current user
 * GET /api/v1/marketplace/2fa/status
 */
export async function get2FAStatus(): Promise<TwoFactorStatus> {
  devLogFetch("/api/v1/marketplace/2fa/status");

  const response = await fetch(joinApi("/api/v1/marketplace/2fa/status"), {
    credentials: "include",
  });

  if (!response.ok) {
    const body = await safeReadJson<{ error?: string }>(response);
    throw new ApiError(
      body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<TwoFactorStatus>(response);
  if (!data) {
    throw new ApiError("Failed to parse 2FA status response", 500);
  }
  return data;
}

/**
 * Setup TOTP (Authenticator App)
 * POST /api/v1/marketplace/2fa/totp/setup
 */
export async function setupTOTP(): Promise<TOTPSetupResponse> {
  const response = await fetch(joinApi("/api/v1/marketplace/2fa/totp/setup"), {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": getCsrfToken() || "",
    },
  });

  if (!response.ok) {
    const body = await safeReadJson<{ error?: string }>(response);
    throw new ApiError(
      body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<TOTPSetupResponse>(response);
  if (!data) {
    throw new ApiError("Failed to parse TOTP setup response", 500);
  }
  return data;
}

/**
 * Verify TOTP code and enable 2FA
 * POST /api/v1/marketplace/2fa/totp/verify
 */
export async function verifyTOTP(code: string): Promise<{ ok: boolean; method: TwoFactorMethod }> {
  const response = await fetch(joinApi("/api/v1/marketplace/2fa/totp/verify"), {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": getCsrfToken() || "",
    },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    const body = await safeReadJson<{ error?: string }>(response);
    throw new ApiError(
      body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<{ ok: boolean; method: TwoFactorMethod }>(response);
  if (!data) {
    throw new ApiError("Failed to parse TOTP verify response", 500);
  }
  return data;
}

/**
 * Get user verification status
 * GET /api/v1/marketplace/verification/users/status
 */
export async function getUserVerificationStatus(): Promise<UserVerificationStatus> {
  devLogFetch("/api/v1/marketplace/verification/users/status");

  const response = await fetch(joinApi("/api/v1/marketplace/verification/users/status"), {
    credentials: "include",
  });

  if (!response.ok) {
    const body = await safeReadJson<{ error?: string }>(response);
    throw new ApiError(
      body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<UserVerificationStatus>(response);
  if (!data) {
    throw new ApiError("Failed to parse verification status response", 500);
  }
  return data;
}

/**
 * Start identity verification (Stripe Identity)
 * POST /api/v1/marketplace/verification/users/identity/start
 */
export async function startIdentityVerification(): Promise<IdentityVerificationStartResponse> {
  const response = await fetch(joinApi("/api/v1/marketplace/verification/users/identity/start"), {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": getCsrfToken() || "",
    },
  });

  if (!response.ok) {
    const body = await safeReadJson<{ error?: string; message?: string }>(response);
    throw new ApiError(
      body?.message || body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<IdentityVerificationStartResponse>(response);
  if (!data) {
    throw new ApiError("Failed to parse identity verification response", 500);
  }
  return data;
}

/**
 * Purchase verification package
 * POST /api/v1/marketplace/verification/users/package/purchase
 */
export async function purchaseVerificationPackage(
  packageType: "VERIFIED" | "ACCREDITED",
  submittedInfo: Record<string, any>
): Promise<{
  ok: boolean;
  requestId: number;
  status: string;
  packageType: string;
  amountPaidCents: number;
}> {
  const response = await fetch(joinApi("/api/v1/marketplace/verification/users/package/purchase"), {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": getCsrfToken() || "",
    },
    body: JSON.stringify({ packageType, submittedInfo }),
  });

  if (!response.ok) {
    const body = await safeReadJson<{ error?: string; message?: string }>(response);
    throw new ApiError(
      body?.message || body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<{
    ok: boolean;
    requestId: number;
    status: string;
    packageType: string;
    amountPaidCents: number;
  }>(response);
  if (!data) {
    throw new ApiError("Failed to parse purchase response", 500);
  }
  return data;
}

// ============================================================================
// Abuse Reporting API
// ============================================================================

export interface ListingReportInput {
  listingId: number;
  reason: string;
  description: string;
}

/**
 * Report a service listing for abuse/fraud
 * POST /api/v1/marketplace/listings/report
 */
export async function reportServiceListing(
  listingId: number,
  reason: string,
  description: string
): Promise<{ ok: boolean; reportId: number }> {
  const response = await fetch(joinApi("/api/v1/marketplace/listings/report"), {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": getCsrfToken() || "",
    },
    body: JSON.stringify({ listingId, reason, description }),
  });

  if (!response.ok) {
    const body = await safeReadJson<{ error?: string; message?: string }>(response);
    throw new ApiError(
      body?.message || body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<{ ok: boolean; reportId: number }>(response);
  if (!data) {
    throw new ApiError("Failed to parse report response", 500);
  }
  return data;
}

// ============================================================================
// Admin Moderation API
// ============================================================================

export interface ListingReport {
  id: number;
  listingId: number;
  listingTitle: string;
  listingSlug: string | null;
  reason: "FRAUD" | "SPAM" | "INAPPROPRIATE" | "MISLEADING" | "PROHIBITED" | "COPYRIGHT" | "OTHER";
  description: string;
  status: "PENDING" | "REVIEWED" | "ACTIONED" | "DISMISSED";
  reporterEmail: string;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  reviewNotes: string | null;
}

export interface ListingReportsResponse {
  reports: ListingReport[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Get listing reports for moderation (admin only)
 * GET /api/v1/marketplace/admin/listing-reports
 */
export async function getListingReports(
  status?: "PENDING" | "REVIEWED" | "ACTIONED" | "DISMISSED",
  limit: number = 25,
  offset: number = 0
): Promise<ListingReportsResponse> {
  const params = new URLSearchParams();
  if (status) params.append("status", status);
  params.append("limit", limit.toString());
  params.append("offset", offset.toString());

  const path = `/api/v1/marketplace/admin/listing-reports?${params.toString()}`;
  devLogFetch(path);

  const response = await fetch(joinApi(path), {
    method: "GET",
    credentials: "include",
    headers: {
      "X-CSRF-Token": getCsrfToken() || "",
    },
  });

  if (!response.ok) {
    const body = await safeReadJson<{ error?: string; message?: string }>(response);
    throw new ApiError(
      body?.message || body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<ListingReportsResponse>(response);
  if (!data) {
    throw new ApiError("Failed to parse reports response", 500);
  }
  return data;
}

/**
 * Update report status (admin only)
 * PUT /api/v1/marketplace/admin/listing-reports/:reportId
 */
export async function updateReportStatus(
  reportId: number,
  status: "PENDING" | "REVIEWED" | "ACTIONED" | "DISMISSED",
  reviewNotes: string
): Promise<{ ok: boolean }> {
  const response = await fetch(joinApi(`/api/v1/marketplace/admin/listing-reports/${reportId}`), {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": getCsrfToken() || "",
    },
    body: JSON.stringify({ status, reviewNotes }),
  });

  if (!response.ok) {
    const body = await safeReadJson<{ error?: string; message?: string }>(response);
    throw new ApiError(
      body?.message || body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<{ ok: boolean }>(response);
  if (!data) {
    throw new ApiError("Failed to parse update response", 500);
  }
  return data;
}

// ============================================================================
// S3 Image Upload API
// ============================================================================

export interface PresignedUploadResponse {
  uploadUrl: string;
  cdnUrl: string;
  key: string;
  expiresIn: number;
}

/**
 * Get presigned S3 URL for image upload
 * POST /api/v1/marketplace/images/upload-url
 */
export async function getPresignedUploadUrl(
  filename: string,
  contentType: string,
  context: "service_listing" | "profile_photo" | "breeding_animal" = "service_listing"
): Promise<PresignedUploadResponse> {
  const response = await fetch(joinApi("/api/v1/marketplace/images/upload-url"), {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": getCsrfToken() || "",
    },
    body: JSON.stringify({ filename, contentType, context }),
  });

  if (!response.ok) {
    const body = await safeReadJson<{ error?: string; message?: string }>(response);
    throw new ApiError(
      body?.message || body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<PresignedUploadResponse>(response);
  if (!data) {
    throw new ApiError("Failed to parse presigned URL response", 500);
  }
  return data;
}

/**
 * Upload image directly to S3 using presigned URL
 */
export async function uploadImageToS3(
  presignedUrl: string,
  file: File
): Promise<void> {
  const response = await fetch(presignedUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
  });

  if (!response.ok) {
    throw new ApiError(`S3 upload failed with status ${response.status}`, response.status);
  }
}

/**
 * Delete image from S3
 * DELETE /api/v1/marketplace/images/:key
 */
export async function deleteImageFromS3(key: string): Promise<{ ok: boolean }> {
  // Encode the key for URL
  const encodedKey = encodeURIComponent(key);

  const response = await fetch(joinApi(`/api/v1/marketplace/images/${encodedKey}`), {
    method: "DELETE",
    credentials: "include",
    headers: {
      "X-CSRF-Token": getCsrfToken() || "",
    },
  });

  if (!response.ok) {
    const body = await safeReadJson<{ error?: string; message?: string }>(response);
    throw new ApiError(
      body?.message || body?.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  const data = await safeReadJson<{ ok: boolean }>(response);
  return data || { ok: true };
}
