// packages/ui/src/hooks/useTabPreferences.ts
// Hook for fetching and saving animal detail tab preferences

import * as React from "react";
import type { TabPreferences } from "../components/Tabs/CollapsibleTabs";
import { readTenantIdFast } from "../utils/tenant";

const TAB_PREFERENCES_NAMESPACE = "animal-tab-preferences";

// Default pinned tabs for different animal types
export const DEFAULT_PINNED_TABS_FEMALE = [
  "overview",
  "cycle",
  "health",
  "lineage",
  "offspring",
];

export const DEFAULT_PINNED_TABS_MALE = [
  "overview",
  "program",
  "health",
  "lineage",
  "offspring",
];

export const DEFAULT_PINNED_TABS_GENERIC = [
  "overview",
  "health",
  "lineage",
  "offspring",
  "media",
];

export function getDefaultPinnedTabs(sex?: string): string[] {
  const normalizedSex = (sex || "").toLowerCase();
  if (normalizedSex.startsWith("f")) {
    return DEFAULT_PINNED_TABS_FEMALE;
  }
  if (normalizedSex.startsWith("m")) {
    return DEFAULT_PINNED_TABS_MALE;
  }
  return DEFAULT_PINNED_TABS_GENERIC;
}

type UseTabPreferencesOptions = {
  /** Override tenant ID (defaults to auto-detected from session) */
  tenantId?: string | number;
  /** If true, skip fetching and use defaults */
  skip?: boolean;
};

/** Get tenant ID from props or auto-detect */
function getTenantId(provided?: string | number): string | number | undefined {
  if (provided) return provided;
  return readTenantIdFast();
}

type UseTabPreferencesResult = {
  preferences: TabPreferences | null;
  loading: boolean;
  error: Error | null;
  savePreferences: (prefs: TabPreferences) => Promise<void>;
  /** Reset to defaults */
  resetPreferences: () => Promise<void>;
};

export function useTabPreferences({
  tenantId: providedTenantId,
  skip = false,
}: UseTabPreferencesOptions = {}): UseTabPreferencesResult {
  const [preferences, setPreferences] = React.useState<TabPreferences | null>(null);
  const [loading, setLoading] = React.useState(!skip);
  const [error, setError] = React.useState<Error | null>(null);

  // Resolve tenant ID
  const tenantId = React.useMemo(() => getTenantId(providedTenantId), [providedTenantId]);

  // Fetch preferences on mount
  React.useEffect(() => {
    if (skip || !tenantId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchPrefs() {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/v1/tenants/${encodeURIComponent(String(tenantId))}/settings/${TAB_PREFERENCES_NAMESPACE}`,
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

        if (!cancelled) {
          if (res.status === 404) {
            // No preferences saved yet
            setPreferences(null);
          } else if (res.ok) {
            const json = await res.json();
            setPreferences(json.data ?? json);
          } else {
            throw new Error(`Failed to fetch tab preferences: ${res.status}`);
          }
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.warn("Failed to fetch tab preferences:", err);
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      }
    }

    fetchPrefs();

    return () => {
      cancelled = true;
    };
  }, [tenantId, skip]);

  const savePreferences = React.useCallback(
    async (prefs: TabPreferences) => {
      if (!tenantId) return;

      try {
        const res = await fetch(
          `/api/v1/tenants/${encodeURIComponent(String(tenantId))}/settings/${TAB_PREFERENCES_NAMESPACE}`,
          {
            method: "PUT",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              "X-Requested-With": "XMLHttpRequest",
              "x-tenant-id": String(tenantId),
            },
            body: JSON.stringify(prefs),
          }
        );

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to save tab preferences: ${res.status} - ${text}`);
        }

        const json = await res.json();
        setPreferences(json.data ?? json);
      } catch (err) {
        console.error("Failed to save tab preferences:", err);
        throw err;
      }
    },
    [tenantId]
  );

  const resetPreferences = React.useCallback(async () => {
    if (!tenantId) return;

    try {
      // Delete the preferences (or set to empty)
      const res = await fetch(
        `/api/v1/tenants/${encodeURIComponent(String(tenantId))}/settings/${TAB_PREFERENCES_NAMESPACE}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "x-tenant-id": String(tenantId),
          },
        }
      );

      if (res.ok || res.status === 404) {
        setPreferences(null);
      } else {
        throw new Error(`Failed to reset tab preferences: ${res.status}`);
      }
    } catch (err) {
      console.error("Failed to reset tab preferences:", err);
      throw err;
    }
  }, [tenantId]);

  return {
    preferences,
    loading,
    error,
    savePreferences,
    resetPreferences,
  };
}
