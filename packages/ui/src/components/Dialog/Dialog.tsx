import * as React from "react";
import { createPortal } from "react-dom";
import { getOverlayRoot } from "../../overlay";
import { Button } from "../Button/Button"; // or "../Button" if that's your pattern
import "../../styles/dialog.css";

export type DialogSize = "sm" | "md" | "lg" | "xl";

export interface DialogProps {
  open?: boolean;
  onClose?: () => void;
  title?: React.ReactNode;
  children?: React.ReactNode;
  size?: DialogSize;
  initialFocusRef?: React.RefObject<HTMLElement>;
  className?: string;
}

export function Dialog({
  open = false,
  onClose,
  title,
  children,
  size = "md",
  initialFocusRef,
  className = "",
}: DialogProps) {
  const contentRef = React.useRef<HTMLDivElement>(null);

  // close on ESC
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // autofocus
  React.useEffect(() => {
    if (!open) return;
    (initialFocusRef?.current ?? contentRef.current)?.focus?.();
  }, [open, initialFocusRef]);

  if (!open) return null;

  const node = (
    <>
      <div
        className="bhq-dialog__backdrop"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        className={["bhq-dialog", `bhq-dialog--${size}`, className].join(" ")}
        tabIndex={-1}
        ref={contentRef}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || onClose) && (
          <header className="bhq-dialog__header">
            <div className="bhq-dialog__title">{title}</div>
            {onClose && (
              <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
                ×
              </Button>
            )}
          </header>
        )}
        <div className="bhq-dialog__body">{children}</div>
      </div>
    </>
  );

  return createPortal(
    <div className="bhq-dialog__root" onClick={onClose}>{node}</div>,
    getOverlayRoot()
  );
}
