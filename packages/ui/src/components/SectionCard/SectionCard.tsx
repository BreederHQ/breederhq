import * as React from "react";

export type SectionCardProps = {
  title?: React.ReactNode;
  /** Subtitle displayed below the title (does not affect animated underline position) */
  subtitle?: React.ReactNode;
  /** Primary right-aligned header content */
  right?: React.ReactNode;
  /** Deprecated alias kept for compatibility with older callers */
  rightSlot?: React.ReactNode;
  /** Actions to display in header (alias for right) */
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  /** Show amber highlight border to indicate attention needed */
  highlight?: boolean;
  /** Show green highlight border to indicate success/locked state */
  highlightGreen?: boolean;
};

export function SectionCard({
  title,
  subtitle,
  right,
  rightSlot,
  actions,
  children,
  className = "",
  highlight = false,
  highlightGreen = false,
}: SectionCardProps) {
  const headerRight = right ?? rightSlot ?? actions;

  const baseClasses = "bhq-section-card rounded-xl bg-surface p-3 transition-all duration-200 ease-in-out";
  const borderClasses = highlightGreen
    ? "border-2 border-green-500/60 ring-2 ring-green-500/20"
    : highlight
      ? "border-2 border-amber-500/60 ring-2 ring-amber-500/20"
      : "border border-hairline";

  return (
    <div className={[baseClasses, borderClasses, className].join(" ")}>
      {(title || headerRight) && (
        <div className="bhq-section-header flex items-center justify-between mb-1">
          {/* Wrap title in div > span structure for animated underline from details.css */}
          <div className="bhq-section-title flex-1">
            <div><span>{title}</span></div>
            {subtitle && <div className="text-xs text-secondary font-normal mt-2">{subtitle}</div>}
          </div>
          {headerRight}
        </div>
      )}
      <div className="bhq-section-body">{children}</div>
    </div>
  );
}
