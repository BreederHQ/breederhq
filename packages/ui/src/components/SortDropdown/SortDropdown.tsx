// packages/ui/src/components/SortDropdown/SortDropdown.tsx
import * as React from "react";
import { createPortal } from "react-dom";
import { Button } from "../Button";
import { getOverlayRoot, acquireOverlayHost } from "../../overlay";

export type SortOption = {
  key: string;
  label: string;
};

export type SortRule = {
  key: string;
  dir: "asc" | "desc";
};

type Props = {
  /** Available fields to sort by */
  options: SortOption[];
  /** Current sort state (first item is primary sort) */
  sorts: SortRule[];
  /** Called when user selects a sort option */
  onSort: (key: string, dir: "asc" | "desc") => void;
  /** Called to clear all sorts */
  onClear?: () => void;
  /** Optional class for the trigger button */
  triggerClassName?: string;
};

export function SortDropdown({
  options,
  sorts,
  onSort,
  onClear,
  triggerClassName,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const btnRef = React.useRef<HTMLButtonElement | null>(null);
  const [pos, setPos] = React.useState<{ top: number; left: number } | null>(null);

  const currentSort = sorts[0] ?? null;
  const currentLabel = currentSort
    ? options.find((o) => o.key === currentSort.key)?.label ?? currentSort.key
    : null;

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

    const W = 240, PAD = 12;

    const sync = () => {
      const el = btnRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const right = Math.min(window.innerWidth - PAD, r.right);
      const left = Math.max(PAD, right - W);
      const estH = Math.min(400, options.length * 40 + 100);
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
    parents.forEach((n) => n.addEventListener("scroll", sync, { passive: true }));

    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync);
      parents.forEach((n) => n.removeEventListener("scroll", sync));
    };
  }, [open, options.length]);

  const handleSelect = (key: string, dir: "asc" | "desc") => {
    onSort(key, dir);
    setOpen(false);
  };

  const handleClear = () => {
    onClear?.();
    setOpen(false);
  };

  const menu = open && pos ? (() => {
    const host = getOverlayRoot() as HTMLElement;
    if (!host || typeof (host as any).appendChild !== "function") return null;

    return createPortal(
      <>
        <div
          onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 2147483644, background: "transparent", pointerEvents: "auto" }}
        />
        <div
          role="menu"
          aria-label="Sort options"
          data-surface="SORT"
          className="rounded-md border border-hairline bg-surface p-2 shadow-[0_8px_30px_hsla(0,0%,0%,0.35)] text-white"
          style={{
            position: "fixed",
            zIndex: 2147483645,
            top: pos.top,
            left: pos.left,
            width: 240,
            maxWidth: "calc(100vw - 24px)",
            maxHeight: 400,
            overflow: "auto",
            WebkitOverflowScrolling: "touch",
            pointerEvents: "auto",
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-2 pb-1 mb-1 border-b border-hairline">
            <div className="text-xs font-medium uppercase opacity-80 text-white">Sort by</div>
            {currentSort && onClear && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs font-medium text-secondary hover:underline"
              >
                Clear
              </button>
            )}
          </div>

          {options.map((opt) => {
            const isActive = currentSort?.key === opt.key;
            const currentDir = isActive ? currentSort.dir : null;

            return (
              <div
                key={opt.key}
                className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded hover:bg-[hsl(var(--brand-orange))]/12 ${
                  isActive ? "bg-[hsl(var(--brand-orange))]/8" : ""
                }`}
              >
                <span className={`text-[13px] leading-5 truncate ${isActive ? "text-[hsl(var(--brand-orange))]" : "text-white"}`}>
                  {opt.label}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleSelect(opt.key, "asc")}
                    className={`p-1 rounded transition-colors ${
                      currentDir === "asc"
                        ? "bg-[hsl(var(--brand-orange))] text-black"
                        : "text-secondary hover:text-white hover:bg-white/10"
                    }`}
                    title={`Sort ${opt.label} ascending`}
                    aria-label={`Sort ${opt.label} ascending`}
                  >
                    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M8 3v10M4 7l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelect(opt.key, "desc")}
                    className={`p-1 rounded transition-colors ${
                      currentDir === "desc"
                        ? "bg-[hsl(var(--brand-orange))] text-black"
                        : "text-secondary hover:text-white hover:bg-white/10"
                    }`}
                    title={`Sort ${opt.label} descending`}
                    aria-label={`Sort ${opt.label} descending`}
                  >
                    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M8 13V3M4 9l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}

          <div className="flex justify-end pt-2 mt-1 border-t border-hairline">
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
        data-sort-trigger
        variant="outline"
        size="sm"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={triggerClassName ?? "h-9 gap-1.5 px-2.5"}
        title={currentSort ? `Sorted by ${currentLabel} (${currentSort.dir === "asc" ? "ascending" : "descending"})` : "Sort"}
      >
        <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 4h12M4 8h8M6 12h4" strokeLinecap="round" />
        </svg>
        {currentSort ? (
          <>
            <span className="hidden sm:inline text-xs">{currentLabel}</span>
            <span className="text-[10px] opacity-70">{currentSort.dir === "asc" ? "↑" : "↓"}</span>
          </>
        ) : (
          <span className="hidden sm:inline text-xs">Sort</span>
        )}
      </Button>
      {menu}
    </div>
  );
}

export default SortDropdown;
