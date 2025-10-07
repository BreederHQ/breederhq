import React from "react";
import { Input } from "@bhq/ui";
import { makeApi } from "../api";

type Option = { id: number; label: string; hint?: string };

type Props = {
  value?: { id: number; label: string } | null;
  onChange: (next: { id: number; label: string } | null) => void;
  placeholder?: string;
};

export default function AnimalOwnerTypeahead({ value, onChange, placeholder = "Search contacts..." }: Props) {
  const api = React.useMemo(() => makeApi(), []);
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [opts, setOpts] = React.useState<Option[]>([]);
  const [hi, setHi] = React.useState(0);

  React.useEffect(() => {
    if (q.trim().length < 2) {
      setOpts([]); setOpen(false); return;
    }
    let alive = true;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const items = await api.contacts.search({ q, limit: 10 });
        if (!alive) return;
        setOpts(items.map(c => ({ id: c.id, label: c.displayName, hint: c.email ?? c.phone ?? undefined })));
        setOpen(true); setHi(0);
      } finally { setLoading(false); }
    }, 250);
    return () => { alive = false; clearTimeout(t); };
  }, [q]);

  function pick(i: number) {
    const o = opts[i]; if (!o) return;
    onChange({ id: o.id, label: o.label }); setOpen(false);
  }

  return (
    <div className="relative">
      <Input
        value={value?.label ?? q}
        onChange={(e: any) => { if (value) onChange(null); setQ(e.target.value); }}
        onFocus={() => { if (opts.length) setOpen(true); }}
        onKeyDown={(e: any) => {
          if (!open) return;
          if (e.key === "ArrowDown") { e.preventDefault(); setHi(h => Math.min(h + 1, opts.length - 1)); }
          if (e.key === "ArrowUp") { e.preventDefault(); setHi(h => Math.max(h - 1, 0)); }
          if (e.key === "Enter") { e.preventDefault(); pick(hi); }
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder={placeholder}
        aria-autocomplete="list"
      />
      {open && (
        <ul className="absolute z-[1000] mt-1 w-full rounded-xl bg-surface ring-1 ring-hairline shadow-lg max-h-64 overflow-auto" role="listbox">
          {loading && <li className="px-3 py-2 text-secondary text-sm">Searching…</li>}
          {!loading && opts.length === 0 && <li className="px-3 py-2 text-secondary text-sm">No matches</li>}
          {!loading && opts.map((o, i) => (
            <li key={o.id} role="option" aria-selected={i===hi}
                onMouseDown={(e)=>e.preventDefault()} onClick={()=>pick(i)}
                className={`px-3 py-2 cursor-pointer ${i===hi ? "bg-surface-strong" : ""}`}>
              <div className="text-sm">{o.label}</div>
              {o.hint && <div className="text-xs text-secondary">{o.hint}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
