// packages/ui/src/components/Popover/Popover.tsx
import * as React from "react";
import { createPortal } from "react-dom";
import { getOverlayRoot, useOverlayHost } from "../../overlay";
import clsx from "clsx";

// ====================== LEGACY POPOVER (anchorRef-based) ======================

export type PopoverProps = {
  anchorRef: React.RefObject<HTMLElement>;
  open: boolean;
  onClose: () => void;
  estHeight?: number;         // layout hint; default 360
  width?: number | "auto";    // default 320
  children: React.ReactNode;
};

function PopoverLegacy({ anchorRef, open, onClose, estHeight = 360, width = 320, children }: PopoverProps) {
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
        className="rounded-md border border-hairline bg-surface p-2 shadow-[0_8px_30px_hsla(0,0%,0%,0.35)]"
        style={{
          position: "fixed",
          top: pos.top,
          left: pos.left,
          width: pos.widthPx,
          maxHeight: 360,
          overflowY: "auto",
          overflowX: "hidden",
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

// ====================== COMPOUND POPOVER (Radix-like API) ======================

type PopoverContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement>;
  contentId: string;
};

const PopoverContext = React.createContext<PopoverContextValue | null>(null);

function usePopoverContext() {
  const ctx = React.useContext(PopoverContext);
  if (!ctx) throw new Error("Popover compound components must be used within <Popover>");
  return ctx;
}

type CompoundPopoverProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
};

function PopoverRoot({ open: controlledOpen, onOpenChange, children }: CompoundPopoverProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = React.useCallback((next: boolean) => {
    setInternalOpen(next);
    onOpenChange?.(next);
  }, [onOpenChange]);

  const triggerRef = React.useRef<HTMLElement>(null);
  const contentId = React.useId();

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef, contentId }}>
      {children}
    </PopoverContext.Provider>
  );
}

type TriggerProps = {
  asChild?: boolean;
  children: React.ReactNode;
};

function PopoverTrigger({ asChild, children }: TriggerProps) {
  const { open, setOpen, triggerRef, contentId } = usePopoverContext();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(!open);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      ref: triggerRef,
      onClick: handleClick,
      "aria-expanded": open,
      "aria-haspopup": "menu",
      "aria-controls": open ? contentId : undefined,
    });
  }

  return (
    <button
      ref={triggerRef as React.RefObject<HTMLButtonElement>}
      type="button"
      onClick={handleClick}
      aria-expanded={open}
      aria-haspopup="menu"
      aria-controls={open ? contentId : undefined}
    >
      {children}
    </button>
  );
}

type ContentProps = {
  align?: "start" | "center" | "end";
  className?: string;
  children: React.ReactNode;
};

function PopoverContent({ align = "end", className, children }: ContentProps) {
  const { open, setOpen, triggerRef, contentId } = usePopoverContext();
  const [pos, setPos] = React.useState<{ top: number; left: number; width: number } | null>(null);

  const handleClose = React.useCallback(() => setOpen(false), [setOpen]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && handleClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, handleClose]);

  React.useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const PAD = 12;
    const WIDTH = 192; // default w-48 = 12rem = 192px

    const sync = () => {
      const a = triggerRef.current;
      if (!a) return;
      const r = a.getBoundingClientRect();
      let top = r.bottom + 4;
      let left: number;

      switch (align) {
        case "start":
          left = r.left;
          break;
        case "center":
          left = r.left + (r.width - WIDTH) / 2;
          break;
        case "end":
        default:
          left = r.right - WIDTH;
          break;
      }

      left = Math.max(PAD, Math.min(left, window.innerWidth - PAD - WIDTH));
      setPos({ top, left, width: WIDTH });
    };

    sync();
    window.addEventListener("resize", sync, { passive: true });
    window.addEventListener("scroll", sync, { passive: true });
    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync);
    };
  }, [open, triggerRef, align]);

  useOverlayHost(open);
  if (!open || !pos) return null;

  return createPortal(
    <div
      style={{ position: "fixed", inset: 0, zIndex: 2147483646, pointerEvents: "auto" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        id={contentId}
        role="menu"
        tabIndex={-1}
        className={clsx(
          "rounded-md border border-hairline bg-surface py-1 shadow-[0_8px_30px_hsla(0,0%,0%,0.35)]",
          className
        )}
        style={{
          position: "fixed",
          top: pos.top,
          left: pos.left,
          width: pos.width,
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

// ====================== UNIFIED EXPORT ======================

// Type guard to determine which API is being used
type UnifiedPopoverProps = PopoverProps | CompoundPopoverProps;

function isLegacyProps(props: UnifiedPopoverProps): props is PopoverProps {
  return "anchorRef" in props;
}

export function Popover(props: UnifiedPopoverProps) {
  if (isLegacyProps(props)) {
    return <PopoverLegacy {...props} />;
  }
  return <PopoverRoot {...props} />;
}

// Attach compound components
Popover.Trigger = PopoverTrigger;
Popover.Content = PopoverContent;
