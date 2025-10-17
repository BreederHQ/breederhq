// packages/ui/src/components/OverlayShell/Overlay.tsx
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { getOverlayRoot, useOverlayHost } from "../../overlay"; // adjust import to your paths

type OverlayProps = {
  open: boolean;
  onClose: () => void;
  /** Content width, e.g. 720 or "min(720px,calc(100vw-2rem))" */
  width?: number | string;
  /** Optional header/footer to slot around body */
  header?: React.ReactNode;
  footer?: React.ReactNode;
  /** Panel className for extra styling */
  panelClassName?: string;
  /** Body className (inside the panel) */
  bodyClassName?: string;
  /** If true, close when clicking the shaded backdrop (default true) */
  closeOnBackdrop?: boolean;
  children: React.ReactNode;
};

export function Overlay({
  open,
  onClose,
  width = "min(720px,calc(100vw-2rem))",
  header,
  footer,
  panelClassName = "",
  bodyClassName = "",
  closeOnBackdrop = true,
  children,
}: OverlayProps) {
  useOverlayInteractivity(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const Panel = (
    <div className="fixed inset-0 z-[9999] pointer-events-none flex items-start justify-center p-4">
      <div
        className={[
          "pointer-events-auto rounded-2xl border border-hairline bg-surface text-primary shadow-[0_24px_80px_rgba(0,0,0,0.45)] mt-10 w-full",
          panelClassName,
        ].join(" ")}
        style={{ maxWidth: typeof width === "number" ? `${width}px` : width }}
        role="dialog"
        aria-modal="true"
      >
        {header}
        <div className={["max-h-[70vh] overflow-y-auto pr-2", bodyClassName].join(" ")}>{children}</div>
        {footer}
      </div>
    </div>
  );

  return createPortal(
    <>
      {/* backdrop */}
      <div
        className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm"
        onClick={() => { if (closeOnBackdrop) onClose(); }}
      />
      {Panel}
    </>,
    getOverlayRoot()
  );
}
