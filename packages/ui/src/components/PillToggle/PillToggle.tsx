// packages/ui/src/components/PillToggle/PillToggle.tsx

import * as React from "react";

export type PillToggleProps = {
  on: boolean;
  label: string;
  onClick?: () => void;
  className?: string;
};

export function PillToggle({ on, label, onClick, className = "" }: PillToggleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "pill inline-flex items-center rounded-full px-3 h-7 text-[13px] leading-none select-none transition-colors",
        on
          ? "bg-[hsl(var(--brand-orange))] text-black hover:brightness-95"
          : "bg-surface border border-hairline text-primary hover:bg-[hsl(var(--brand-orange))]/12",
        className
      ].join(" ")}
    >
      {label}
    </button>
  );
}
