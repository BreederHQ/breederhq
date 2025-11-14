// packages/ui/src/utils/availability.ts
import { readTenantIdFast } from "./tenant";

/** ---------- Types ---------- */
export type AvailabilityBand = {
  rf: number; // risky from (negative days from anchor/left anchor)
  rt: number; // risky to   (positive days from anchor/right anchor)
  uf: number; // unlikely from
  ut: number; // unlikely to
};

export type AvailabilityPrefs = {
  // ---- Phase spans (whole-phase wraps)
  cycle_breeding_risky_from?: number;
  cycle_breeding_risky_to?: number;
  cycle_breeding_unlikely_from?: number;
  cycle_breeding_unlikely_to?: number;

  post_risky_from_full_start?: number;
  post_risky_to_full_end?: number;
  post_unlikely_from_likely_start?: number;
  post_unlikely_to_likely_end?: number;

  // ---- Exact-date wraps (per-anchor)
  date_cycle_risky_from?: number;
  date_cycle_risky_to?: number;
  date_cycle_unlikely_from?: number;
  date_cycle_unlikely_to?: number;

  date_testing_risky_from?: number;
  date_testing_risky_to?: number;
  date_testing_unlikely_from?: number;
  date_testing_unlikely_to?: number;

  date_breeding_risky_from?: number;
  date_breeding_risky_to?: number;
  date_breeding_unlikely_from?: number;
  date_breeding_unlikely_to?: number;

  date_birth_risky_from?: number;
  date_birth_risky_to?: number;
  date_birth_unlikely_from?: number;
  date_birth_unlikely_to?: number;

  date_weaned_risky_from?: number;
  date_weaned_risky_to?: number;
  date_weaned_unlikely_from?: number;
  date_weaned_unlikely_to?: number;

  // Placement Completed
  date_placement_completed_risky_from?: number;
  date_placement_completed_risky_to?: number;
  date_placement_completed_unlikely_from?: number;
  date_placement_completed_unlikely_to?: number;

  // Placement Start
  date_placement_start_risky_from?: number;
  date_placement_start_risky_to?: number;
  date_placement_start_unlikely_from?: number;
  date_placement_start_unlikely_to?: number;

  // ---- Persisted UI defaults (server-backed)
  // Set by Breeding section checkboxes; used by both Master & PerPlan Gantt
  gantt_master_default_exact_bands_visible?: boolean;
  gantt_perplan_default_exact_bands_visible?: boolean;

  // ---- UI toggles (local-only legacy, still read by charts as a convenient alias)
  autoWidenUnlikely?: boolean;
  defaultExactBandsVisible?: boolean;
};

/** ---------- Safe defaults ---------- */
export const DEFAULT_AVAILABILITY_PREFS: AvailabilityPrefs & Record<string, any> = {
  // Per-date risky ±5, unlikely ±10
  date_birth_risky_to: 5,
  date_cycle_risky_to: 5,
  date_weaned_risky_to: 5,
  date_birth_risky_from: -5,
  date_cycle_risky_from: -5,
  date_testing_risky_to: 5,
  date_birth_unlikely_to: 10,
  date_breeding_risky_to: 5,
  date_cycle_unlikely_to: 10,
  date_weaned_risky_from: -5,
  post_risky_to_full_end: 0,
  date_testing_risky_from: -5,
  date_weaned_unlikely_to: 10,
  date_birth_unlikely_from: -10,
  date_breeding_risky_from: -5,
  date_cycle_unlikely_from: -10,
  date_testing_unlikely_to: 10,
  date_breeding_unlikely_to: 10,
  date_weaned_unlikely_from: -10,
  testing_risky_to_full_end: 0,
  date_testing_unlikely_from: -10,
  post_risky_from_full_start: 0,
  date_breeding_unlikely_from: -10,
  post_unlikely_to_likely_end: 0,
  testing_unlikely_to_likely_end: 0,
  post_unlikely_from_likely_start: 0,

  // Phase set the UI reads
  cycle_breeding_risky_to: 0,
  cycle_breeding_unlikely_to: 0,
  cycle_breeding_risky_from: 0,
  cycle_breeding_unlikely_from: 0,

  // Back compat phase keys
  cycle_breeding_risky_from_full_start: 0,
  cycle_breeding_risky_to_full_end: 0,
  cycle_breeding_unlikely_from_likely_start: 0,
  cycle_breeding_unlikely_to_likely_end: 0,

  // Placement Completed defaults
  date_placement_completed_risky_from: 0,
  date_placement_completed_risky_to: 5,
  date_placement_completed_unlikely_from: 0,
  date_placement_completed_unlikely_to: 10,

  // Placement Start defaults
  date_placement_start_risky_from: 0,
  date_placement_start_risky_to: 0,
  date_placement_start_unlikely_from: 0,
  date_placement_start_unlikely_to: 0,

  // Persisted UI defaults (server-backed)
  gantt_master_default_exact_bands_visible: false,
  gantt_perplan_default_exact_bands_visible: false,

  // Local UI defaults
  autoWidenUnlikely: true,
  defaultExactBandsVisible: false,
};

/** Small helper: coerce a numeric-ish thing to a finite number, or 0 */
function num(v: unknown): number {
  const n = typeof v === "string" ? Number(v) : (typeof v === "number" ? v : 0);
  return Number.isFinite(n) ? n : 0;
}

