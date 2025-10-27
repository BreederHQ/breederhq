// packages/ui/src/overlay/Overlay.tsx
import * as React from "react";
import { createPortal } from "react-dom";

type OverlaySize = "sm" | "md" | "lg" | "xl";
type OverlayProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void; // call with false to close
  size?: OverlaySize;
  ariaLabel?: string;
  children: React.ReactNode;
  /** If true, clicking on backdrop does NOT close. Defaults to false. */
  disableOutsideClose?: boolean;
  /** If true, pressing Escape does NOT close. Defaults to false. */
  disableEscClose?: boolean;
};

const SIZES: Record<OverlaySize, string> = {
  sm: "w-[440px]",
  md: "w-[640px]",
  lg: "w-[760px]",
  xl: "w-[960px]",
};

/** Canonical overlay host id */
const HOST_ID = "bhq-overlay-root";

/** Ensure a single canonical host; keep first, remove extras. */
function findCanonicalHost(): HTMLElement | null {
  if (typeof document === "undefined") return null;

  const nodes = Array.from(document.querySelectorAll<HTMLElement>(`#${HOST_ID}`));
  if (nodes.length > 1) {
    nodes.slice(1).forEach(n => n.parentElement?.removeChild(n));
  }
  const el = nodes[0] ?? null;
  return el;
}

/**
 * Obtain the overlay host. Prefer #bhq-overlay-root.
 * If absent and platform is not the owner, the caller may fallback to document.body.
 * (We don't *create* the host here to avoid cross-app conflicts.)
 */
function getHost(): HTMLElement | null {
  return findCanonicalHost() || document.getElementById(HOST_ID) || null;
}

/** Flip pointer-events on the host while overlays are open (handles nested overlays too). */
function useHostInteractivity(open: boolean, host: HTMLElement | null) {
  React.useEffect(() => {
    if (!host || !open) return;

    // Reference counter on the host
    const attr = "data-bhq-open-count";
    const current = Number(host.getAttribute(attr) || "0");
    const next = current + 1;
    host.setAttribute(attr, String(next));

    // Turn on interactivity while any overlay is open
    host.style.pointerEvents = "auto";

    return () => {
      const now = Number(host.getAttribute(attr) || "1") - 1;
      if (now > 0) {
        host.setAttribute(attr, String(now));
        host.style.pointerEvents = "auto";
      } else {
        host.removeAttribute(attr);
        // Return to default (usually none via CSS)
        host.style.pointerEvents = "";
      }
    };
  }, [open, host]);
}

export const Overlay: React.FC<OverlayProps> = ({
  open,
  onOpenChange,
  size = "md",
  ariaLabel = "Dialog",
  children,
  disableOutsideClose = false,
  disableEscClose = false,
}) => {
  // Prefer the shared host; otherwise fallback to body (standalone/local mode).
  const host = getHost() ?? (typeof document !== "undefined" ? document.body : null);
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const mouseDownOnBackdrop = React.useRef(false);

  // Prevent background scroll while open
  React.useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = prev; };
  }, [open]);

  // Close on Escape
  React.useEffect(() => {
    if (!open || disableEscClose) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onOpenChange(false);
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open, disableEscClose, onOpenChange]);

  // Basic focus trap when opened
  React.useEffect(() => {
    if (!open) return;
    const el = panelRef.current;
    if (!el) return;
    const prev = document.activeElement as HTMLElement | null;
    const focusables = el.querySelectorAll<HTMLElement>(
      'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
    );
    (focusables[0] || el).focus?.();
    return () => prev?.focus?.();
  }, [open]);

  // Host interactivity (pointer-events)
  useHostInteractivity(open, host && host.id === HOST_ID ? host : null);

  if (!open || !host) return null;

  return createPortal(
    <div
      role="dialog"
      aria-label={ariaLabel}
      aria-modal="true"
      className="bhq-overlay fixed inset-0 z-[1000]" /* keep below higher menus if any */
      data-bhq-overlay
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onMouseDown={() => (mouseDownOnBackdrop.current = true)}
        onMouseUp={(e) => {
          if (mouseDownOnBackdrop.current && !disableOutsideClose) {
            if (e.target === e.currentTarget) onOpenChange(false);
          }
          mouseDownOnBackdrop.current = false;
        }}
      />
      {/* Panel */}
      <div className="absolute inset-0 flex items-start justify-center">
        <div
          ref={panelRef}
          className={[
            "mt-10 max-w-[95vw] rounded-xl border border-hairline bg-surface shadow-xl p-4 outline-none",
            SIZES[size],
          ].join(" ")}
          tabIndex={-1}
          data-scale-container
        >
          {children}
        </div>
      </div>
    </div>,
    host
  );
};
