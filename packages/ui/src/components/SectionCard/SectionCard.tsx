import * as React from "react";

export type SectionCardProps = {
  title?: React.ReactNode;
  /** Primary right-aligned header content */
  right?: React.ReactNode;
  /** Deprecated alias kept for compatibility with older callers */
  rightSlot?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
};

export function SectionCard({
  title,
  right,
  rightSlot,
  children,
  className = "",
}: SectionCardProps) {
  const headerRight = right ?? rightSlot;

  return (
    <div className={["rounded-xl border border-hairline bg-surface p-3", className].join(" ")}>
      {(title || headerRight) && (
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs uppercase tracking-wide text-secondary">{title}</div>
          {headerRight}
        </div>
      )}
      {children}
    </div>
  );
}
