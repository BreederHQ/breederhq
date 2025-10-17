import * as React from "react";

type Opts = { padding?: number; estHeight?: number; width?: number | "auto" };

export function usePopoverPosition(
  anchorRef: React.RefObject<HTMLElement>,
  open: boolean,
  opts: Opts = {}
) {
  const { padding = 12, estHeight = 360, width = 320 } = opts;
  const [pos, setPos] = React.useState<{ top: number; left: number; widthPx: number } | null>(null);

  React.useLayoutEffect(() => {
    if (!open) return;
    const sync = () => {
      const a = anchorRef.current;
      if (!a) return;
      const r = a.getBoundingClientRect();
      const widthPx = typeof width === "number" ? Math.min(width, window.innerWidth - padding * 2)
                                                : Math.min(320, window.innerWidth - padding * 2);

      let top = r.bottom + 8;
      if (top + estHeight + padding > window.innerHeight) top = Math.max(padding, r.top - estHeight - 8);

      let left = r.right - widthPx;
      left = Math.max(padding, Math.min(left, window.innerWidth - padding - widthPx));

      setPos({ top, left, widthPx });
    };
    sync();
    window.addEventListener("resize", sync, { passive: true });
    window.addEventListener("scroll", sync, { passive: true });
    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync);
    };
  }, [open, anchorRef, padding, estHeight, width]);

  return pos;
}
