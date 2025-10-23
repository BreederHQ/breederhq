import * as React from "react";

export function FilterChips({
  filters,
  onChange,
  prettyLabel,
}: {
  filters: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
  prettyLabel?: (key: string) => string;
}) {
  const entries = Object.entries(filters).filter(([, v]) => (v ?? "") !== "");
  if (!entries.length) return null;

  const labelFor = (k: string) => {
    if (prettyLabel) return prettyLabel(k);
    if (k.endsWith("_from")) return k.replace("_from", " ≥");
    if (k.endsWith("_to"))   return k.replace("_to", " ≤");
    return k;
  };

  const clearOne = (key: string) => {
    const next = { ...filters };
    delete next[key];
    onChange(next);
  };

  const clearAll = () => onChange({});

  return (
    <div className="px-3 pb-2 flex flex-wrap items-center gap-2">
      {entries.map(([k, v]) => (
        <span key={k}
          className="inline-flex items-center gap-2 rounded-full border border-hairline bg-surface-strong px-2.5 py-1 text-xs">
          <span className="text-secondary">{labelFor(k)}:</span>
          <span className="text-primary">{v}</span>
          <button type="button" aria-label={`Clear ${labelFor(k)}`}
            className="rounded hover:bg-white/10 px-1"
            onClick={() => clearOne(k)}>
            ×
          </button>
        </span>
      ))}
      <button type="button" className="ml-1 text-xs underline text-secondary hover:text-primary" onClick={clearAll}>
        Clear all
      </button>
    </div>
  );
}

export default FilterChips;
