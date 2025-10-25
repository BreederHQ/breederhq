import * as React from "react";
import { createPortal } from "react-dom";
import { getOverlayRoot } from "@bhq/ui/overlay";

type Placement = "right" | "center";
type Align = "center" | "top";

export function DetailsDrawer({
  title,
  open = true,
  onClose,
  width = 720,
  placement = "right",
  align = "center",
  backdrop = true,
  children,
}: {
  title?: React.ReactNode;
  open?: boolean;
  onClose?: () => void;
  width?: number | string;
  placement?: Placement;
  align?: Align;
  backdrop?: boolean;
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
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const host = (getOverlayRoot?.() as HTMLElement) || document.getElementById("bhq-overlay-root")!;
  const isRight = placement === "right";
  const isCenter = placement === "center";

  // Panel base: fixed, no stacking-context creators, accepts pointer events.
  const basePanelStyle: React.CSSProperties = {
    position: "fixed",
    zIndex: 2147483600, // var(--z-drawer)
    pointerEvents: "auto",
    transform: "none",
    filter: "none",
    perspective: "none",
    contain: "none",
    isolation: "auto",
    overflow: "auto",
    background: "hsl(var(--surface))",
  };

  const panelStyle: React.CSSProperties = isRight
    ? {
        ...basePanelStyle,
        top: 0,
        right: 0,
        bottom: 0,
        width,
        borderLeft: "1px solid hsl(var(--border))",
      }
    : {
        ...basePanelStyle,
        maxWidth: typeof width === "number" ? `${width}px` : width,
        width: "min(96vw, 860px)",
        left: "50%",
        ...(align === "center"
          ? { top: "50%", transform: "translate(-50%, -50%)" }
          : { top: "6vh", transform: "translateX(-50%)" }),
        maxHeight: "88vh",
        border: "1px solid hsl(var(--border))",
        borderRadius: 12,
        boxShadow: "0 20px 48px rgba(0,0,0,.32)",
      };

  return createPortal(
    <div
      className="bhq-details-drawer"
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === "string" ? title : "Details"}
      // Wrapper: fixed full-viewport, allows clicks, no stacking-context creators.
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483599, // wrapper under the panel, above app
        pointerEvents: "auto",
        transform: "none",
        filter: "none",
        perspective: "none",
        contain: "none",
        isolation: "auto",
        overflow: "visible",
      }}
      onClick={() => onClose?.()}
    >
      {backdrop && (
        <div
          data-drawer-backdrop
          className="fixed inset-0 bg-black/40"
          style={{ zIndex: 2147483599 }}
        />
      )}
      <aside
        data-drawer-panel
        className="bg-surface"
        style={panelStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </aside>
    </div>,
    host
  );
}
