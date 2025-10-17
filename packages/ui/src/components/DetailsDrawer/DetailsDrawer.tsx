// packages/ui/src/components/DetailsDrawer/DetailsDrawer.ts
import * as React from "react";
import { createPortal } from "react-dom";
import { getOverlayRoot } from "../../overlay";
import { useOverlayInteractivity } from "../../hooks";

export function DetailsDrawer({
  title,
  onClose,
  children,
  width = 480,
}: {
  title?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  width?: number | string;
}) {
  const panelRef = React.useRef<HTMLElement | null>(null);

  // IMPORTANT: boolean signature — acquires overlay host while mounted
  useOverlayInteractivity(true);

  const stopStarts = (e: React.SyntheticEvent) => e.stopPropagation();

  return createPortal(
    <>
      {/* Backdrop must be clickable and intercept page clicks */}
      <div
        aria-hidden
        onClick={onClose}
        className="fixed inset-0 bg-black/40"
        style={{ zIndex: 2147483646 }}
      />
      {/* Panel above backdrop; ensure it's pointer-interactive */}
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        onPointerDown={stopStarts}
        onMouseDown={stopStarts}
        onTouchStart={stopStarts}
        className="fixed top-0 right-0 h-full bg-surface shadow-2xl border-l border-hairline flex flex-col pointer-events-auto"
        style={{ width, zIndex: 2147483647 }}
      >
        <header className="flex items-center gap-2 px-4 h-12 border-b border-hairline">
          <div className="truncate font-medium">{title || "Details"}</div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ml-auto inline-grid place-items-center h-8 w-8 rounded hover:bg-white/10"
          >
            ×
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-auto p-4">{children}</div>
      </aside>
    </>,
    getOverlayRoot()
  );
}
