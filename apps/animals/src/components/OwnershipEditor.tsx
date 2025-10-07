import * as React from "react";

export type OwnerPartyType = "Contact" | "Organization";
export type OwnerRow = {
  id?: number;
  partyType: OwnerPartyType;
  contactId?: number | null;
  organizationId?: number | null;
  display_name: string;
  is_primary?: boolean;
  percent?: number | null; // 0..100 (optional)
};

type Pickable = { id: number; display_name: string };

export type OwnershipEditorProps = {
  api: {
    searchContacts: (q: string) => Promise<Pickable[]>;
    searchOrganizations: (q: string) => Promise<Pickable[]>;
  };
  value: OwnerRow[];
  onChange: (rows: OwnerRow[]) => void;
  className?: string;
};

export default function OwnershipEditor({ api, value, onChange, className }: OwnershipEditorProps) {
  const [rows, setRows] = React.useState<OwnerRow[]>(() => value ?? []);
  const [error, setError] = React.useState("");
  const radioGroupName = React.useId();

  React.useEffect(() => setRows(value ?? []), [value]);

  function push(next: OwnerRow[]) {
    const e = validate(next);
    setError(e);
    onChange(enforceSinglePrimary(next));
  }

  function validate(list: OwnerRow[]) {
    const total = list.reduce((a, o) => a + (typeof o.percent === "number" ? o.percent : 0), 0);
    if (total > 100.0001) return "Ownership percentages exceed 100%.";
    if (list.length > 1 && !list.some(o => o.is_primary)) return "Select a primary owner.";
    for (const o of list) {
      if (!o.display_name?.trim()) return "Each owner must have a name.";
      if (o.partyType === "Contact" && !o.contactId) return "Choose a Contact for each Contact row.";
      if (o.partyType === "Organization" && !o.organizationId) return "Choose an Organization for each Organization row.";
    }
    return "";
  }

  function enforceSinglePrimary(list: OwnerRow[]) {
    const idx = list.findIndex(o => o.is_primary);
    if (idx < 0) return list;
    return list.map((o, i) => ({ ...o, is_primary: i === idx }));
  }

  function addRow() {
    const next = [
      ...rows,
      {
        partyType: "Contact",
        display_name: "",
        contactId: null,
        organizationId: null,
        is_primary: rows.length === 0,
        percent: null,
      },
    ];
    setRows(next);
    push(next);
  }

  function removeRow(i: number) {
    const wasPrimary = !!rows[i]?.is_primary;
    const next = rows.filter((_, idx) => idx !== i);
    if (wasPrimary && next.length > 0) next[0] = { ...next[0], is_primary: true };
    setRows(next);
    push(next);
  }

  function setParty(i: number, partyType: OwnerPartyType) {
    const next = rows.map((o, idx) =>
      idx === i
        ? {
            ...o,
            partyType,
            contactId: partyType === "Contact" ? (o.contactId ?? null) : null,
            organizationId: partyType === "Organization" ? (o.organizationId ?? null) : null,
            // keep display_name as-is; user can overwrite via typeahead pick
          }
        : o
    );
    setRows(next);
    push(next);
  }

  function setPrimary(i: number) {
    const next = rows.map((o, idx) => ({ ...o, is_primary: idx === i }));
    setRows(next);
    push(next);
  }

  function setPercent(i: number, val: string) {
    const num = val === "" ? null : Number(val);
    const clamped = Number.isFinite(num as number) ? Math.max(0, Math.min(100, num as number)) : null;
    const next = rows.map((o, idx) => (idx === i ? { ...o, percent: clamped } : o));
    setRows(next);
    push(next);
  }

  function blurPercent(i: number) {
    const v = rows[i]?.percent;
    if (v == null) return;
    const rounded = Math.round(v * 100) / 100;
    if (rounded !== v) {
      const next = rows.map((o, idx) => (idx === i ? { ...o, percent: rounded } : o));
      setRows(next);
      push(next);
    }
  }

  async function typeahead(kind: OwnerPartyType, q: string) {
    if (!q || q.trim().length < 2) return [];
    return kind === "Contact" ? api.searchContacts(q.trim()) : api.searchOrganizations(q.trim());
  }

  async function setPicked(i: number, partyType: OwnerPartyType, pick: Pickable) {
    const next = rows.map((o, idx) =>
      idx === i
        ? partyType === "Contact"
          ? { ...o, partyType, contactId: pick.id, organizationId: null, display_name: pick.display_name }
          : { ...o, partyType, organizationId: pick.id, contactId: null, display_name: pick.display_name }
        : o
    );
    setRows(next);
    push(next);
  }

  return (
    <div className={className ?? ""}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold">Ownership</div>
        <button
          type="button"
          onClick={addRow}
          className="text-xs px-2 py-1 rounded-md border border-hairline bg-surface-strong hover:bg-surface"
        >
          Add owner
        </button>
      </div>

      {rows.length === 0 && <div className="text-xs text-secondary">No owners yet. Add one below.</div>}

      <div className="space-y-2">
        {rows.map((row, i) => (
          <div
            key={`${row.partyType}:${i}`}
            className="grid items-center gap-2 py-1"
            style={{ gridTemplateColumns: "110px minmax(240px,1fr) 72px 92px 36px" }}
            role="group"
            aria-label={`Ownership row ${i + 1}`}
          >
            {/* Party type */}
            <select
              className="h-9 rounded-md border border-hairline bg-surface px-2 text-sm"
              value={row.partyType}
              onChange={(e) => setParty(i, e.target.value as OwnerPartyType)}
              aria-label="Owner type"
            >
              <option>Contact</option>
              <option>Organization</option>
            </select>

            {/* Typeahead (remounts when party type changes so it's never "stuck") */}
            <Typeahead
              key={`${row.partyType}:${i}`} // force remount on party change
              placeholder={row.partyType === "Contact" ? "Search contact…" : "Search organization…"}
              initialLabel={row.display_name || ""}
              fetch={(q) => typeahead(row.partyType, q)}
              onPick={(choice) => setPicked(i, row.partyType, choice)}
            />

            {/* Percent with visible % suffix */}
            <div className="relative">
              <input
                inputMode="decimal"
                placeholder="%"
                className="h-9 w-[72px] rounded-md border border-hairline bg-surface pr-6 pl-2 text-sm text-right"
                value={row.percent ?? ""}
                onChange={(e) => setPercent(i, e.target.value)}
                onBlur={() => blurPercent(i)}
                aria-label="Ownership percent"
              />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-secondary">%</span>
            </div>

            {/* Primary (same row) */}
            <label className="inline-flex items-center justify-center gap-2 text-xs">
              <input
                type="radio"
                name={`primary-owner-${radioGroupName}`}
                checked={!!row.is_primary}
                onChange={() => setPrimary(i)}
                aria-label="Primary owner"
              />
              <span>Primary</span>
            </label>

            {/* Remove */}
            <button
              type="button"
              className="h-9 w-9 rounded-md border border-hairline hover:bg-surface-strong text-sm leading-none"
              onClick={() => removeRow(i)}
              aria-label="Remove owner row"
              title="Remove"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {error && <div className="text-xs text-red-600 mt-2">{error}</div>}

      <div className="text-xs text-secondary mt-2">
        Tip: Leave % blank if unknown. If provided, totals should not exceed 100%.
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────── */

function Typeahead({
  placeholder,
  initialLabel,
  fetch,
  onPick,
}: {
  placeholder?: string;
  initialLabel?: string;
  fetch: (q: string) => Promise<Pickable[]>;
  onPick: (choice: Pickable) => void;
}) {
  const [q, setQ] = React.useState(initialLabel || "");
  const [open, setOpen] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const [items, setItems] = React.useState<Pickable[]>([]);
  const popRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    setQ(initialLabel || "");
  }, [initialLabel]);

  // Fetch only when the field is focused, so a prefilled label doesn't auto-open.
  React.useEffect(() => {
    if (!focused) return;
    const t = setTimeout(async () => {
      if (q.trim().length < 2) {
        setItems([]);
        setOpen(false);
        return;
      }
      const res = await fetch(q.trim());
      setItems(res);
      setOpen(true);
    }, 150);
    return () => clearTimeout(t);
  }, [q, focused, fetch]);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!popRef.current) return;
      if (!popRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div className="relative" ref={popRef}>
      <input
        className="h-9 w-full rounded-md border border-hairline bg-surface px-2 text-sm"
        value={q}
        placeholder={placeholder}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => {
          setFocused(true);
          // don't open yet; wait for 2+ chars typed
        }}
        onBlur={() => setFocused(false)}
        aria-autocomplete="list"
        aria-expanded={open}
      />
      {open && items.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-hairline bg-surface shadow max-h-60 overflow-auto">
          {items.map((it) => (
            <button
              key={it.id}
              type="button"
              onClick={() => {
                onPick(it);
                setQ(it.display_name);
                setOpen(false);
              }}
              className="w-full text-left px-2 py-1 text-sm hover:bg-surface-strong"
            >
              {it.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
