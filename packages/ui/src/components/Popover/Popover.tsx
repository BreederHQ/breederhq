// packages/ui/src/components/Popover/Popover.ts
import * as React from "react";
import { createPortal } from "react-dom";
import { getOverlayRoot, useOverlayHost } from "../../overlay";

export type PopoverProps = {
  anchorRef: React.RefObject<HTMLElement>;
  open: boolean;
  onClose: () => void;
  estHeight?: number;         // layout hint; default 360
  width?: number | "auto";    // default 320
  children: React.ReactNode;
};

export function Popover({ anchorRef, open, onClose, estHeight = 360, width = 320, children }: PopoverProps) {
  const [pos, setPos] = React.useState<{ top: number; left: number; widthPx: number } | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  React.useLayoutEffect(() => {
    if (!open) return;
    const PAD = 12;
    const sync = () => {
      const a = anchorRef.current;
      if (!a) return;
      const r = a.getBoundingClientRect();
      const widthPx = typeof width === "number" ? Math.min(width, window.innerWidth - PAD * 2)
        : Math.min(320, window.innerWidth - PAD * 2);
      let top = r.bottom + 8;
      if (top + estHeight + PAD > window.innerHeight) top = Math.max(PAD, r.top - estHeight - 8);
      let left = r.right - widthPx;
      left = Math.max(PAD, Math.min(left, window.innerWidth - PAD - widthPx));
      setPos({ top, left, widthPx });
    };
    sync();
    window.addEventListener("resize", sync, { passive: true });
    window.addEventListener("scroll", sync, { passive: true });
    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync);
    };
  }, [open, anchorRef, estHeight, width]);

  useOverlayHost(open);
  if (!open || !pos) return null;

  return createPortal(
    <div
      style={{ position: "fixed", inset: 0, zIndex: 2147483646, pointerEvents: "auto" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="menu"
        tabIndex={-1}
        className="rounded-md border border-hairline bg-surface p-2 pr-3 shadow-[0_8px_30px_hsla(0,0%,0%,0.35)]"
        style={{
          position: "fixed",
          top: pos.top,
          left: pos.left,
          width: pos.widthPx,
          maxHeight: 360,
          overflow: "auto",
          pointerEvents: "auto",
          zIndex: 2147483647,
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    getOverlayRoot()
  );
}
