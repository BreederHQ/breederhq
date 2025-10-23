// packages/ui/src/components/Filters/FiltersRow.tsx
import * as React from "react";

export type FilterSchemaItem =
  | { key: string; label: string; editor?: "text" | "select" | "date" | "checklist" }
  | { key: string; label: string; editor: "dateRange"; fromKey?: string; toKey?: string };

export type FiltersRowRegistry = Partial<Record<
  "text" | "date" | "select" | "checklist",
  React.FC<{ value: string; onChange: (e: any) => void; id?: string; placeholder?: string }>
>>;

export type FiltersRowProps = {
  filters: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
  schema: FilterSchemaItem[];
  registry?: FiltersRowRegistry;
  className?: string;
  showClearButtons?: boolean; // per-field clear “x”
};

const DefaultInput: React.FC<any> = (p) => (
  <input
    type="text"
    className="h-10 w-full rounded-full bg-surface border border-hairline px-3"
    {...p}
  />
);

const DefaultDate: React.FC<any> = (p) => (
  <input
    type="date"
    className="h-10 w-full rounded-full bg-surface border border-hairline px-3"
    {...p}
  />
);

const DefaultSelect: React.FC<any> = (p) => (
  <input
    // Provide a real select via registry; default stays a text input
    type="text"
    className="h-10 w-full rounded-full bg-surface border border-hairline px-3"
    {...p}
  />
);

const DefaultChecklist: React.FC<any> = () => (
  <div className="text-secondary text-sm">Checklist editor not provided</div>
);

export function FiltersRow({
  filters,
  onChange,
  schema,
  registry = {},
  className,
  showClearButtons = false,
}: FiltersRowProps) {
  const Text = registry["text"] ?? DefaultInput;
  const DateI = registry["date"] ?? DefaultDate;
  const Select = registry["select"] ?? DefaultSelect;
  const Checklist = registry["checklist"] ?? DefaultChecklist;

  const set = React.useCallback(
    (k: string, v: string) => onChange({ ...filters, [k]: v }),
    [filters, onChange]
  );

  const clear = React.useCallback(
    (k: string) => {
      const next = { ...filters };
      delete next[k];
      onChange(next);
    },
    [filters, onChange]
  );

  return (
    <div className={`bhq-section-fixed mt-2 rounded-xl border border-hairline bg-surface-strong/70 p-3 sm:p-4 ${className ?? ""}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {schema.map((f) => {
          const idBase = `flt_${f.key}`;
          // date range
          if ((f as any).editor === "dateRange") {
            const r = f as Extract<FilterSchemaItem, { editor: "dateRange" }>;
            const fromKey = r.fromKey ?? `${r.key}_from`;
            const toKey = r.toKey ?? `${r.key}_to`;
            const fromId = `${idBase}_from`;
            const toId = `${idBase}_to`;

            return (
              <div key={r.key} className="space-y-1.5">
                <div className="text-xs text-secondary">{r.label}</div>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <DateI
                    id={fromId}
                    value={filters[fromKey] ?? ""}
                    onChange={(e: any) => set(fromKey, e?.target?.value ?? e)}
                    placeholder="YYYY-MM-DD"
                  />
                  <span className="text-secondary text-xs whitespace-nowrap">to</span>
                  <DateI
                    id={toId}
                    value={filters[toKey] ?? ""}
                    onChange={(e: any) => set(toKey, e?.target?.value ?? e)}
                    placeholder="YYYY-MM-DD"
                  />
                </div>
                {showClearButtons && (filters[fromKey] || filters[toKey]) ? (
                  <div className="pt-1">
                    <button
                      type="button"
                      className="text-xs underline text-secondary hover:text-primary"
                      onClick={() => {
                        const next = { ...filters };
                        delete next[fromKey];
                        delete next[toKey];
                        onChange(next);
                      }}
                    >
                      Clear {r.label}
                    </button>
                  </div>
                ) : null}
              </div>
            );
          }

          // single editor
          const editor = (f as any).editor ?? "text";
          const Cmp =
            editor === "text" ? Text :
            editor === "date" ? DateI :
            editor === "select" ? Select :
            Checklist;

          const val = filters[f.key] ?? "";
          return (
            <div key={f.key} className="space-y-1.5">
              <label htmlFor={idBase} className="text-xs text-secondary">{f.label}</label>
              <div className="flex items-center gap-2">
                <Cmp id={idBase} value={val} onChange={(e: any) => set(f.key, e?.target?.value ?? e)} />
                {showClearButtons && val ? (
                  <button
                    type="button"
                    aria-label={`Clear ${f.label}`}
                    className="text-xs rounded px-2 h-7 border border-hairline hover:bg-white/5"
                    onClick={() => clear(f.key)}
                  >
                    ×
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* Helpers you can (optionally) export from @bhq/ui */
export const toISODateOnly = (iso?: string | null) => (iso ? String(iso).slice(0, 10) : "");
export const inDateRange = (valueISO?: string | null, from?: string, to?: string) => {
  const d = toISODateOnly(valueISO);
  if (!d) return false;
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
};

/** Build a default range-aware schema from simple column defs */
export function buildRangeAwareSchema(
  columns: Array<{ key: string; label: string }>,
  rangeKeys: string[] = ["createdAt", "updatedAt"]
): FilterSchemaItem[] {
  return columns.flatMap<FilterSchemaItem>((c) => {
    if (rangeKeys.includes(c.key)) {
      // date range item
      return [{ key: c.key, label: c.label, editor: "dateRange" }];
    }
    // single-field editor
    const editor: "text" | "date" = c.key.endsWith("At") ? "date" : "text";
    return [{ key: c.key, label: c.label, editor }];
  });
}

export default FiltersRow;