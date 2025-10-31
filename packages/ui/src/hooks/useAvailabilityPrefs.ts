import * as React from "react";
import { DEFAULT_AVAILABILITY_PREFS, type AvailabilityPrefs } from "../utils/availability";

type UseAvailabilityOpts = {
  tenantId: number; // pass from your app shell or session
};

export function useAvailabilityPrefs(opts: UseAvailabilityOpts) {
  const { tenantId } = opts;
  const [prefs, setPrefsState] = React.useState<AvailabilityPrefs>(DEFAULT_AVAILABILITY_PREFS);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`/tenants/${tenantId}/availability`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : r.text().then((t) => Promise.reject(t))))
      .then((j) => { if (alive) { setPrefsState({ ...DEFAULT_AVAILABILITY_PREFS, ...j }); setLoading(false); } })
      .catch((e) => { if (alive) { setError(String(e)); setLoading(false); } });
    return () => { alive = false; };
  }, [tenantId]);

  const save = async (next: Partial<AvailabilityPrefs>) => {
    // optimistic merge
    const merged = { ...prefs, ...next };
    setPrefsState(merged);
    const res = await fetch(`/tenants/${tenantId}/availability`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify(next),
    });
    if (!res.ok) {
      setError(`Save failed: ${res.status}`);
      // Optionally re-load from server
    } else {
      const j = await res.json();
      setPrefsState({ ...DEFAULT_AVAILABILITY_PREFS, ...j });
    }
  };

  return { prefs, setPrefs: save, loading, error };
}
