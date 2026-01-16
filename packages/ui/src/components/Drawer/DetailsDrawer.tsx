import * as React from "react";
import { createPortal } from "react-dom";
import { getOverlayRoot } from "../../overlay";

type Placement = "right" | "center";
type Align = "center" | "top";

/** Hardens the Details drawer against reflow, clipping, and transform issues. */
export function DetailsDrawer({
  title,
  open = true,
  onClose,
  onBackdropClick,
  onEscapeKey,
  width = 720,
  placement = "right",
  align = "center",
  backdrop = true,
  hasPendingChanges = false,
  isEditing = false,
  children,
}: {
  title?: React.ReactNode;
  open?: boolean;
  onClose?: () => void;
  onBackdropClick?: () => void;
  onEscapeKey?: () => void;
  width?: number | string;
  placement?: Placement;
  align?: Align;
  backdrop?: boolean;
  hasPendingChanges?: boolean;
  isEditing?: boolean;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // Body scroll lock while open
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // ESC to close
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (onEscapeKey) onEscapeKey();
        else onClose?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, onEscapeKey]);

  if (!open || !mounted) return null;

  const host = (getOverlayRoot?.() as HTMLElement) || document.getElementById("bhq-overlay-root")!;
  const isRight = placement === "right";
  const isCenter = placement === "center";

  /* ─────────────────────────── Layout Hardening ─────────────────────────── */

  const basePanelStyle: React.CSSProperties = {
    position: "fixed",
    zIndex: 2147483600, // use token later: var(--z-drawer)
    pointerEvents: "auto",
    // IMPORTANT: Do NOT use transform, filter, perspective, contain, or willChange
    // These properties create a "containing block" which breaks showPicker() positioning
    // for native date inputs - the picker appears at 0,0 instead of near the input
    transform: "none",
    filter: "none",
    perspective: "none",
    contain: "none", // changed from "layout paint" - contain creates a containing block
    isolation: "auto", // changed from "isolate" - isolate can interfere with picker
    background: "hsl(var(--surface))",
  };

  // Edit mode border color (amber/orange)
  const editBorderColor = "#f59e0b";
  const normalBorderColor = "hsl(var(--border))";
  const borderColor = isEditing ? editBorderColor : normalBorderColor;

  const panelStyle: React.CSSProperties = isRight
    ? {
        ...basePanelStyle,
        top: 0,
        right: 0,
        bottom: 0,
        width,
        borderLeft: `${isEditing ? "3px" : "1px"} solid ${borderColor}`,
        overflow: "hidden", // lock shell
        display: "flex",
        flexDirection: "column",
      }
    : {
        ...basePanelStyle,
        // Use inset + margin:auto instead of transform for centering
        // This avoids the showPicker() positioning bug in transformed containers
        maxWidth: typeof width === "number" ? `${width}px` : width,
        width: "min(96vw, 860px)",
        left: 0,
        right: 0,
        marginLeft: "auto",
        marginRight: "auto",
        ...(align === "center"
          ? { top: 0, bottom: 0, marginTop: "auto", marginBottom: "auto" }
          : { top: "6vh", bottom: "auto", marginTop: 0, marginBottom: 0 }),
        maxHeight: "88vh",
        border: `${isEditing ? "3px" : "1px"} solid ${borderColor}`,
        borderRadius: 12,
        boxShadow: isEditing
          ? `0 20px 48px rgba(0,0,0,.32), 0 0 0 1px ${editBorderColor}`
          : "0 20px 48px rgba(0,0,0,.32)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      };

  return createPortal(
    <div
      className="bhq-details-drawer"
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === "string" ? title : "Details"}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483599,
        pointerEvents: "auto",
        transform: "none",
        filter: "none",
        perspective: "none",
        contain: "none",
        isolation: "auto",
        overflow: "visible",
      }}
      onClick={() => {
        if (onBackdropClick) onBackdropClick();
      }}
    >
      {backdrop && (
        <div
          data-drawer-backdrop
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          style={{ zIndex: 2147483599 }}
        />
      )}

      {/* Panel */}
      <aside
        data-drawer-panel
        className="bg-surface"
        style={panelStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Inner scroller to avoid reflowing shell */}
        <div
          data-drawer-scroll
          className="flex-1 overflow-auto"
          style={{
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
          }}
        >
          {children}
        </div>
      </aside>
    </div>,
    host
  );
}