/** Pick first finite number among keys on an object */
function firstNum(source: Record<string, any>, ...keys: string[]): number | undefined {
  for (const k of keys) {
    const n = Number(source?.[k]);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

/** Normalize all numeric fields */
export function sanitizePrefs(raw: any): AvailabilityPrefs {
  const merged = { ...DEFAULT_AVAILABILITY_PREFS, ...(raw || {}) } as AvailabilityPrefs & Record<string, any>;
  const out: AvailabilityPrefs = {};

  // Copy every known key from defaults, coercing numbers and preserving booleans
  (Object.keys(DEFAULT_AVAILABILITY_PREFS) as (keyof AvailabilityPrefs)[]).forEach((k) => {
    const v = (merged as any)[k];
    (out as any)[k] = typeof v === "boolean" ? v : num(v);
  });

  return out;
}

/** Some APIs wrap data inside { data: ... } — unwrap defensively */
function unwrap<T = any>(rawAny: any): T {
  if (!rawAny) return {} as T;
  if (rawAny.data && typeof rawAny.data === "object") return rawAny.data as T;
  return rawAny as T;
}

/** Convert tenant DB prefs payload -> UI prefs (sanitized, with defaults) */
export function mapTenantPrefs(rawAny: any): AvailabilityPrefs {
  const raw = unwrap<Record<string, any>>(rawAny);

  // ---- Bridge DB "phase" keys to the simple names the chart reads ----
  const bridged = { ...raw };

  // Cycle → Breeding
  const cb_rf = firstNum(raw, "cycle_breeding_risky_from_full_start", "cycle_breeding_risky_from");
  const cb_rt = firstNum(raw, "cycle_breeding_risky_to_full_end", "cycle_breeding_risky_to");
  const cb_uf = firstNum(raw, "cycle_breeding_unlikely_from_likely_start", "cycle_breeding_unlikely_from");
  const cb_ut = firstNum(raw, "cycle_breeding_unlikely_to_likely_end", "cycle_breeding_unlikely_to");

  if (cb_rf != null) bridged.cycle_breeding_risky_from = cb_rf;
  if (cb_rt != null) bridged.cycle_breeding_risky_to = cb_rt;
  if (cb_uf != null) bridged.cycle_breeding_unlikely_from = cb_uf;
  if (cb_ut != null) bridged.cycle_breeding_unlikely_to = cb_ut;

  // Birth → Placement uses the same names already

  // Sanitize everything (numbers + booleans kept as-is)
  const sanitized = sanitizePrefs(bridged);

  // Prefer the persisted per-plan toggle, then master; expose via legacy alias
  const perPlan = bridged.gantt_perplan_default_exact_bands_visible;
  const master = bridged.gantt_master_default_exact_bands_visible;
  if (typeof perPlan === "boolean") {
    sanitized.defaultExactBandsVisible = perPlan;
  } else if (typeof master === "boolean") {
    sanitized.defaultExactBandsVisible = master;
  }

  return sanitized;
}

/** Utility used by Gantt and calendar code: creates signed bands and optional +1 widen */
export function normalizeBands(
  risky_from?: number,
  risky_to?: number,
  unlikely_from?: number,
  unlikely_to?: number,
  autoWiden?: boolean
): AvailabilityBand {
  let rf = Math.abs(num(risky_from));
  let rt = Math.abs(num(risky_to));
  let uf = Math.abs(num(unlikely_from));
  let ut = Math.abs(num(unlikely_to));

  if (autoWiden) {
    if (uf === rf && rf !== 0) uf = rf + 1;
    if (ut === rt && rt !== 0) ut = rt + 1;
  }

  return { rf: -rf, rt: +rt, uf: -uf, ut: +ut };
}

/**
 * Historical export name used elsewhere in the app.
 * Identical to normalizeBands to avoid breaking imports.
 */
export const computeAvailabilityBands = normalizeBands;

/** Lightweight helper for “do we have any explicit exact-date values?” */
export function hasAnyExactValues(p: AvailabilityPrefs): boolean {
  const keys: (keyof AvailabilityPrefs)[] = [
    "date_cycle_risky_from", "date_cycle_risky_to", "date_cycle_unlikely_from", "date_cycle_unlikely_to",
    "date_testing_risky_from", "date_testing_risky_to", "date_testing_unlikely_from", "date_testing_unlikely_to",
    "date_breeding_risky_from", "date_breeding_risky_to", "date_breeding_unlikely_from", "date_breeding_unlikely_to",
    "date_birth_risky_from", "date_birth_risky_to", "date_birth_unlikely_from", "date_birth_unlikely_to",
    "date_weaned_risky_from", "date_weaned_risky_to", "date_weaned_unlikely_from", "date_weaned_unlikely_to",
    "date_placement_start_risky_from", "date_placement_start_risky_to",
    "date_placement_start_unlikely_from", "date_placement_start_unlikely_to",
    "date_placement_completed_risky_from", "date_placement_completed_risky_to",
    "date_placement_completed_unlikely_from", "date_placement_completed_unlikely_to",
  ];
  return keys.some((k) => num((p as any)[k]) !== 0);
}

/** Expose defaults under a debug name some code references */
export const DEBUG_SAFE_DEFAULTS = DEFAULT_AVAILABILITY_PREFS;

/** Convenience fetcher */
export async function fetchAvailabilityPrefs(
  tenantId?: string | number
): Promise<AvailabilityPrefs> {
  const id = tenantId ?? readTenantIdFast?.();
  if (!id) return { ...DEFAULT_AVAILABILITY_PREFS };

  const res = await fetch(`/api/v1/tenants/${encodeURIComponent(String(id))}/availability`, {
    credentials: "include",
    headers: {
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      "x-tenant-id": String(id),
      "x-org-id": String(id),
    },
  });

  if (!res.ok) {
    if (res.status === 404) return { ...DEFAULT_AVAILABILITY_PREFS };
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      msg = j?.message || j?.error || msg;
    } catch {}
    throw new Error(msg);
  }

  const bodyText = await res.text();
  const json = bodyText ? JSON.parse(bodyText) : {};
  return mapTenantPrefs(json);
}
