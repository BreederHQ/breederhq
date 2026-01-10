// packages/ui/src/components/Select/Select.tsx
// Custom select component with dark theme dropdown

import * as React from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { getOverlayRoot, useOverlayHost } from "../../overlay";
import clsx from "clsx";

export type SelectOption = {
  value: string;
  label: string;
};

export type SelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export function Select({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className,
  disabled = false,
}: SelectProps) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [pos, setPos] = React.useState<{ top: number; left: number; width: number } | null>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Position the dropdown
  React.useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;

    const sync = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const PAD = 8;
      let top = rect.bottom + 4;

      // Check if dropdown would go off screen bottom
      const estHeight = Math.min(options.length * 36 + 8, 280);
      if (top + estHeight > window.innerHeight - PAD) {
        top = rect.top - estHeight - 4;
      }

      setPos({
        top,
        left: rect.left,
        width: rect.width,
      });
    };

    sync();
    window.addEventListener("resize", sync, { passive: true });
    window.addEventListener("scroll", sync, { passive: true });
    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync);
    };
  }, [open, options.length]);

  // Handle escape key
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useOverlayHost(open);

  const overlayRoot = getOverlayRoot();

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        className={clsx(
          "flex items-center justify-between gap-2 px-3 py-2 bg-white/5 border border-hairline rounded-md text-sm text-left transition-colors",
          "focus:outline-none focus:border-white/30",
          "hover:bg-white/10",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        <span className={selectedOption ? "text-primary" : "text-secondary"}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown className="h-4 w-4 text-secondary shrink-0" />
      </button>

      {open && pos && overlayRoot && createPortal(
        <div
          style={{ position: "fixed", inset: 0, zIndex: 2147483646 }}
          onClick={() => setOpen(false)}
        >
          <div
            role="listbox"
            className="rounded-md border border-hairline bg-surface py-1 shadow-[0_8px_30px_hsla(0,0%,0%,0.35)] overflow-y-auto"
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              width: pos.width,
              maxHeight: 280,
              zIndex: 2147483647,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={option.value === value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={clsx(
                  "w-full px-3 py-2 text-sm text-left transition-colors",
                  "hover:bg-white/10",
                  option.value === value
                    ? "bg-white/10 text-primary"
                    : "text-primary"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>,
        overlayRoot
      )}
    </>
  );
}
