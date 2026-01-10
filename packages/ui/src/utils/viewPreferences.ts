// packages/ui/src/utils/viewPreferences.ts
// API utilities for fetching and saving view preferences (card vs table)

import {
  type ViewPreferencesConfig,
  DEFAULT_VIEW_PREFERENCES,
  VIEW_PREFERENCES_NAMESPACE,
} from "@bhq/api";

/**
 * Merge stored config with defaults to ensure all keys exist
 */
function getViewPreferencesConfig(
  stored: Partial<ViewPreferencesConfig> | null | undefined
): ViewPreferencesConfig {
  if (!stored) return { ...DEFAULT_VIEW_PREFERENCES };
  return {
    contacts: stored.contacts ?? DEFAULT_VIEW_PREFERENCES.contacts,
    animals: stored.animals ?? DEFAULT_VIEW_PREFERENCES.animals,
    breeding: stored.breeding ?? DEFAULT_VIEW_PREFERENCES.breeding,
    offspring: stored.offspring ?? DEFAULT_VIEW_PREFERENCES.offspring,
    offspringGroups: stored.offspringGroups ?? DEFAULT_VIEW_PREFERENCES.offspringGroups,
  };
}

/**
 * Fetch the tenant's view preferences configuration.
 * Returns defaults if not configured.
 */
export async function fetchViewPreferences(
  tenantId?: string | number
): Promise<ViewPreferencesConfig> {
  if (!tenantId) {
    return DEFAULT_VIEW_PREFERENCES;
  }

  try {
    const res = await fetch(
      `/api/v1/tenants/${encodeURIComponent(String(tenantId))}/settings/${VIEW_PREFERENCES_NAMESPACE}`,
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
        return DEFAULT_VIEW_PREFERENCES;
      }
      throw new Error(`Failed to fetch view preferences: ${res.status}`);
    }

    const json = await res.json();
    // Merge with defaults to ensure all keys exist
    return getViewPreferencesConfig(json.data ?? json);
  } catch (error) {
    console.warn("Failed to fetch view preferences, using defaults:", error);
    return DEFAULT_VIEW_PREFERENCES;
  }
}

/**
 * Save the tenant's view preferences configuration.
 */
export async function saveViewPreferences(
  config: ViewPreferencesConfig,
  tenantId: string | number
): Promise<ViewPreferencesConfig> {
  const res = await fetch(
    `/api/v1/tenants/${encodeURIComponent(String(tenantId))}/settings/${VIEW_PREFERENCES_NAMESPACE}`,
    {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
        "x-tenant-id": String(tenantId),
      },
      body: JSON.stringify(config),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to save view preferences: ${res.status} - ${text}`);
  }

  const json = await res.json();
  return getViewPreferencesConfig(json.data ?? json);
}
