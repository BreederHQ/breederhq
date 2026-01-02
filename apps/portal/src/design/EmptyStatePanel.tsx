// apps/portal/src/design/EmptyStatePanel.tsx
import * as React from "react";

interface EmptyStatePanelProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyStatePanel({ title, description, action }: EmptyStatePanelProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--portal-space-2)",
        padding: "var(--portal-space-6)",
        textAlign: "center",
        border: "1px solid var(--portal-border)",
        borderRadius: "var(--portal-radius-md)",
        background: "var(--portal-bg-card)",
      }}
    >
      <h3
        style={{
          fontSize: "var(--portal-font-size-lg)",
          fontWeight: "var(--portal-font-weight-semibold)",
          color: "var(--portal-text-primary)",
          margin: 0,
        }}
      >
        {title}
      </h3>
      {description && (
        <p
          style={{
            fontSize: "var(--portal-font-size-base)",
            color: "var(--portal-text-secondary)",
            margin: 0,
          }}
        >
          {description}
        </p>
      )}
      {action && <div style={{ marginTop: "var(--portal-space-2)" }}>{action}</div>}
    </div>
  );
}
