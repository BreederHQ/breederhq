// apps/portal/src/design/SectionCard.tsx
import * as React from "react";

interface SectionCardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export function SectionCard({ children, title, className = "" }: SectionCardProps) {
  return (
    <div
      className={`portal-section-card ${className}`}
      style={{
        background: "var(--portal-bg-card)",
        border: "1px solid var(--portal-border)",
        borderRadius: "var(--portal-radius-md)",
        padding: "var(--portal-space-3)",
      }}
    >
      {title && (
        <h2
          style={{
            fontSize: "var(--portal-font-size-lg)",
            fontWeight: "var(--portal-font-weight-semibold)",
            margin: "0 0 var(--portal-space-3) 0",
            color: "var(--portal-text-primary)",
          }}
        >
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}
