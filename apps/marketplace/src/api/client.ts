// apps/marketplace/src/api/client.ts

import type {
  ProgramsResponse,
  PublicProgramDTO,
  ListingsResponse,
  ListingDetailDTO,
  AnimalListingsResponse,
  PublicAnimalListingDTO,
} from "./types";

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
 * Get API base URL from environment or use relative path.
 */
export function getApiBase(): string {
  const envUrl = (import.meta as any)?.env?.VITE_API_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.trim() !== "") {
    return envUrl.trim().replace(/\/+$/, "");
  }
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
  const match = document.cookie.match(/(?:^|;\s*)csrfToken=([^;]*)/);
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
  createdAt: string;
  _count?: { breedingPlans: number };
}

export interface BreedingProgramDetail extends BreedingProgramListItem {
  tenantId: number;
  description?: string | null;
  pricingTiers?: ProgramPricingTier[] | null;
  whatsIncluded?: string | null;
  typicalWaitTime?: string | null;
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
  description?: string | null;
  listed?: boolean;
  acceptInquiries?: boolean;
  openWaitlist?: boolean;
  acceptReservations?: boolean;
  pricingTiers?: ProgramPricingTier[] | null;
  whatsIncluded?: string | null;
  typicalWaitTime?: string | null;
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
  params: { status?: string; type?: string } = {}
): Promise<ServiceListingsResponse> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.type) query.set("type", params.type);

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
