// packages/ui/src/components/BreedSelect/BreedSelect.tsx
import * as React from "react";
import { useBreedSearch } from "../../hooks";
import type { BreedHit, SpeciesUI } from "../../utils";

export type BreedSelectProps = {
  orgId?: number;                 
  species: SpeciesUI;
  value: BreedHit | null;
  onChange: (hit: BreedHit | null) => void;
  placeholder?: string;
  minChars?: number;              
};

export function BreedSelect({
  orgId,
  species,
  value,
  onChange,
  placeholder = "Search breed...",
  minChars = 1,
}: BreedSelectProps) {
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [hi, setHi] = React.useState(-1);
  const boxRef = React.useRef<HTMLDivElement | null>(null);

  const effectiveQ = value?.name ? "" : q; // when a value is set, keep input as that value
  const { hits, loading } = useBreedSearch({ orgId, species, q: effectiveQ, limit: 20 });

  React.useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) {
        setOpen(false);
        setHi(-1);
      }
    }
    document.addEventListener("mousedown", onDoc, { capture: true });
    return () => document.removeEventListener("mousedown", onDoc as any, { capture: true } as any);
  }, []);

  const showHits = open && (loading || hits.length > 0 || effectiveQ.length >= minChars);

  function commitSelection(hit: BreedHit | null) {
    onChange(hit);
    setOpen(false);
    setHi(-1);
    if (hit) setQ(hit.name);
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
        <div className="absolute z-50 mt-1 w-full rounded-md border border-hairline bg-surface-strong max-h-72 overflow-auto shadow-lg">
          {loading && <div className="px-3 py-2 text-xs text-secondary">Searching…</div>}

          {!loading && hits.length === 0 && effectiveQ.length >= minChars && (
            <div className="px-3 py-2 text-xs text-secondary">No matches</div>
          )}

          {!loading &&
            hits.map((h, idx) => (
              <button
                key={h.id}
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
                  <span
                    className={
                      "ml-2 text-[10px] px-1.5 py-0.5 rounded-full border " +
                      (h.source === "custom"
                        ? "text-amber-400 border-amber-400/50"
                        : "text-secondary border-hairline")
                    }
                  >
                    {h.source === "custom" ? "Custom" : "Official"}
                  </span>
                </div>
                <div className="text-[10px] text-secondary mt-0.5">{h.species}</div>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
