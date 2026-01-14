// packages/ui/src/hooks/useViewMode.ts
// Hook to manage view mode (cards vs table) with tenant default preferences

import * as React from "react";
import {
  type ViewMode,
  type ViewPreferenceModule,
  DEFAULT_VIEW_PREFERENCES,
} from "@bhq/api";
import { fetchViewPreferences } from "../utils/viewPreferences";
import { resolveTenantId } from "../utils/tenant";

type UseViewModeOptions = {
  /** The module this view mode is for */
  module: ViewPreferenceModule;
};

type UseViewModeResult = {
  /** Current view mode */
  viewMode: ViewMode;
  /** Set the view mode - persisted to localStorage for session persistence */
  setViewMode: (mode: ViewMode) => void;
  /** Whether tenant preferences are still loading */
  loading: boolean;
};

const STORAGE_KEY_PREFIX = "bhq_viewmode_";

function getStorageKey(module: ViewPreferenceModule): string {
  return `${STORAGE_KEY_PREFIX}${module}`;
}

function getStoredViewMode(module: ViewPreferenceModule): ViewMode | null {
  try {
    const stored = localStorage.getItem(getStorageKey(module));
    if (stored === "cards" || stored === "table" || stored === "list") {
      return stored;
    }
  } catch {
    // localStorage not available
  }
  return null;
}

function setStoredViewMode(module: ViewPreferenceModule, mode: ViewMode): void {
  try {
    localStorage.setItem(getStorageKey(module), mode);
  } catch {
    // localStorage not available
  }
}

/**
 * Hook to manage view mode state with tenant default preferences.
 *
 * Behavior:
 * 1. Checks localStorage for user's last choice (session persistence)
 * 2. If no localStorage value, fetches tenant's default preference from server
 * 3. Falls back to "cards" if both fail
 * 4. User's view mode choice is saved to localStorage for persistence
 */
export function useViewMode({
  module,
}: UseViewModeOptions): UseViewModeResult {
  // Check localStorage first for user's previous choice
  const storedMode = getStoredViewMode(module);

  const [viewMode, setViewModeState] = React.useState<ViewMode>(
    storedMode ?? DEFAULT_VIEW_PREFERENCES[module]
  );
  const [loading, setLoading] = React.useState(!storedMode);

  // Fetch tenant preferences on mount (only if no stored preference)
  React.useEffect(() => {
    // If we already have a stored preference, skip fetching
    if (storedMode) {
      return;
    }

    let ignore = false;

    (async () => {
      try {
        const tenantId = await resolveTenantId();
        if (!tenantId || ignore) {
          setLoading(false);
          return;
        }

        const preferences = await fetchViewPreferences(tenantId);
        if (ignore) return;

        setViewModeState(preferences[module]);
      } catch (error) {
        console.warn("Failed to fetch view preferences:", error);
        // Keep the default
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    })();

    return () => {
      ignore = true;
    };
  }, [module, storedMode]);

  const setViewMode = React.useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    setStoredViewMode(module, mode);
  }, [module]);

  return {
    viewMode,
    setViewMode,
    loading,
  };
}
