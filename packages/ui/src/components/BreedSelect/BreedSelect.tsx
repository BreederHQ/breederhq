import React, { useEffect, useMemo, useRef, useState } from "react";

type Species = "Dog" | "Cat" | "Horse";
type BreedHit = {
  id: string;
  species: Species;
  name: string;
  source: "canonical" | "custom";
  canonicalBreedId?: number | null;
};

export function BreedSelect({
  species,
  orgId,
  value,
  onChange,
  placeholder = "Search breed..."
}: {
  species: Species;
  orgId: number;
  value?: BreedHit | null;
  onChange: (hit: BreedHit | null) => void;
  placeholder?: string;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [hits, setHits] = useState<BreedHit[]>([]);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc, { capture: true });
    return () => document.removeEventListener("mousedown", onDoc, { capture: true } as any);
  }, []);

  async function search(v: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/breeds/search?species=${species}&q=${encodeURIComponent(v)}&limit=20`, {
        headers: { "X-Org-Id": String(orgId) }
      });
      const data = await res.json();
      setHits(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative" ref={boxRef}>
      <input
        className="w-full h-10 rounded-md border border-hairline bg-surface px-3 text-sm"
        value={value?.name ?? q}
        placeholder={placeholder}
        onChange={(e) => {
          const v = e.target.value;
          setQ(v);
          if (v.trim().length === 0) {
            setHits([]);
            setOpen(false);
          } else {
            search(v);
            setOpen(true);
          }
        }}
        onFocus={() => {
          if (q.trim()) search(q);
          setOpen(true);
        }}
      />
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-hairline bg-surface-strong max-h-72 overflow-auto shadow-lg">
          {loading && <div className="px-3 py-2 text-xs text-secondary">Searching…</div>}
          {!loading && hits.length === 0 && q && (
            <div className="px-3 py-2 text-xs text-secondary">No matches</div>
          )}
          {hits.map(h => (
            <button
              key={h.id}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-surface/60"
              onClick={() => { onChange(h); setOpen(false); }}
            >
              <div className="flex items-center justify-between">
                <span>{h.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                  h.source === "custom" ? "text-amber-400 border-amber-400/50" : "text-secondary border-hairline"
                }`}>
                  {h.source === "custom" ? "Custom" : "Official"}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
