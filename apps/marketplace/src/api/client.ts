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
  status: BreedingPlanStatus;
  species: string;
  breedText: string | null;
  // Parents
  damId: number | null;
  sireId: number | null;
  dam?: { id: number; name: string; photoUrl?: string | null } | null;
  sire?: { id: number; name: string; photoUrl?: string | null } | null;
  // Dates
  expectedBirthDate: string | null;
  birthDateActual: string | null;
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
  params: { status?: string; programId?: string; limit?: number } = {}
): Promise<BreederBreedingPlansResponse> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.programId) query.set("programId", params.programId);
  if (params.limit) query.set("limit", params.limit.toString());
  query.set("include", "dam,sire");

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
