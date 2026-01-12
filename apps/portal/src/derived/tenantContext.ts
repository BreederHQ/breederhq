// apps/portal/src/derived/tenantContext.ts
// Centralized tenant context for portal API calls.
// Uses React Context to provide tenant ID to components after session load.

import * as React from "react";

/**
 * Tenant context type for portal applications.
 */
export interface TenantContextValue {
  tenantId: number | null;
  tenantSlug: string | null;
  isReady: boolean;
}

/**
 * React Context for tenant information.
 * Components can consume this to access tenant ID for API calls.
 */
const TenantContext = React.createContext<TenantContextValue>({
  tenantId: null,
  tenantSlug: null,
  isReady: false,
});

/**
 * Hook to access tenant context.
 * Returns { tenantId, tenantSlug, isReady }.
 * Components should check isReady before making API calls.
 */
export function useTenantContext(): TenantContextValue {
  return React.useContext(TenantContext);
}

/**
 * Provider component for tenant context.
 * Wraps children and provides tenant ID/slug from session data.
 */
interface TenantProviderProps {
  tenantId: number | null;
  tenantSlug: string | null;
  children: React.ReactNode;
}

export function TenantProvider({ tenantId, tenantSlug, children }: TenantProviderProps) {
  const value = React.useMemo(
    () => ({
      tenantId,
      tenantSlug,
      isReady: tenantId !== null,
    }),
    [tenantId, tenantSlug]
  );

  return React.createElement(TenantContext.Provider, { value }, children);
}

// Module-level cache for non-React contexts (scheduling.ts, diagnostics, etc.)
let _tenantId: number | null = null;
let _tenantSlug: string | null = null;

/**
 * Set the tenant context (called by AuthGate after session load).
 * This updates both the module-level cache and should trigger provider update.
 */
export function setTenantContext(id: number | null, slug: string | null): void {
  _tenantId = id;
  _tenantSlug = slug;
}

/**
 * Get the current tenant ID from module cache.
 * Prefer useTenantContext() in React components.
 */
export function getTenantId(): number | null {
  return _tenantId;
}

/**
 * Get the current tenant slug from module cache.
 * Prefer useTenantContext() in React components.
 */
export function getTenantSlug(): string | null {
  return _tenantSlug;
}

/**
 * Build API path for portal requests.
 * Routes are at /api/v1/t/:slug/portal/* (tenant slug in URL path).
 * Backend middleware extracts tenant context from URL slug.
 * @param endpoint - API endpoint (e.g., "/portal/agreements")
 * @param tenantSlug - Tenant slug for URL path
 * @returns Full API path (e.g., "/api/v1/t/acme/portal/agreements")
 */
export function buildApiPath(endpoint: string, tenantSlug: string | null): string {
  if (!tenantSlug) {
    // Fallback for tenantless routes (auth, session, etc.)
    return `/api/v1${endpoint}`;
  }
  return `/api/v1/t/${tenantSlug}${endpoint}`;
}

/**
 * Fetch helper for tenant-scoped portal API calls.
 * Includes tenant slug in URL path for backend context derivation.
 * @param endpoint - API endpoint (e.g., "/portal/agreements")
 * @param options - Optional fetch options (method, body, headers, etc.)
 */
export async function portalFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const tenantSlug = getTenantSlug();
  const url = buildApiPath(endpoint, tenantSlug);

  if (!tenantSlug) {
    console.warn("[tenantContext] No tenant slug available for API call:", endpoint);
  }

  // Build headers
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  // Merge with any provided headers
  const mergedHeaders = {
    ...headers,
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(url, {
    credentials: "include",
    ...options,
    headers: mergedHeaders,
  });

  if (!res.ok) {
    const error = new Error(`API error: ${res.status} ${res.statusText}`) as any;
    error.status = res.status;
    throw error;
  }
  return res.json();
}

/**
 * Get CSRF token from cookie
 */
function getCsrfToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Create a portalFetch function bound to a specific tenant slug.
 * Use this when you have tenant context from React Context.
 * @param tenantSlug - Tenant slug for URL path (e.g., "acme")
 */
export function createPortalFetch(tenantSlug: string | null) {
  return async function boundPortalFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = buildApiPath(endpoint, tenantSlug);

    // Build headers
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    // Add CSRF token for mutating requests (POST, PUT, PATCH, DELETE)
    const method = (options.method || "GET").toUpperCase();
    if (method !== "GET" && method !== "HEAD") {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        headers["x-csrf-token"] = csrfToken;
      }
    }

    // Merge with any provided headers
    const mergedHeaders = {
      ...headers,
      ...(options.headers as Record<string, string> || {}),
    };

    const res = await fetch(url, {
      credentials: "include",
      ...options,
      headers: mergedHeaders,
    });

    if (!res.ok) {
      const error = new Error(`API error: ${res.status} ${res.statusText}`) as any;
      error.status = res.status;
      throw error;
    }
    return res.json();
  };
}
