// packages/ui/src/utils/dateValidation/api.ts
// API utilities for fetching and saving validation configuration

import type { DateValidationConfig, WarningOverride } from "./types";
import { DEFAULT_VALIDATION_CONFIG, getValidationConfig } from "./defaults";

const SETTINGS_NAMESPACE = "breeding-date-validation";

/**
 * Fetch the tenant's date validation configuration.
 * Returns defaults if not configured.
 */
export async function fetchValidationConfig(
  tenantId?: string | number
): Promise<DateValidationConfig> {
  if (!tenantId) {
    return DEFAULT_VALIDATION_CONFIG;
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
        return DEFAULT_VALIDATION_CONFIG;
      }
      throw new Error(`Failed to fetch validation config: ${res.status}`);
    }

    const json = await res.json();
    // Merge with defaults to ensure all keys exist
    return getValidationConfig(json.data ?? json);
  } catch (error) {
    console.warn("Failed to fetch validation config, using defaults:", error);
    return DEFAULT_VALIDATION_CONFIG;
  }
}

/**
 * Save the tenant's date validation configuration.
 */
export async function saveValidationConfig(
  config: DateValidationConfig,
  tenantId: string | number
): Promise<DateValidationConfig> {
  const res = await fetch(
    `/api/v1/tenants/${encodeURIComponent(String(tenantId))}/settings/${SETTINGS_NAMESPACE}`,
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
    throw new Error(`Failed to save validation config: ${res.status} - ${text}`);
  }

  const json = await res.json();
  return getValidationConfig(json.data ?? json);
}

/**
 * Log a warning override for audit purposes.
 * This creates a record that the user acknowledged and overrode a validation warning.
 */
export async function logWarningOverride(
  override: WarningOverride,
  planId: string | number,
  tenantId: string | number
): Promise<void> {
  try {
    await fetch(
      `/api/v1/tenants/${encodeURIComponent(String(tenantId))}/breeding-plans/${encodeURIComponent(String(planId))}/validation-overrides`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
          "x-tenant-id": String(tenantId),
        },
        body: JSON.stringify(override),
      }
    );
  } catch (error) {
    // Log failure but don't block the user's action
    console.error("Failed to log warning override:", error);
  }
}

/**
 * Fetch warning overrides for a plan (for audit/review).
 */
export async function fetchWarningOverrides(
  planId: string | number,
  tenantId: string | number
): Promise<WarningOverride[]> {
  try {
    const res = await fetch(
      `/api/v1/tenants/${encodeURIComponent(String(tenantId))}/breeding-plans/${encodeURIComponent(String(planId))}/validation-overrides`,
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
      if (res.status === 404) return [];
      throw new Error(`Failed to fetch overrides: ${res.status}`);
    }

    const json = await res.json();
    return json.data ?? json ?? [];
  } catch (error) {
    console.warn("Failed to fetch warning overrides:", error);
    return [];
  }
}
