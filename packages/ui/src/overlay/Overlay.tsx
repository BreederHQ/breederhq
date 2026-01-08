// packages/ui/src/overlay/Overlay.tsx
import * as React from "react";
import { createPortal } from "react-dom";

type OverlaySize = "sm" | "md" | "lg" | "xl";
type OverlayProps = {
  open: boolean;
  /** Controlled open state. Called with false when the overlay wants to close. */
  onOpenChange?: (v: boolean) => void;
  /** Optional close side effect. Called whenever the overlay closes itself. */
  onClose?: () => void;
  size?: OverlaySize;
  ariaLabel?: string;
  children: React.ReactNode;
  /** Optional host override for the portal. */
  root?: HTMLElement | null;
  /** Optional identifier for debugging/tests. */
  overlayId?: string;
  /** If true, clicking on backdrop does NOT close. Defaults to false. */
  disableOutsideClose?: boolean;
  /** If true, pressing Escape does NOT close. Defaults to false. */
  disableEscClose?: boolean;
  /** Legacy alias: if false, clicking on backdrop does NOT close. */
  closeOnOutsideClick?: boolean;
  /** Legacy alias: if false, pressing Escape does NOT close. */
  closeOnEscape?: boolean;
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
    nodes.slice(1).forEach((n) => n.parentElement?.removeChild(n));
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

type OverlaySlot = "header" | "body" | "footer";

function splitSlots(children: React.ReactNode) {
  const items = React.Children.toArray(children);
  const slots: Record<OverlaySlot, React.ReactNode[]> = {
    header: [],
    body: [],
    footer: [],
  };
  let hasSlots = false;

  items.forEach((child) => {
    if (React.isValidElement(child)) {
      const props = child.props as Record<string, unknown> | null;
      const slot = props?.["data-bhq-overlay-slot"] as OverlaySlot | undefined;
      if (slot === "header" || slot === "body" || slot === "footer") {
        slots[slot].push(child);
        hasSlots = true;
        return;
      }
    }
    slots.body.push(child);
  });

  if (!hasSlots) {
    slots.body = items;
  }

  return { ...slots, hasSlots };
}

export const Overlay: React.FC<OverlayProps> = ({
  open,
  onOpenChange,
  onClose,
  size = "md",
  ariaLabel = "Dialog",
  children,
  root,
  overlayId,
  disableOutsideClose = false,
  disableEscClose = false,
  closeOnOutsideClick,
  closeOnEscape,
}) => {
  const effectiveDisableOutsideClose =
    typeof disableOutsideClose === "boolean"
      ? disableOutsideClose
      : closeOnOutsideClick === false;
  const effectiveDisableEscClose =
    typeof disableEscClose === "boolean"
      ? disableEscClose
      : closeOnEscape === false;

  const requestClose = React.useCallback(() => {
    if (onOpenChange) {
      onOpenChange(false);
    }
    if (onClose) {
      onClose();
    }
  }, [onOpenChange, onClose]);

  // Prefer the provided host or shared host; otherwise fallback to body (standalone/local mode).
  const host = root ?? getHost() ?? (typeof document !== "undefined" ? document.body : null);
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const mouseDownOnBackdrop = React.useRef(false);
  const { header, body, footer } = splitSlots(children);
  const hasHeader = header.length > 0;
  const hasFooter = footer.length > 0;
  const bodyPaddingClass = hasHeader ? "px-4 pb-4" : "p-4";

  // Prevent background scroll while open
  React.useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [open]);

  // Close on Escape
  React.useEffect(() => {
    if (!open || effectiveDisableEscClose) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        requestClose();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open, effectiveDisableEscClose, requestClose]);

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
      className="bhq-overlay fixed inset-0"
      style={{ zIndex: "var(--z-overlay, 1000)" }} // default fallback if token missing
      data-bhq-overlay
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onMouseDown={() => (mouseDownOnBackdrop.current = true)}
        onMouseUp={(e) => {
          if (mouseDownOnBackdrop.current && !effectiveDisableOutsideClose) {
            if (e.target === e.currentTarget) {
              requestClose();
            }
          }
          mouseDownOnBackdrop.current = false;
        }}
      />

      {/* Panel area */}
      <div className="absolute inset-0 flex items-start justify-center">
        <div
          ref={panelRef}
          tabIndex={-1}
          data-scale-container
          data-overlay-id={overlayId}
          className={[
            // fixed-size shell: height capped by viewport; content will scroll inside
            "my-4 max-w-[95vw] rounded-xl border border-hairline bg-surface shadow-xl outline-none",
            "flex flex-col overflow-hidden",
            "max-h-[calc(100dvh-32px)]",
            SIZES[size],
          ].join(" ")}
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {hasHeader && (
            <div className="shrink-0 px-4 pt-4" data-bhq-overlay-header>
              {header}
            </div>
          )}
          <div
            className={[
              "flex-1 min-h-0 overflow-y-auto",
              bodyPaddingClass,
            ].join(" ")}
            style={{ overscrollBehavior: "contain" }}
            data-bhq-overlay-body
          >
            {body}
          </div>
          {hasFooter && (
            <div
              className="shrink-0 sticky bottom-0 z-[2] border-t border-hairline bg-surface px-4 py-3"
              data-bhq-overlay-footer
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>,
    host
  );
};
