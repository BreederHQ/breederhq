import * as React from "react";

export type ChecklistFilterProps = {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
};

export function ChecklistFilter({ label, options, selected, onChange }: ChecklistFilterProps) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const opts = React.useMemo(() => {
    const uq = Array.from(new Set(options.filter(Boolean))).sort((a, b) => a.localeCompare(b));
    const t = q.trim().toLowerCase();
    return t ? uq.filter(o => o.toLowerCase().includes(t)) : uq;
  }, [options, q]);

  const toggle = (k: string) => {
    const set = new Set(selected);
    set.has(k) ? set.delete(k) : set.add(k);
    onChange(Array.from(set));
  };

  return (
    <div className="relative inline-block">
      <button type="button" onClick={() => setOpen(v => !v)} className="rounded border border-hairline px-2 py-1 text-xs">{label}</button>
      {open && (
        <div className="absolute z-[9999] mt-2 w-80 rounded-xl border border-hairline bg-surface text-primary shadow-[0_8px_30px_hsla(0,0%,0%,0.35)]">
          <div className="p-2 border-b border-hairline flex items-center gap-2">
            <input autoFocus placeholder={`Search ${label.toLowerCase()}…`} value={q} onChange={(e) => setQ(e.currentTarget.value)} className="w-full rounded-md border border-hairline bg-surface px-2 py-1.5 text-sm outline-none focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))]" />
            <button className="border border-hairline rounded px-2 py-1 text-xs" onClick={() => onChange([])}>None</button>
            <button className="border border-hairline rounded px-2 py-1 text-xs" onClick={() => onChange(options)}>All</button>
          </div>
          <div className="max-h-[300px] overflow-auto py-1">
            {opts.map(o => {
              const checked = selected.some(s => s.toLowerCase() === o.toLowerCase());
              return (
                <label key={o} onClick={() => toggle(o)} className="group grid grid-cols-[1fr_auto] items-center gap-3 px-3 py-2 hover:bg-[hsl(var(--brand-orange))]/12 cursor-pointer select-none">
                  <span className="truncate">{o}</span>
                  <span className={["relative h-4 w-4 rounded-[4px] grid place-items-center", checked ? "border border-[hsl(var(--brand-orange))]" : "border border-hairline"].join(" ")}>
                    {checked ? <span className="absolute inset-0 m-auto h-2 w-2 rounded-sm bg-[hsl(var(--brand-orange))]" /> : null}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
