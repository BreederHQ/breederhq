// packages/ui/src/components/ColumnsPopover/ColumnsPopover.tsx
import * as React from "react";
import { createPortal } from "react-dom";
import { Button } from "../Button";
import { Input } from "../Input";
import { getOverlayRoot } from "../../overlay";

export type ColumnMeta = { key: string; label: string };

export function ColumnsPopover({
  // current visibility map
  columns,
  onToggle,
  onSet,

  // make it generic: pass the full list + which keys are “default on”
  allColumns,
  defaultKeys = [],
}: {
  columns: Record<string, boolean>;
  onToggle: (k: string) => void;
  onSet: (next: Record<string, boolean>) => void;
  allColumns: ColumnMeta[];
  defaultKeys?: string[];
}) {
  const [open, setOpen] = React.useState(false);
  const btnRef = React.useRef<HTMLButtonElement | null>(null);
  const [pos, setPos] = React.useState<{ top: number; left: number } | null>(null);

  // ESC to close
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // position + scroll listeners while open
  React.useEffect(() => {
    if (!open) return;

    const W = 320;
    const PAD = 12;

    const sync = () => {
      const el = btnRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const right = Math.min(window.innerWidth - PAD, r.right);
      const left = Math.max(PAD, right - W);
      const estH = 360;
      const below = r.bottom + 8;
      const above = Math.max(PAD, r.top - estH - 8);
      const top = below + estH + PAD > window.innerHeight ? above : Math.min(window.innerHeight - PAD, below);
      setPos({ top, left });
    };

    const getScrollParents = (el: HTMLElement | null) => {
      const out: HTMLElement[] = [];
      let p = el?.parentElement ?? null;
      while (p) {
        const s = getComputedStyle(p);
        if (/(auto|scroll|overlay)/.test(`${s.overflow}${s.overflowY}${s.overflowX}`)) out.push(p);
        p = p.parentElement;
      }
      return out;
    };

    const parents = getScrollParents(btnRef.current);
    sync();
    window.addEventListener("resize", sync);
    window.addEventListener("scroll", sync, { passive: true });
    parents.forEach((n) => n.addEventListener("scroll", sync, { passive: true }));

    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync);
      parents.forEach((n) => n.removeEventListener("scroll", sync));
    };
  }, [open]);

  // bulk actions
  const selectAll = () => {
    const next = { ...columns };
    allColumns.forEach((c) => (next[String(c.key)] = true));
    onSet(next);
  };
  const clearAll = () => {
    const next = { ...columns };
    allColumns.forEach((c) => (next[String(c.key)] = false));
    onSet(next);
  };
  const setDefault = () => {
    const ON = new Set(defaultKeys.map(String));
    const next = { ...columns };
    allColumns.forEach((c) => (next[String(c.key)] = ON.has(String(c.key))));
    onSet(next);
  };

  const menu = open && pos ? createPortal(
    <>
      {/* backdrop for outside-click */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 2147483644,
          background: "transparent",
          pointerEvents: "auto",
        }}
      />
      <div
        role="menu"
        aria-label="Show columns"
        className="rounded-md border border-hairline bg-surface p-2 pr-3 shadow-[0_8px_30px_hsla(0,0%,0%,0.35)]"
        style={{
          position: "fixed",
          zIndex: 2147483645,
          top: pos.top,
          left: pos.left,
          width: 320,
          maxWidth: "calc(100vw - 24px)",
          maxHeight: 360,
          overflow: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div className="flex items-center justify-between px-2 pb-1">
          <div className="text-xs font-medium uppercase text-secondary">Show columns</div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={selectAll} className="text-xs font-medium hover:underline" style={{ color: "hsl(24 95% 54%)" }}>
              All
            </button>
            <button type="button" onClick={setDefault} className="text-xs font-medium hover:underline" style={{ color: "hsl(190 90% 45%)" }}>
              Default
            </button>
            <button type="button" onClick={clearAll} className="text-xs font-medium text-secondary hover:underline">
              Clear
            </button>
          </div>
        </div>

        {allColumns.map((c) => {
          const k = String(c.key);
          const checked = !!columns[k];
          return (
            <label
              key={k}
              data-col={k}
              tabIndex={0}
              role="checkbox"
              aria-checked={checked ? "true" : "false"}
              className="flex items-center gap-2 w-full min-w-0 px-2 py-1.5 text-[13px] leading-5 rounded hover:bg-[hsl(var(--brand-orange))]/12 cursor-pointer select-none"
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  onToggle(k);
                }
              }}
              onClick={(e) => {
                e.preventDefault();
                onToggle(k);
              }}
            >
              <Input
                type="checkbox"
                className="h-4 w-4 shrink-0 accent-[hsl(var(--brand-orange))]"
                aria-label={c.label}
                checked={checked}
                readOnly
              />
              <span className="truncate text-primary">{c.label}</span>
            </label>
          );
        })}

        <div className="flex justify-end pt-2">
          <Button size="sm" variant="outline" onClick={() => setOpen(false)}>Close</Button>
        </div>
      </div>
    </>,
    getOverlayRoot()
  ) : null;

  return (
    <div className="relative inline-flex">
      <Button
        ref={btnRef as any}
        variant="outline"
        size="icon"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="h-9 w-9"
        title="Choose columns"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="5" height="16" rx="1.5" />
          <rect x="10" y="4" width="5" height="16" rx="1.5" />
          <rect x="17" y="4" width="4" height="16" rx="1.5" />
        </svg>
      </Button>
      {menu}
    </div>
  );
}
