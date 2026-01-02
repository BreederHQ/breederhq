// apps/portal/src/design/PortalEmptyState.tsx
// Reusable empty state component for portal pages
// Calm, centered, typography-driven - no loud card chrome

import * as React from "react";

interface PortalEmptyStateProps {
  /** Main heading text */
  title: string;
  /** Body text explaining the empty state */
  body: string;
  /** Optional action button (rarely used) */
  action?: React.ReactNode;
}

export function PortalEmptyState({ title, body, action }: PortalEmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        minHeight: "60vh",
        maxWidth: "480px",
        margin: "0 auto",
        padding: "var(--portal-space-4)",
      }}
    >
      <h1
        style={{
          fontSize: "var(--portal-font-size-xl)",
          fontWeight: "var(--portal-font-weight-semibold)",
          color: "var(--portal-text-primary)",
          margin: 0,
          marginBottom: "var(--portal-space-2)",
        }}
      >
        {title}
      </h1>
      <p
        style={{
          fontSize: "var(--portal-font-size-base)",
          color: "var(--portal-text-secondary)",
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        {body}
      </p>
      {action && (
        <div style={{ marginTop: "var(--portal-space-4)" }}>
          {action}
        </div>
      )}
    </div>
  );
}
