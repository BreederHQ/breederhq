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
  /** Set the view mode (temporary, session-only - resets on page reload) */
  setViewMode: (mode: ViewMode) => void;
  /** Whether tenant preferences are still loading */
  loading: boolean;
};

/**
 * Hook to manage view mode state with tenant default preferences.
 *
 * Behavior:
 * 1. Fetches tenant's default preference from server on mount
 * 2. Falls back to "cards" if fetch fails
 * 3. User can toggle view mode during their session (not persisted)
 * 4. On next page load, fetches fresh preference from server
 *
 * Note: We intentionally don't use localStorage to avoid cross-user
 * pollution when multiple users log in on the same browser.
 * The tenant-level setting in Settings > Platform Management > General
 * is the source of truth for default view preferences.
 */
export function useViewMode({
  module,
}: UseViewModeOptions): UseViewModeResult {
  // Start with default, will be updated once we fetch from server
  const [viewMode, setViewModeState] = React.useState<ViewMode>(
    DEFAULT_VIEW_PREFERENCES[module]
  );
  const [loading, setLoading] = React.useState(true);

  // Fetch tenant preferences on mount
  React.useEffect(() => {
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
  }, [module]);

  const setViewMode = React.useCallback((mode: ViewMode) => {
    setViewModeState(mode);
  }, []);

  return {
    viewMode,
    setViewMode,
    loading,
  };
}
