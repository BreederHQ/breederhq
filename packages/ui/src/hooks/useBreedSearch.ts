import * as React from "react";
import type { BreedHit } from "../utils";

function normBase(): string {
  const w = typeof window !== "undefined" ? (window as any) : {};
  let b = String(w.__BHQ_API_BASE__ || "").trim();
  if (!b && typeof window !== "undefined") b = window.location.origin;
  b = b.replace(/\/+$/g, "").replace(/\/api\/v1$/i, "");
  return `${b}/api/v1`;
}

let __tenantResolving: Promise<number> | null = null;

async function ensureTenantId(baseUrl: string): Promise<number> {
  // Note: We intentionally skip localStorage to avoid cross-user contamination
  try {
    const w: any = window as any;
    const rt = Number(w?.__BHQ_TENANT_ID__);
    if (Number.isInteger(rt) && rt > 0) return rt;
  } catch {}
  if (!__tenantResolving) {
    __tenantResolving = fetch(`${baseUrl}/session`, { credentials: "include" })
      .then(r => r.ok ? r.json().catch(() => ({})) : {})
      .then((data: any) => {
        const t = Number(data?.tenantId ?? data?.tenant_id ?? data?.tenant?.id);
        if (t && typeof window !== "undefined") {
          // Only set runtime global (skip localStorage to avoid cross-user contamination)
          try { (window as any).__BHQ_TENANT_ID__ = t; } catch {}
        }
        return t || 0;
      });
  }
  const t = await __tenantResolving.catch(() => 0);
  if (!t || t <= 0) throw new Error("Tenant could not be resolved; user may not be logged in.");
  return t;
}

function toUiSpecies(s: string): "Dog" | "Cat" | "Horse" | "Goat" | "Sheep" | "Rabbit" {
  const up = String(s || "").toUpperCase();
  if (up === "DOG") return "Dog";
  if (up === "CAT") return "Cat";
  if (up === "HORSE") return "Horse";
  if (up === "GOAT") return "Goat";
  if (up === "SHEEP") return "Sheep";
  if (up === "RABBIT") return "Rabbit";
  return "Dog";
}

