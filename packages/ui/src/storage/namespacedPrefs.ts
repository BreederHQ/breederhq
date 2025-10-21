export const makePrefs = (ns: string) => ({
  get: <T>(k: string, fallback: T): T => {
    try {
      const raw = localStorage.getItem(`${ns}:${k}`);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch { return fallback; }
  },
  set: (k: string, v: unknown) => {
    try { localStorage.setItem(`${ns}:${k}`, JSON.stringify(v)); } catch { /* ignore */ }
  },
});
