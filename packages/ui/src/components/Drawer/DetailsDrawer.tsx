import * as React from "react";
import { createPortal } from "react-dom";
import { getOverlayRoot } from "../../overlay";
import { useOverlayInteractivity } from "../../hooks";

export type DetailsDrawerProps = {
  title?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  width?: number | string;
  /** NEW: where to render the panel */
  placement?: "right" | "center";
  /** NEW: when placement = "center", control vertical alignment */
  align?: "center" | "top";
};

export function DetailsDrawer({
  title,
  onClose,
  children,
  width = 480,
  placement = "right",
  align = "center",
}: DetailsDrawerProps) {
  useOverlayInteractivity(true);
  const stopStarts = (e: React.SyntheticEvent) => e.stopPropagation();

  const host = getOverlayRoot() as HTMLElement;
  if (!host || typeof (host as any).appendChild !== "function") return null;

  // Backdrop shared by both variants
  const Backdrop = (
    <div
      aria-hidden
      onClick={onClose}
      className="fixed inset-0 bg-black/40"
      style={{ zIndex: 2147483646 }}
    />
  );

  if (placement === "center") {
    // Centered “drawer” (really a modal card), matching Contacts
    return createPortal(
      <>
        {Backdrop}
        <div
          className={
            align === "top"
              ? "fixed inset-0 flex items-start justify-center pt-10"
              : "fixed inset-0 grid place-items-center"
          }
          style={{ zIndex: 2147483647 }}
          onMouseDown={onClose} // click outside closes
        >
          <section
            role="dialog"
            aria-modal="true"
            onPointerDown={stopStarts}
            onMouseDown={stopStarts}
            onTouchStart={stopStarts}
            className="bg-surface border border-hairline shadow-2xl rounded-2xl overflow-hidden flex flex-col pointer-events-auto"
            style={{
              width: typeof width === "number" ? `${width}px` : width,
              maxWidth: "960px",
              maxHeight: "90vh",
            }}
          >
            {/* header area is rendered by DetailsScaffold or Host chrome */}
            <div className="min-h-0 flex-1 overflow-auto">{children}</div>
          </section>
        </div>
      </>,
      host
    );
  }

  // Right-side slide-over (existing behavior)
  return createPortal(
    <>
      {Backdrop}
      <aside
        role="dialog"
        aria-modal="true"
        onPointerDown={stopStarts}
        onMouseDown={stopStarts}
        onTouchStart={stopStarts}
        className="fixed top-0 right-0 h-full bg-surface shadow-2xl border-l border-hairline flex flex-col pointer-events-auto"
        style={{ width, zIndex: 2147483647 }}
      >
        {/* header area is rendered by DetailsScaffold or Host chrome */}
        <div className="min-h-0 flex-1 overflow-auto">{children}</div>
      </aside>
    </>,
    host
  );
}
