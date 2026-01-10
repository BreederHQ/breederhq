// packages/ui/src/hooks/useCollarOptions.ts
// Hook for fetching whelping collar options in the Offspring module

import { useState, useEffect, useCallback } from "react";
import type { CollarColorOption, CollarSettingsConfig } from "@bhq/api";
import { DEFAULT_COLLAR_SETTINGS } from "@bhq/api";
import {
  fetchCollarSettings,
  getEnabledCollarColors,
  resolveCollarColor,
  clearCollarSettingsCache,
} from "../utils/collarSettings";
import { resolveTenantId } from "../utils/tenant";

export type UseCollarOptionsResult = {
  /** All enabled collar colors, sorted by sortOrder */
  colors: CollarColorOption[];
  /** Whether settings are currently loading */
  loading: boolean;
  /** Error message if loading failed */
  error: string | null;
  /** Full config for advanced use cases */
  config: CollarSettingsConfig;
  /** Resolve a color ID or label to full color object */
  resolveColor: (idOrLabel: string) => CollarColorOption | null;
  /** Refresh settings from server */
  refresh: () => Promise<void>;
};

/**
 * Hook for fetching and using whelping collar options.
 *
 * @example
 * ```tsx
 * const { colors, loading, resolveColor } = useCollarOptions();
 *
 * // Use in dropdown
 * <select>
 *   {colors.map(c => (
 *     <option key={c.id} value={c.id}>{c.label}</option>
 *   ))}
 * </select>
 *
 * // Resolve stored value to full color
 * const stored = "red";
 * const colorObj = resolveColor(stored);
 * console.log(colorObj?.hex); // "#ef4444"
 * ```
 */
export function useCollarOptions(): UseCollarOptionsResult {
  const [config, setConfig] = useState<CollarSettingsConfig>(DEFAULT_COLLAR_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let tenantId: string | null = null;
      try {
        const raw = await resolveTenantId();
        tenantId = (raw == null ? "" : String(raw)).trim() || null;
      } catch {
        tenantId = null;
      }

      const settings = await fetchCollarSettings(tenantId ?? undefined);
      setConfig(settings);
    } catch (e: any) {
      console.warn("Failed to load collar settings:", e);
      setError(e?.message || "Failed to load collar settings");
      // Keep default settings on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const colors = getEnabledCollarColors(config);

  const resolveColor = useCallback(
    (idOrLabel: string) => resolveCollarColor(idOrLabel, config),
    [config]
  );

  const refresh = useCallback(async () => {
    clearCollarSettingsCache();
    await loadSettings();
  }, [loadSettings]);

  return {
    colors,
    loading,
    error,
    config,
    resolveColor,
    refresh,
  };
}
