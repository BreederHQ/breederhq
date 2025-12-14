import * as React from "react";
import type { OwnershipRow, OwnershipApi } from "../../utils";

type Props = {
  api: OwnershipApi;
  value: OwnershipRow[];
  onChange: (rows: OwnershipRow[]) => void;
};

type Hit = { id: number; name: string; kind: "Organization" | "Contact" };

export function OwnershipEditor({ api, value, onChange }: Props) {
  const [q, setQ] = React.useState("");
  const [hits, setHits] = React.useState<Hit[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    const needle = q.trim();
    if (!needle) { setHits([]); return; }
    setLoading(true);
    Promise.all([
      api.searchOrganizations(needle).catch(() => [] as any),
      api.searchContacts(needle).catch(() => [] as any),
    ]).then(([orgs, contacts]) => {
      if (!alive) return;
      const rows: Hit[] = [
        ...(orgs || []).map((o: any) => ({ id: Number(o.id), name: String(o.name), kind: "Organization" as const })),
        ...(contacts || []).map((c: any) => ({ id: Number(c.id), name: String(c.name), kind: "Contact" as const })),
      ];
      setHits(rows);
    }).finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [q, api]);

  function add(hit: Hit) {
    const row: OwnershipRow = hit.kind === "Organization"
      ? { partyType: "Organization", organizationId: hit.id, contactId: null, display_name: hit.name, is_primary: value.length === 0, percent: value.length === 0 ? 100 : undefined }
      : { partyType: "Contact", contactId: hit.id, organizationId: null, display_name: hit.name, is_primary: value.length === 0, percent: value.length === 0 ? 100 : undefined };
    const next = [...value, row];
    normalize(next);
  }

  function remove(idx: number) {
    const next = value.filter((_, i) => i !== idx);
    normalize(next);
  }

  function setPrimary(idx: number) {
    const next = value.map((r, i) => ({ ...r, is_primary: i === idx }));
    normalize(next);
  }

  function setPercent(idx: number, p: number) {
    const pct = Math.max(0, Math.min(100, Math.round(p || 0)));
    const next = value.map((r, i) => i === idx ? { ...r, percent: pct } : r);
    normalize(next);
  }

  function normalize(rows: OwnershipRow[]) {
    // Ensure exactly one primary (first if none)
    let ensured = rows;
    if (!ensured.some(r => r.is_primary)) {
      ensured = ensured.map((r, i) => ({ ...r, is_primary: i === 0 }));
    }
    // If percents present, clamp total to 100 by scaling down (simple rule)
    const nums = ensured.map(r => (typeof r.percent === "number" ? r.percent : 0));
    const total = nums.reduce((a, b) => a + b, 0);
    if (total > 100 && total > 0) {
      const factor = 100 / total;
      ensured = ensured.map(r => typeof r.percent === "number" ? { ...r, percent: Math.max(0, Math.min(100, Math.round(r.percent * factor))) } : r);
    }
    onChange(ensured);
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          className="h-9 w-full rounded-md border border-hairline bg-surface px-3 text-sm"
          placeholder="Search organizations or contacts…"
          value={q}
          onChange={(e) => setQ((e.currentTarget as HTMLInputElement).value)}
        />
      </div>

      {/* hits */}
      {q.trim() && (
        <div className="rounded-md border border-hairline max-h-40 overflow-auto">
          {loading && <div className="px-3 py-2 text-xs text-secondary">Searching…</div>}
          {!loading && hits.length === 0 && <div className="px-3 py-2 text-xs text-secondary">No matches</div>}
          {!loading && hits.map((h, i) => (
            <button
              key={`${h.kind}:${h.id}:${i}`}
              className="w-full text-left px-3 py-2 text-sm hover:bg-surface-strong"
              onClick={() => { add(h); setQ(""); setHits([]); }}
            >
              <span className="text-primary">{h.name}</span>
              <span className="ml-2 text-[10px] px-1 rounded border border-hairline text-secondary">{h.kind}</span>
            </button>
          ))}
        </div>
      )}

      {/* table */}
      <div className="rounded-md border border-hairline divide-y">
        {value.length === 0 && <div className="px-3 py-2 text-sm text-secondary">No owners yet.</div>}
        {value.map((r, i) => (
          <div key={i} className="px-3 py-2 grid items-center gap-2" style={{ gridTemplateColumns: "minmax(0,1fr) 84px 84px 40px" }}>
            <div className="truncate">
              <span className="text-sm">{r.display_name || (r.partyType === "Organization" ? `Org #${r.organizationId}` : `Contact #${r.contactId}`)}</span>
              <span className="ml-2 text-[10px] px-1 rounded border border-hairline text-secondary">{r.partyType}</span>
              {r.is_primary && <span className="ml-2 text-[10px]">★ Primary</span>}
            </div>
            <div>
              <input
                type="number"
                className="w-[84px] h-9 rounded-md border border-hairline bg-surface px-2 text-sm"
                placeholder="%"
                value={typeof r.percent === "number" ? r.percent : ""}
                onChange={(e) => setPercent(i, Number((e.currentTarget as HTMLInputElement).value))}
              />
            </div>
            <div>
              <button
                type="button"
                className={"w-[84px] h-9 rounded-md border text-sm " + (r.is_primary ? "border-hairline" : "border-hairline hover:bg-surface-strong")}
                onClick={() => setPrimary(i)}
              >
                {r.is_primary ? "Primary" : "Make primary"}
              </button>
            </div>
            <div>
              <button
                type="button"
                className="w-9 h-9 rounded-md border border-hairline text-sm hover:bg-surface-strong"
                onClick={() => remove(i)}
                aria-label="Remove"
                title="Remove"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
