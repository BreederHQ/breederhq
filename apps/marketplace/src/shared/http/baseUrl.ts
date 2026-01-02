// apps/marketplace/src/shared/http/baseUrl.ts
// Centralized API base URL resolution for marketplace.
// Ensures all API calls use the same origin.

/**
 * Get the API base URL.
 * Uses VITE_API_URL if set, otherwise same-origin (empty string).
 */
export function getApiBase(): string {
  const envUrl = (import.meta as any)?.env?.VITE_API_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.trim() !== "") {
    // Remove trailing slash if present
    return envUrl.trim().replace(/\/+$/, "");
  }
  return "";
}

/**
 * Join API base URL with a path, avoiding double slashes.
 * @param path - The API path (e.g., "/api/v1/auth/login")
 * @returns Full URL (e.g., "https://api.example.com/api/v1/auth/login" or "/api/v1/auth/login")
 */
export function joinApi(path: string): string {
  const base = getApiBase();
  if (!base) {
    // Same-origin, just return the path
    return path;
  }
  // Ensure path starts with /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}
