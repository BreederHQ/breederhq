// packages/ui/src/hooks/useAvailabilityPrefs.ts
import * as React from "react";
import { fetchAvailabilityPrefs, mapTenantPrefs, DEFAULT_AVAILABILITY_PREFS } from "../utils/availability";
import { readTenantIdFast } from "../utils/tenant";

type Options = {
  /** Explicit tenant id. If omitted we'll try readTenantIdFast(). */
  tenantId?: string | number | null;
  /** If true, returns the raw DB payload instead of sanitized UI prefs (defaults to false). */
  raw?: boolean;
  /** External reload trigger. Increment to force refetch. */
  reloadKey?: number;
};

export function useAvailabilityPrefs(opts: Options = {}) {
  const wantedId = opts.tenantId ?? readTenantIdFast?.();
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string>("");
  const [prefs, setPrefs] = React.useState(() => DEFAULT_AVAILABILITY_PREFS);

  React.useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        setError("");
        if (!wantedId) {
          if (!ignore) setPrefs({ ...DEFAULT_AVAILABILITY_PREFS });
          return;
        }

        const ui = await fetchAvailabilityPrefs(wantedId);
        if (!ignore) {
          setPrefs(opts.raw ? (ui as any) : mapTenantPrefs(ui));
        }
      } catch (e: any) {
        if (!ignore) {
          setError(e?.message || "Failed to load availability preferences");
          setPrefs({ ...DEFAULT_AVAILABILITY_PREFS });
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [wantedId, opts.raw, opts.reloadKey]);

  return { loading, error, prefs };
}

export default useAvailabilityPrefs;
