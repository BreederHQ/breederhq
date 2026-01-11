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
        "pill inline-flex items-center rounded-full px-2 py-px text-[11px] leading-none select-none transition-colors border",
        on
          ? "border-white/25 bg-white/10 text-primary hover:bg-white/15"
          : "border-hairline bg-surface text-secondary hover:text-primary hover:border-white/20",
        className
      ].join(" ")}
    >
      {label}
    </button>
  );
}
