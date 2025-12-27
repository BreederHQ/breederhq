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
    <div className={["bhq-section-card rounded-xl border border-hairline bg-surface p-3", className].join(" ")}>
      {(title || headerRight) && (
        <div className="bhq-section-header flex items-center justify-between mb-2">
          {/* remove the forced all-caps, give a stable class for global styling */}
          <div className="bhq-section-title flex-1">{title}</div>
          {headerRight}
        </div>
      )}
      <div className="bhq-section-body">{children}</div>
    </div>
  );
}
