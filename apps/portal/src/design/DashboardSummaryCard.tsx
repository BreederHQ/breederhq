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
    <div
      style={{
        padding: "var(--portal-space-4) 0",
        borderBottom: "1px solid var(--portal-border-subtle)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: "var(--portal-space-3)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--portal-space-1)",
          }}
        >
          <div
            style={{
              fontSize: "var(--portal-font-size-sm)",
              fontWeight: "var(--portal-font-weight-medium)",
              color: "var(--portal-text-secondary)",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: "var(--portal-font-size-base)",
              fontWeight: "var(--portal-font-weight-normal)",
              color: "var(--portal-text-primary)",
            }}
          >
            {primaryLine}
          </div>
        </div>
        <a
          href={href}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            fontSize: "var(--portal-font-size-sm)",
            color: isHovered ? "var(--portal-accent)" : "var(--portal-text-secondary)",
            textDecoration: "none",
            whiteSpace: "nowrap",
            transition: "color var(--portal-transition)",
          }}
        >
          {actionLabel} →
        </a>
      </div>
    </div>
  );
}
