// packages/ui/src/components/ColumnsPopover/ColumnsPopover.tsx
import * as React from "react";
import { createPortal } from "react-dom";
import { Button } from "../Button";
import { Input } from "../Input";
import { getOverlayRoot, acquireOverlayHost } from "../../overlay";

export type ColumnMeta = {
  key: string;
  label: string;
  default?: boolean; // NEW: allow modules to pass their default set inline
};

function toLabel(k: string) {
  if (!k) return "";
  const parts = k
    .toString()
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_\-.]+/g, " ")
    .trim()
    .split(/\s+/);
  return parts.map(p => p[0]?.toUpperCase() + p.slice(1)).join(" ");
}

type Props = {
  columns?: Record<string, boolean>;
  onToggle: (k: string) => void;
  onSet: (next: Record<string, boolean>) => void;
  allColumns?: ColumnMeta[];
  defaultKeys?: string[];
  triggerClassName?: string;
};

export function ColumnsPopover({
  columns = {},
  onToggle,
  onSet,
  allColumns,
  defaultKeys,
  triggerClassName,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const btnRef = React.useRef<HTMLButtonElement | null>(null);
  const [pos, setPos] = React.useState<{ top: number; left: number } | null>(null);

  // Build the list we render (preserve order labels were given)
  const list: ColumnMeta[] = React.useMemo(() => {
    const base: ColumnMeta[] = allColumns?.length
      ? allColumns
      : Object.keys(columns).map((key) => ({ key: String(key), label: toLabel(String(key)), default: false }));
    return base.map(c => ({
      key: String(c.key),
      label: c.label || toLabel(String(c.key)),
      default: !!c.default,
    }));
  }, [allColumns, columns]);

  // Compute the default-set source of truth (prop wins, else flags, else initial truthy)
  const initialTruthy = React.useRef<string[] | null>(null);
  React.useEffect(() => {
    if (!initialTruthy.current) {
      initialTruthy.current = Object.keys(columns).filter(k => !!columns[k]);
    }
  }, [columns]);

  const getDefaultKeys = React.useCallback((): string[] => {
    if (defaultKeys && defaultKeys.length) return defaultKeys.map(String);
    const flagged = list.filter(c => c.default).map(c => c.key);
    if (flagged.length) return flagged;
    return (initialTruthy.current ?? []).map(String);
  }, [defaultKeys, list]);

  // Make overlay host interactive while open
  React.useEffect(() => {
    if (!open) return;
    const release = acquireOverlayHost();
    return () => release();
  }, [open]);

  // ESC to close
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Positioning + listeners
  React.useEffect(() => {
    if (!open) return;

    const W = 320, PAD = 12;

    const sync = () => {
      const el = btnRef.current; if (!el) return;
      const r = el.getBoundingClientRect();
      const right = Math.min(window.innerWidth - PAD, r.right);
      const left = Math.max(PAD, right - W);
      const estH = 360;
      const below = r.bottom + 8;
      const above = Math.max(PAD, r.top - estH - 8);
      const top = below + estH + PAD > window.innerHeight ? above : Math.min(window.innerHeight - PAD, below);
      setPos({ top, left });
    };

    const parents: HTMLElement[] = [];
    let p = btnRef.current?.parentElement ?? null;
    while (p) {
      const s = getComputedStyle(p);
      if (/(auto|scroll|overlay)/.test(`${s.overflow}${s.overflowY}${s.overflowX}`)) parents.push(p);
      p = p.parentElement;
    }

    sync();
    window.addEventListener("resize", sync);
    window.addEventListener("scroll", sync, { passive: true });
    parents.forEach(n => n.addEventListener("scroll", sync, { passive: true }));

    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync);
      parents.forEach(n => n.removeEventListener("scroll", sync));
    };
  }, [open]);

  // Bulk actions
  const selectAll = () => {
    const next: Record<string, boolean> = {};
    list.forEach(c => (next[c.key] = true));
    onSet(next);
  };

  // Keep at least one visible column to avoid table grid collapse
  const clearAll = () => {
    const next: Record<string, boolean> = {};
    list.forEach(c => (next[c.key] = false));
    const fallback = getDefaultKeys()[0] ?? list[0]?.key;
    if (fallback) next[fallback] = true;
    onSet(next);
  };

  const setDefault = () => {
    const keys = getDefaultKeys();
    const ON = new Set(keys.map(String));
    const next: Record<string, boolean> = {};
    list.forEach(c => (next[c.key] = ON.has(c.key)));
    // safety: never zero visible cols
    if (!Object.values(next).some(Boolean)) {
      const fallback = keys[0] ?? list[0]?.key;
      if (fallback) next[fallback] = true;
    }
    onSet(next);
  };

  const menu = open && pos ? (() => {
    const host = getOverlayRoot() as HTMLElement;
    // SSR/defensive: if not a real DOM node, render nothing
    if (!host || typeof (host as any).appendChild !== "function") return null;
    return createPortal(
      <>
        <div
          onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 2147483644, background: "transparent", pointerEvents: "auto" }}
        />
        <div
          role="menu"
          aria-label="Show columns"
          data-surface="COLUMNS"
          className="rounded-md border border-hairline bg-surface p-2 pr-3 shadow-[0_8px_30px_hsla(0,0%,0%,0.35)] text-white" style={{
            position: "fixed",
            zIndex: 2147483645,
            top: pos.top,
            left: pos.left,
            width: 320,
            maxWidth: "calc(100vw - 24px)",
            maxHeight: 360,
            overflow: "auto",
            WebkitOverflowScrolling: "touch",
            pointerEvents: "auto",
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-2 pb-1">
            <div className="text-xs font-medium uppercase opacity-80 text-white">Show columns</div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={selectAll} className="text-xs font-medium hover:underline" style={{ color: "hsl(24 95% 54%)" }}>All</button>
              <button type="button" onClick={setDefault} className="text-xs font-medium hover:underline" style={{ color: "hsl(190 90% 45%)" }}>Default</button>
              <button type="button" onClick={clearAll} className="text-xs font-medium text-secondary hover:underline">Clear</button>
            </div>
          </div>

          {list.map((c) => {
            const checked = !!columns[c.key];
            return (
              <label
                key={c.key}
                data-col={c.key}
                className="grid grid-cols-[16px_1fr] gap-2 w-full min-w-0 px-2 py-1.5 text-[13px] leading-5 rounded hover:bg-[hsl(var(--brand-orange))]/12 cursor-pointer select-none" onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); onToggle(c.key); } }}
                onClick={(e) => { e.preventDefault(); onToggle(c.key); }}
              >
                {/* Checkbox stays on the LEFT */}
                <input
                  type="checkbox"
                  className="h-4 w-4 justify-self-start self-center m-0 p-0 accent-[hsl(var(--brand-orange))]"
                  aria-label={c.label}
                  checked={checked}
                  readOnly
                />
                <span className="truncate text-white" data-col-label>{c.label}</span>
              </label>
            );
          })}

          <div className="flex justify-end pt-2">
            <Button size="sm" variant="outline" onClick={() => setOpen(false)}>Close</Button>
          </div>
        </div>
      </>,
      host
    );
  })() : null;

  return (
    <div className="relative inline-flex">
      <Button
        ref={btnRef as any}
        data-columns-trigger
        variant="outline"
        size="icon"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={triggerClassName ?? "h-9 w-9"}
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

export default ColumnsPopover;
