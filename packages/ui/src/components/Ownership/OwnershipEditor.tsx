import * as React from "react";
import type { OwnershipRow, OwnershipApi } from "../../utils/ownership";

type Props = {
  api: OwnershipApi;
  value: OwnershipRow[];
  onChange: (rows: OwnershipRow[]) => void;
};

type Hit = {
  id: number;
  name: string;
  kind: "Organization" | "Contact";
};

export function OwnershipEditor({ api, value, onChange }: Props) {
  const [q, setQ] = React.useState("");
  const [hits, setHits] = React.useState<Hit[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);

  // -------- search --------
  React.useEffect(() => {
    let alive = true;
    const needle = q.trim();
    if (!needle) {
      setHits([]);
      return;
    }

    setLoading(true);
    Promise.all([
      api.searchOrganizations?.(needle).catch(() => [] as any) ?? [],
      api.searchContacts?.(needle).catch(() => [] as any) ?? [],
    ])
      .then(([orgs, contacts]) => {
        if (!alive) return;

        const orgRows: Hit[] = (orgs || []).map((o: any) => ({
          id: Number(o.id),
          name: String(o.name ?? o.display_name ?? o.title ?? ""),
          kind: "Organization",
        }));

        const contactRows: Hit[] = (contacts || []).map((c: any) => {
          const fallback =
            `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || c.email;
          return {
            id: Number(c.id),
            name: String(c.name ?? c.display_name ?? fallback ?? ""),
            kind: "Contact",
          };
        });

        setHits([...orgRows, ...contactRows]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [q, api]);

  // -------- normalizer --------
  function normalize(rows: OwnershipRow[]) {
    let ensured = [...rows];

    // Ensure exactly one primary when there are rows
    if (ensured.length) {
      if (!ensured.some((r) => r.is_primary)) {
        ensured = ensured.map((r, i) => ({ ...r, is_primary: i === 0 }));
      } else {
        let seen = false;
        ensured = ensured.map((r) => {
          if (r.is_primary) {
            if (seen) return { ...r, is_primary: false };
            seen = true;
            return r;
          }
          return r;
        });
      }
    }

    // Clamp percents and scale down if total exceeds 100
    const nums = ensured.map((r) =>
      typeof r.percent === "number" ? r.percent : 0
    );
    const total = nums.reduce((a, b) => a + b, 0);

    if (total > 100 && total > 0) {
      const factor = 100 / total;
      ensured = ensured.map((r) =>
        typeof r.percent === "number"
          ? { ...r, percent: Math.round(r.percent * factor) }
          : r
      );
    }

    onChange(ensured);

    // Keep selection valid
    if (selectedIndex != null && selectedIndex >= ensured.length) {
      setSelectedIndex(ensured.length ? ensured.length - 1 : null);
    }
  }

  // -------- CRUD helpers --------
  function add(hit: Hit) {
    const isFirst = value.length === 0;

    const row: OwnershipRow =
      hit.kind === "Organization"
        ? {
            partyType: "Organization",
            organizationId: hit.id,
            contactId: null,
            display_name: hit.name,
            is_primary: isFirst,
            percent: isFirst ? 100 : undefined,
          }
        : {
            partyType: "Contact",
            contactId: hit.id,
            organizationId: null,
            display_name: hit.name,
            is_primary: isFirst,
            percent: isFirst ? 100 : undefined,
          };

    const next = [...value, row];
    setQ("");
    setHits([]);
    setSelectedIndex(next.length - 1);
    normalize(next);
  }

  function remove(idx: number) {
    const next = value.filter((_, i) => i !== idx);
    normalize(next);
  }

  function setPercent(idx: number, p: number) {
    const pct = Math.max(0, Math.min(100, Math.round(p || 0)));
    const next = value.map((r, i) =>
      i === idx ? { ...r, percent: pct } : r
    );
    normalize(next);
  }

  // -------- primary vs additional --------
  const primaryIndex = value.findIndex((r) => r.is_primary);
  const primaryRow = primaryIndex >= 0 ? value[primaryIndex] : null;

  const additional = value
    .map((row, idx) => ({ row, idx }))
    .filter(({ row }) => !row.is_primary);

  const selected = selectedIndex != null ? value[selectedIndex] : null;
  const canMoveToPrimary = !!selected && !selected.is_primary;
  const canMoveToAdditional =
    !!selected && selected.is_primary && value.length > 1;

  function moveSelectedToPrimary() {
    if (!canMoveToPrimary || selectedIndex == null) return;

    const next = value.map((r, i) => {
      if (i === selectedIndex) return { ...r, is_primary: true };
      if (r.is_primary) return { ...r, is_primary: false };
      return r;
    });

    normalize(next);
  }

  function moveSelectedToAdditional() {
    if (!canMoveToAdditional || selectedIndex == null) return;

    const next = value.map((r, i) =>
      i === selectedIndex ? { ...r, is_primary: false } : r
    );

    normalize(next);
  }

  // -------- row renderer --------
  function renderRow(row: OwnershipRow, idx: number) {
    const isSelected = selectedIndex === idx;

    const label =
      row.display_name ||
      (row as any).name ||
      (row as any).party_name ||
      (row as any).contact?.display_name ||
      "";

    const tag =
      row.partyType === "Organization"
        ? "Organization"
        : row.partyType === "Contact"
        ? "Contact"
        : (row as any).type || "";

    return (
      <div
        key={idx}
        onClick={() => setSelectedIndex(idx)}
        className={[
          "flex items-center justify-between gap-2 px-3 py-2 text-xs cursor-pointer",
          "hover:bg-neutral-800/60",
          isSelected ? "bg-neutral-800 border border-orange-500" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="min-w-0 flex-1">
          <div className="truncate">{label || "Unnamed"}</div>
          {tag && (
            <div className="inline-flex mt-1 px-1.5 py-0.5 rounded border border-neutral-600 text-[10px] uppercase tracking-wide text-neutral-300">
              {tag}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={0}
            max={100}
            className="w-16 rounded border border-neutral-700 bg-neutral-900 px-1 py-0.5 text-right text-xs"
            value={typeof row.percent === "number" ? row.percent : ""}
            placeholder="%"
            onChange={(e) => setPercent(idx, Number(e.target.value))}
          />
          <button
            type="button"
            className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded border border-neutral-700 text-[10px] hover:bg-neutral-800"
            onClick={(ev) => {
              ev.stopPropagation();
              remove(idx);
            }}
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  // -------- render --------
  return (
    <div className="flex flex-col gap-3 text-xs">
      {/* Search bar, centered above both columns */}
      <div className="relative">
        <input
          className="w-full rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs"
          placeholder="Search organizations or contacts..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {loading && (
          <div className="absolute right-2 top-1 text-[10px] text-neutral-500">
            Loading...
          </div>
        )}
        {hits.length > 0 && (
          <div className="absolute z-20 mt-1 w-full rounded border border-neutral-700 bg-neutral-900 shadow-lg">
            {hits.map((h, i) => (
              <button
                key={`${h.kind}-${h.id}-${i}`}
                type="button"
                className="flex w-full items-center justify-between px-2 py-1 text-left hover:bg-neutral-800"
                onClick={() => add(h)}
              >
                <div className="truncate">{h.name}</div>
                <span className="ml-2 rounded border border-neutral-700 px-1 text-[10px]">
                  {h.kind}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Primary column, arrows, additional column */}
      <div className="grid grid-cols-[minmax(0,1.4fr)_auto_minmax(0,1.4fr)] gap-3">
        {/* Primary */}
        <div className="rounded border border-neutral-700 min-h-[48px]">
          {primaryRow ? (
            renderRow(primaryRow, primaryIndex)
          ) : (
            <div className="px-3 py-2 text-xs text-neutral-500">
              No primary owner yet.
            </div>
          )}
        </div>

        {/* Arrows */}
        <div className="flex flex-col items-center justify-center gap-2">
          <button
            type="button"
            disabled={!canMoveToPrimary}
            className={[
              "inline-flex h-7 w-7 items-center justify-center rounded border text-xs",
              canMoveToPrimary
                ? "border-orange-500 text-orange-500 hover:bg-orange-500/10"
                : "border-neutral-700 text-neutral-600 cursor-default",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={moveSelectedToPrimary}
          >
            ←
          </button>
          <button
            type="button"
            disabled={!canMoveToAdditional}
            className={[
              "inline-flex h-7 w-7 items-center justify-center rounded border text-xs",
              canMoveToAdditional
                ? "border-orange-500 text-orange-500 hover:bg-orange-500/10"
                : "border-neutral-700 text-neutral-600 cursor-default",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={moveSelectedToAdditional}
          >
            →
          </button>
        </div>

        {/* Additional */}
        <div className="rounded border border-neutral-700 min-h-[48px]">
          {additional.length ? (
            additional.map(({ row, idx }) => renderRow(row, idx))
          ) : (
            <div className="px-3 py-2 text-xs text-neutral-500">
              No additional owners yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
