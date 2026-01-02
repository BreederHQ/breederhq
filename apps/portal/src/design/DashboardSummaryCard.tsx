// apps/portal/src/design/DashboardSummaryCard.tsx
import * as React from "react";

interface DashboardSummaryCardProps {
  title: string;
  primaryLine: string;
  actionLabel: string;
  href: string;
}

export function DashboardSummaryCard({
  title,
  primaryLine,
  actionLabel,
  href,
}: DashboardSummaryCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <a
      href={href}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: "block",
        padding: "var(--portal-space-4)",
        background: "var(--portal-bg-surface)",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "var(--portal-border)",
        borderRadius: "var(--portal-radius-lg)",
        textDecoration: "none",
        transition: "all var(--portal-transition)",
        borderLeftColor: isHovered ? "var(--portal-accent)" : "var(--portal-border)",
        borderLeftWidth: isHovered ? "3px" : "1px",
        paddingLeft: isHovered
          ? "calc(var(--portal-space-4) - 2px)"
          : "var(--portal-space-4)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--portal-space-2)",
        }}
      >
        <div
          style={{
            fontSize: "var(--portal-font-size-sm)",
            fontWeight: "var(--portal-font-weight-semibold)",
            color: "var(--portal-text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: "var(--portal-font-size-lg)",
            fontWeight: "var(--portal-font-weight-medium)",
            color: "var(--portal-text-primary)",
          }}
        >
          {primaryLine}
        </div>
        <div
          style={{
            fontSize: "var(--portal-font-size-sm)",
            color: isHovered ? "var(--portal-accent)" : "var(--portal-text-secondary)",
            transition: "color var(--portal-transition)",
          }}
        >
          {actionLabel} →
        </div>
      </div>
    </a>
  );
}