/** Normalize a name for matching (case/space/punct insensitive) */
function keyOf(name: string): string {
  return String(name || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Read local override list of custom names (CSV or JSON array). */
function readLocalCustomNames(): string[] {
  const w: any = typeof window !== "undefined" ? window : {};
  const fromWin: string[] = Array.isArray(w.__BHQ_CUSTOM_BREEDS__) ? w.__BHQ_CUSTOM_BREEDS__ : [];
  let fromLS: string[] = [];
  try {
    const raw = localStorage.getItem("BHQ_CUSTOM_BREEDS") || "";
    if (raw) {
      if (raw.trim().startsWith("[")) fromLS = JSON.parse(raw);
      else fromLS = raw.split(",").map(s => s.trim()).filter(Boolean);
    }
  } catch {}
  return [...new Set([...fromWin, ...fromLS])];
}

type UseBreedSearchArgs = {
  species: "DOG" | "CAT" | "HORSE" | "GOAT" | "SHEEP" | "RABBIT";
  q?: string;
  limit?: number;   // caller can increase (max 200)
  orgId?: number;
  debounceMs?: number;
};

/** Minimal shape of items returned by /breeds/search and /breeds/custom */
type ApiBreed = {
  id: number | string;
  name: string;
  species?: string;
  source?: "canonical" | "custom" | string;
  canonicalBreedId?: number | null;
  canonical_breed_id?: number | null;
  custom?: boolean;
  customBreedId?: number | null;
  custom_breed_id?: number | null;
  registries?: any[];
};

export function useBreedSearch({
  species,
  q = "",
  limit = 20,
  orgId,
  debounceMs = 150,
}: UseBreedSearchArgs) {
  const [hits, setHits] = React.useState<BreedHit[]>([]);
  const [loading, setLoading] = React.useState(false);
  const base = React.useMemo(() => normBase(), []);

  React.useEffect(() => {
    let alive = true;

    const run = async () => {
      const query = (q || "").trim();
      setLoading(true);
      try {
        const tenantId = await ensureTenantId(base);

        // Shared QS builder
        const buildQS = (lmt: number) => {
          const sp = new URLSearchParams();
          sp.set("species", species.toUpperCase());
          if (query) sp.set("q", query);
          sp.set("limit", String(Math.max(1, Math.min(lmt, 200))));
          if (Number.isFinite(orgId)) sp.set("orgId", String(orgId)); // optional legacy
          return sp.toString();
        };

        // fetch both primary search and explicit tenant customs
        const [searchRes, customRes] = await Promise.all([
          fetch(`${base}/breeds/search?${buildQS(limit ?? 20)}`, {
            method: "GET",
            headers: { "x-tenant-id": String(tenantId) },
            credentials: "include",
          }),
          fetch(`${base}/breeds/custom?${buildQS(200)}`, {
            method: "GET",
            headers: { "x-tenant-id": String(tenantId) },
            credentials: "include",
          }),
        ]);

        const parse = async (r: Response): Promise<any[]> => {
          if (!r.ok || r.status === 204) return [];
          const t = await r.text();
          if (!t) return [];
          const d = JSON.parse(t);
          return Array.isArray(d?.items) ? d.items : Array.isArray(d) ? d : [];
        };

        const [rawSearch, rawCustom] = (await Promise.all([
          parse(searchRes),
          parse(customRes),
        ])) as [ApiBreed[], ApiBreed[]];

        // Build “custom by name” set from API + local overrides
        const customKeys = new Set<string>();
        for (const it of rawCustom) {
          const k = keyOf(it?.name ?? "");
          if (k) customKeys.add(k);
        }
        for (const name of readLocalCustomNames()) {
          const k = keyOf(name);
          if (k) customKeys.add(k);
        }

        // Map search results; force custom if in customKeys
        const mappedFromSearch: (BreedHit & { registries?: any[]; _isCustom?: boolean })[] =
          rawSearch.map((it: ApiBreed) => {
            const k = keyOf(it?.name ?? "");
            const forceCustom = k && customKeys.has(k);
            const isCustomApi =
              (it as any)?.source === "custom" ||
              (it as any)?.custom === true ||
              (it as any)?.customBreedId != null ||
              (it as any)?.custom_breed_id != null;

            const isCustom = !!(forceCustom || isCustomApi);
            const canonicalId = (it as any).canonicalBreedId ?? (it as any).canonical_breed_id ?? null;

            return {
              // For canonical breeds, use canonicalBreedId as id; for custom breeds use id
              id: (it as any).id ?? canonicalId,
              name: (it as any).name,
              species: toUiSpecies((it as any).species || species),
              source: (isCustom ? "custom" : ((it as any).source || "canonical")) as "canonical" | "custom",
              canonicalBreedId: canonicalId,
              registries: isCustom ? [] : (Array.isArray((it as any).registries) ? (it as any).registries : []),
              _isCustom: isCustom ? true : undefined,
            };
          });

        // Ensure customs exist even if search omitted them
        const byName = new Map<string, BreedHit & { registries?: any[]; _isCustom?: boolean }>();
        for (const h of mappedFromSearch) byName.set(keyOf(h.name), h);
        for (const it of rawCustom) {
          const k = keyOf(it?.name ?? "");
          if (!k) continue;
          const existing = byName.get(k);
          const baseHit = {
            id: (it as any).id,
            name: (it as any).name,
            species: toUiSpecies((it as any).species || species),
            source: "custom" as const,
            canonicalBreedId: null,
            registries: [] as any[],
            _isCustom: true,
          };
          if (!existing) {
            byName.set(k, baseHit);
          } else {
            byName.set(k, { ...existing, ...baseHit }); // force custom
          }
        }

        const finalHits = Array.from(byName.values());
        if (alive) setHits(finalHits);
      } catch {
        if (alive) setHits([]);
      } finally {
        if (alive) setLoading(false);
      }
    };

    const t = setTimeout(run, Math.max(0, debounceMs));
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [base, species, q, limit, orgId, debounceMs]);

  return { hits, loading };
}
