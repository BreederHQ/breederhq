import * as React from "react";
import { useBreedSearch } from "../../hooks";
import type { BreedHit, SpeciesUI } from "../../utils";

export type BreedSelectProps = {
  orgId?: number | null;
  species: SpeciesUI;     // "Dog" | "Cat" | "Horse" | "Goat" | "Sheep" | "Rabbit"
  value: BreedHit | null;
  onChange: (hit: BreedHit | null) => void;
  placeholder?: string;
  minChars?: number;
  limit?: number;         // initial; component may request more on scroll
};

const SERVER_MAX = 200;

function looksLikeCrossbreed(name: string): boolean {
  const s = String(name || "");
  return /doodle|(?:^|[\s-])(?:.*poo|poodle)\b|(?:^|[\s-])mix\b|cross|crossbreed/i.test(s);
}

export function BreedSelect({
  orgId,
  species,
  value,
  onChange,
  placeholder = "Search breed...",
  minChars = 1,
  limit = 20,
}: BreedSelectProps) {
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [hi, setHi] = React.useState(-1);

  const initialLimit = Math.max(1, Math.min(limit, SERVER_MAX));
  const [visibleLimit, setVisibleLimit] = React.useState(initialLimit);
  const bumpingRef = React.useRef(false);

  const boxRef = React.useRef<HTMLDivElement | null>(null);

  const speciesParam = String(species).toUpperCase() as "DOG" | "CAT" | "HORSE" | "GOAT" | "SHEEP" | "RABBIT";
  const orgForSearch = Number.isFinite(orgId as any) ? (orgId as number) : undefined;

  const effectiveQ = value?.name ? "" : q;

  const { hits, loading } = useBreedSearch({
    species: speciesParam,
    q: effectiveQ,
    limit: visibleLimit,
    orgId: orgForSearch,
  });

  React.useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) {
        setOpen(false);
        setHi(-1);
      }
    }
    document.addEventListener("mousedown", onDoc, true);
    return () => document.removeEventListener("mousedown", onDoc, true);
  }, []);

  React.useEffect(() => { setVisibleLimit(initialLimit); }, [initialLimit, speciesParam, orgForSearch]);
  React.useEffect(() => { if (open) setVisibleLimit(initialLimit); }, [open, initialLimit]);

  const showHits = open && (loading || hits.length > 0 || effectiveQ.length >= minChars);

  function commitSelection(hit: BreedHit | null) {
    onChange(hit);
    setOpen(false);
    setHi(-1);
    if (hit) setQ(hit.name);
  }

  function onListScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    if (visibleLimit >= SERVER_MAX) return;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 48;
    if (!nearBottom || bumpingRef.current) return;
    bumpingRef.current = true;
    setVisibleLimit((n) => Math.min(SERVER_MAX, n + 50));
    setTimeout(() => { bumpingRef.current = false; }, 100);
  }

  return (
    <div className="relative" ref={boxRef}>
      <input
        className="w-full h-10 rounded-md border border-hairline bg-surface px-3 text-sm text-primary outline-none focus:shadow-[0_0_0_2px_hsl(var(--hairline))]"
        value={value?.name ?? q}
        placeholder={placeholder}
        onChange={(e) => {
          const v = e.currentTarget.value;
          setQ(v);
          if (!v.trim()) {
            onChange(null);
            setOpen(false);
            setHi(-1);
            return;
          }
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!showHits) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHi((h) => Math.min(h + 1, hits.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHi((h) => Math.max(h - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            if (hi >= 0 && hits[hi]) commitSelection(hits[hi]);
          } else if (e.key === "Escape") {
            setOpen(false);
            setHi(-1);
          }
        }}
      />

      {showHits && (
        <div
          onScroll={onListScroll}
          className="absolute z-50 mt-1 w-full rounded-md border border-hairline bg-surface-strong max-h-72 overflow-auto shadow-lg"
        >
          {loading && hits.length === 0 && (
            <div className="px-3 py-2 text-xs text-secondary">Searching…</div>
          )}

          {!loading && hits.length === 0 && effectiveQ.length >= minChars && (
            <div className="px-3 py-2 text-xs text-secondary">No matches</div>
          )}

          {hits.map((h, idx) => {
            // Declare custom with ironclad rules
            const forced = (h as any)._isCustom === true;
            const derivedCustom =
              forced ||
              h.source === "custom" ||
              !((h as any).canonicalBreedId > 0) ||
              looksLikeCrossbreed(h.name);

            const regs = Array.isArray((h as any).registries) ? (h as any).registries : [];
            const first = regs[0] || {};
            const code = first?.code || "";
            const url  = first?.url || first?.link || first?.href || "";

            const badgeEl = derivedCustom ? (
              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full border text-amber-400 border-amber-400/50">
                Custom
              </span>
            ) : url ? (
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full border text-secondary border-hairline underline hover:no-underline"
                onMouseDown={(e) => e.preventDefault()}
              >
                {code || "Official"}
              </a>
            ) : (
              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full border text-secondary border-hairline">
                {code || "Official"}
              </span>
            );

            return (
              <button
                key={`${h.source}:${(h as any).canonicalBreedId ?? h.id ?? h.name}`}
                type="button"
                className={
                  "w-full text-left px-3 py-2 text-sm hover:bg-surface/60 " +
                  (idx === hi ? "bg-surface/60" : "")
                }
                onMouseEnter={() => setHi(idx)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  commitSelection(h);
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate">{h.name}</span>
                  {badgeEl}
                </div>
                <div className="text-[10px] text-secondary mt-0.5">{h.species}</div>
              </button>
            );
          })}

          {hits.length > 0 && visibleLimit < SERVER_MAX && (
            <div className="px-3 py-2 text-[11px] text-secondary">
              {loading ? "Loading more…" : "Scroll to load more…"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
