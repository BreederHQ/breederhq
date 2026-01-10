// packages/ui/src/utils/collarSettings.ts
// Utilities for fetching and saving whelping collar color settings

import type {
  CollarSettingsConfig,
  CollarColorOption,
} from "@bhq/api";
import {
  DEFAULT_COLLAR_SETTINGS,
  DEFAULT_COLLAR_COLORS,
} from "@bhq/api";

const SETTINGS_NAMESPACE = "offspring-collar-settings";

/**
 * Read the CSRF token from the XSRF-TOKEN cookie.
 */
function readCsrfToken(): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(^|;\s*)XSRF-TOKEN=([^;]*)/);
  return m ? decodeURIComponent(m[2]) : "";
}

// In-memory cache for collar settings
let cachedSettings: CollarSettingsConfig | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Merge saved settings with defaults to ensure all default colors exist.
 * Custom colors are preserved, default colors are updated if missing.
 */
function mergeWithDefaults(saved: Partial<CollarSettingsConfig>): CollarSettingsConfig {
  const savedColors = saved.colors ?? [];
  const savedColorIds = new Set(savedColors.map((c) => c.id));

  // Start with saved colors
  const mergedColors: CollarColorOption[] = [...savedColors];

  // Add any missing default colors (in case new defaults are added)
  for (const defaultColor of DEFAULT_COLLAR_COLORS) {
    if (!savedColorIds.has(defaultColor.id)) {
      mergedColors.push(defaultColor);
    }
  }

  // Sort by sortOrder
  mergedColors.sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    colors: mergedColors,
  };
}

/**
 * Fetch the tenant's collar settings configuration.
 * Returns defaults if not configured.
 */
export async function fetchCollarSettings(
  tenantId?: string | number
): Promise<CollarSettingsConfig> {
  if (!tenantId) {
    return DEFAULT_COLLAR_SETTINGS;
  }

  // Check cache
  if (cachedSettings && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return cachedSettings;
  }

  try {
    const res = await fetch(
      `/api/v1/tenants/${encodeURIComponent(String(tenantId))}/settings/${SETTINGS_NAMESPACE}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
          "x-tenant-id": String(tenantId),
        },
      }
    );

    if (!res.ok) {
      if (res.status === 404) {
        // No config saved yet, return defaults
        cachedSettings = DEFAULT_COLLAR_SETTINGS;
        cacheTimestamp = Date.now();
        return DEFAULT_COLLAR_SETTINGS;
      }
      throw new Error(`Failed to fetch collar settings: ${res.status}`);
    }

    const json = await res.json();
    const merged = mergeWithDefaults(json.data ?? json);
    cachedSettings = merged;
    cacheTimestamp = Date.now();
    return merged;
  } catch (error) {
    console.warn("Failed to fetch collar settings, using defaults:", error);
    return DEFAULT_COLLAR_SETTINGS;
  }
}

/**
 * Save the tenant's collar settings configuration.
 */
export async function saveCollarSettings(
  config: CollarSettingsConfig,
  tenantId: string | number
): Promise<CollarSettingsConfig> {
  const csrfToken = readCsrfToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
    "x-tenant-id": String(tenantId),
  };
  if (csrfToken) {
    headers["x-csrf-token"] = csrfToken;
  }

  const res = await fetch(
    `/api/v1/tenants/${encodeURIComponent(String(tenantId))}/settings/${SETTINGS_NAMESPACE}`,
    {
      method: "PUT",
      credentials: "include",
      headers,
      body: JSON.stringify(config),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to save collar settings: ${res.status} - ${text}`);
  }

  const json = await res.json();
  const saved = mergeWithDefaults(json.data ?? json);

  // Update cache
  cachedSettings = saved;
  cacheTimestamp = Date.now();

  return saved;
}

/**
 * Get cached collar settings synchronously.
 * Returns null if not yet loaded - use fetchCollarSettings first.
 */
export function getCachedCollarSettings(): CollarSettingsConfig | null {
  if (cachedSettings && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return cachedSettings;
  }
  return null;
}

/**
 * Clear the collar settings cache.
 * Call this when settings are updated from another tab/component.
 */
export function clearCollarSettingsCache(): void {
  cachedSettings = null;
  cacheTimestamp = 0;
}

/**
 * Get enabled collar colors sorted by sortOrder.
 */
export function getEnabledCollarColors(config: CollarSettingsConfig): CollarColorOption[] {
  return config.colors
    .filter((c) => c.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Find a collar color by ID or label (case-insensitive).
 * Useful for resolving stored collar values to full color objects.
 */
export function resolveCollarColor(
  idOrLabel: string,
  config: CollarSettingsConfig
): CollarColorOption | null {
  if (!idOrLabel) return null;
  const lower = idOrLabel.toLowerCase().trim();

  return (
    config.colors.find(
      (c) => c.id.toLowerCase() === lower || c.label.toLowerCase() === lower
    ) ?? null
  );
}

/**
 * Generate a unique ID for a custom collar color.
 */
export function generateCollarColorId(): string {
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
