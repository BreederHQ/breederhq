// packages/ui/src/hooks/useBreedSearch.ts
import * as React from "react";
import { toApiSpecies, toUiSpecies, type BreedHit, type SpeciesUI } from "../utils";

/** Normalize one server row to a BreedHit and synthesize a stable id for canonical rows */
export function normalizeBreedRow(row: any): BreedHit {
  const species = toUiSpecies(row?.species);
  const source: "canonical" | "custom" = row?.source === "custom" ? "custom" : "canonical";
  const name = String(row?.name || "");

  if (source === "custom") {
    const rawId = row?.id ?? row?.breedId ?? row?.code ?? row?.uuid ?? row?._id;
    const id = rawId != null ? `custom:${String(rawId)}` : `custom:name:${name.toLowerCase()}`;
    return { id, species, name, source, canonicalBreedId: null };
  }

  // canonical
  const slug = name.toLowerCase().trim().replace(/\s+/g, "_");
  return {
    id: `canon:${toApiSpecies(species)}:${slug}`,
    species,
    name,
    source,
    canonicalBreedId: null,
  };
}

/** Imperative fetcher (works even without React) */
export async function searchBreedsOnce(params: {
  orgId?: number;              // optional: include to fetch custom org breeds
  species: SpeciesUI;
  q: string;
  limit?: number;
  signal?: AbortSignal;
}): Promise<BreedHit[]> {
  const { orgId, species, q, limit = 20, signal } = params;

  const qs = new URLSearchParams();
  qs.set("species", toApiSpecies(species));
  qs.set("q", q);
  qs.set("limit", String(limit));
  if (orgId != null) qs.set("organizationId", String(orgId)); // only when available

  const res = await fetch(`/api/v1/breeds/search?${qs.toString()}`, { signal });
  if (!res.ok) return [];
  const data = await res.json();
  const items = Array.isArray(data?.items) ? data.items : [];
  return items.map(normalizeBreedRow);
}

/** React hook that manages loading state and results */
export function useBreedSearch(args: {
  orgId?: number;              // optional: canonical results still work without it
  species: SpeciesUI;
  q: string;
  limit?: number;
}) {
  const { orgId, species, q, limit = 20 } = args;
  const [hits, setHits] = React.useState<BreedHit[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    const needle = q.trim();
    if (!needle) {
      setHits([]);
      setLoading(false);
      setError(null);
      return;
    }

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    let alive = true;
    setLoading(true);
    setError(null);

    searchBreedsOnce({ orgId, species, q: needle, limit, signal: ac.signal })
      .then((rows) => {
        if (!alive) return;
        setHits(rows);
      })
      .catch((e) => {
        if (!alive || e?.name === "AbortError") return;
        setHits([]);
        setError("Failed to search breeds");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
      ac.abort();
    };
  }, [orgId, species, q, limit]);

  return { hits, loading, error };
}
