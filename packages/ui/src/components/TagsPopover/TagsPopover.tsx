// packages/ui/src/components/TagsPopover/TagsPopover.tsx
import * as React from "react";
import { createPortal } from "react-dom";
import { Button } from "../Button";
import { Input } from "../Input";
import { getOverlayRoot } from "../../overlay";

const Z = {
  popover: 4000,
  backdrop: 3990,
} as const;

type TagsPopoverProps = {
  /** Full list of tag names from the API */
  tags: string[];
  /** Currently-selected tag names */
  selected: string[];
  /** Toggle handler (parent owns state) */
  onToggle: (name: string) => void;
  /** Optional button label; defaults to "Manage" */
  label?: React.ReactNode;
  /** Align the popover panel relative to the trigger */
  align?: "start" | "end";
  /** Optional className for the trigger button */
  className?: string;
};

export function TagsPopover({
  tags,
  selected,
  onToggle,
  label = "Manage",
  align = "start",
  className,
}: TagsPopoverProps) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const btnRef = React.useRef<HTMLButtonElement | null>(null);
  const [pos, setPos] = React.useState<{ top: number; left: number; width: number } | null>(null);

  // Keep selection 100% controlled — no internal selection state at all.
  const selectedSet = React.useMemo(
    () => new Set((selected || []).map((s) => s.toLowerCase())),
    [selected]
  );

  // Filter + sort tags
  const filtered = React.useMemo(() => {
    const uq = Array.from(new Set(tags || [])).filter(Boolean);
    const norm = uq.sort((a, b) => a.localeCompare(b));
    const t = q.trim().toLowerCase();
    return t ? norm.filter((x) => x.toLowerCase().includes(t)) : norm;
  }, [tags, q]);

  // Position the panel next to the trigger (no body scroll locking!)
  React.useEffect(() => {
    if (!open) return;

    const sync = () => {
      const el = btnRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const panelWidth = 320;
      const pad = 12;

      const left =
        align === "end"
          ? Math.max(pad, Math.min(window.innerWidth - panelWidth - pad, r.right - panelWidth))
          : Math.max(pad, Math.min(window.innerWidth - panelWidth - pad, r.left));

      const top = Math.min(
        // try below the button
        r.bottom + 8,
        // fallback if too close to bottom
        Math.max(pad, window.innerHeight - 300 - pad)
      );

      setPos({ top, left, width: r.width });
    };

    // Track scroll/resize (including scrollable parents) without changing <body> overflow
    const parents: HTMLElement[] = [];
    let p = btnRef.current?.parentElement || null;
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
  }, [open, align]);

  // Don’t move the page or lock the body. Backdrop is just for click-away.
  const panel =
    open && pos
      ? createPortal(
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: Z.backdrop, background: "transparent" }}
          />
          <div
            role="menu"
            className="rounded-xl border border-hairline bg-surface text-white shadow-[0_8px_30px_hsla(0,0%,0%,0.35)] max-w-[calc(100vw-24px)] w-[320px]" style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: Z.popover }}
          >
            <div className="p-2 border-b border-hairline">
              <Input
                autoFocus
                placeholder="Search tags…"
                value={q}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQ(e.currentTarget.value)}
                className="w-full rounded-md border border-hairline bg-surface px-2 py-1.5 text-sm outline-none focus:shadow-[0_0_0_2px_hsl(var(--brand-orange))] text-white placeholder:text-white/60"
              />
            </div>

            <div className="max-h-[300px] overflow-auto py-1">
              {filtered.length === 0 ? (
                <div className="px-3 py-2 text-white/70">
                  {Array.isArray(tags) && tags.length === 0 ? "None available" : "No matches"}
                </div>
              ) : (
                filtered.map((t) => {
                  const on = selectedSet.has(t.toLowerCase());
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => onToggle(t)}
                      role="menuitemcheckbox"
                      aria-checked={on}
                      className={[
                        "w-full grid grid-cols-[auto_1fr] items-center gap-2 px-3 py-2 text-left hover:bg-[hsl(var(--brand-orange))]/12",
                        on ? "font-medium" : "",
                      ].join(" ")}                      >
                      <span
                        className={[
                          "inline-grid place-items-center h-4 w-4 rounded-[4px] border",
                          on ? "border-[hsl(var(--brand-orange))]" : "border-hairline",
                        ].join(" ")}
                        aria-hidden
                      >
                        {on ? <span className="h-2 w-2 rounded-sm bg-[hsl(var(--brand-orange))]" /> : null}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            <div className="p-2 border-t border-hairline text-right">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </>,
        getOverlayRoot()
      )
      : null;

  return (
    <div className="inline-block">
      <Button
        ref={btnRef as any}
        variant="outline"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        className={className}
        aria-haspopup="menu"
        aria-expanded={open ? "true" : "false"}
      >
        {label}
      </Button>
      {panel}
    </div>
  );
}

export default TagsPopover;
