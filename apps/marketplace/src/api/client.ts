// apps/marketplace/src/api/client.ts

import type {
  ProgramsResponse,
  PublicProgramDTO,
  ListingsResponse,
  ListingDetailDTO,
} from "./types";

/**
 * API client utilities for marketplace.
 */

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

  const { data } = await apiGet<ProgramsResponse>(path);
  return data;
}

export async function getProgram(programSlug: string): Promise<PublicProgramDTO> {
  const path = `/api/v1/public/marketplace/programs/${encodeURIComponent(programSlug)}`;
  const { data } = await apiGet<PublicProgramDTO>(path);
  return data;
}

export async function getProgramListings(programSlug: string): Promise<ListingsResponse> {
  const path = `/api/v1/public/marketplace/programs/${encodeURIComponent(programSlug)}/offspring-groups`;
  const { data } = await apiGet<ListingsResponse>(path);
  return data;
}

export async function getListing(
  programSlug: string,
  listingSlug: string
): Promise<ListingDetailDTO> {
  const path = `/api/v1/public/marketplace/programs/${encodeURIComponent(programSlug)}/offspring-groups/${encodeURIComponent(listingSlug)}`;
  const { data } = await apiGet<ListingDetailDTO>(path);
  return data;
}
