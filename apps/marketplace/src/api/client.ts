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
  const path = `/api/v1/public/marketplace/programs${queryStr ? `?${queryStr}` : ""}`;

  devLogFetch(path);
  const { data } = await apiGet<ProgramsResponse>(path);
  return data;
}

export async function getProgram(programSlug: string): Promise<PublicProgramDTO> {
  const path = `/api/v1/public/marketplace/programs/${encodeURIComponent(programSlug)}`;
  devLogFetch(path);
  const { data } = await apiGet<PublicProgramDTO>(path);
  return data;
}

export async function getProgramListings(programSlug: string): Promise<ListingsResponse> {
  const path = `/api/v1/public/marketplace/programs/${encodeURIComponent(programSlug)}/offspring-groups`;
  devLogFetch(path);
  const { data } = await apiGet<ListingsResponse>(path);
  return data;
}

export async function getListing(
  programSlug: string,
  listingSlug: string
): Promise<ListingDetailDTO> {
  const path = `/api/v1/public/marketplace/programs/${encodeURIComponent(programSlug)}/offspring-groups/${encodeURIComponent(listingSlug)}`;
  devLogFetch(path);
  const { data } = await apiGet<ListingDetailDTO>(path);
  return data;
}

export interface InquiryPayload {
  message: string;
}

export interface InquiryResponse {
  success: boolean;
  inquiryId?: string;
}

/**
 * Submit an inquiry for a listing. Requires authentication.
 */
export async function submitInquiry(
  programSlug: string,
  listingSlug: string,
  payload: InquiryPayload
): Promise<InquiryResponse> {
  const path = `/api/v1/marketplace/programs/${encodeURIComponent(programSlug)}/offspring-groups/${encodeURIComponent(listingSlug)}/inquiries`;
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
  if (params.limit != null) query.set("limit", String(params.limit));
  if (params.offset != null) query.set("offset", String(params.offset));

  const queryStr = query.toString();
  const path = `/api/v1/public/marketplace/animals${queryStr ? `?${queryStr}` : ""}`;

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
  const path = `/api/v1/public/marketplace/programs/${encodeURIComponent(programSlug)}/animals/${encodeURIComponent(listingSlug)}`;
  devLogFetch(path);
  const { data } = await apiGet<PublicAnimalListingDTO>(path);
  return data;
}

/**
 * Submit an inquiry for an animal listing. Requires authentication.
 */
export async function submitAnimalInquiry(
  programSlug: string,
  listingSlug: string,
  payload: InquiryPayload
): Promise<InquiryResponse> {
  const path = `/api/v1/marketplace/programs/${encodeURIComponent(programSlug)}/animals/${encodeURIComponent(listingSlug)}/inquiries`;
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
