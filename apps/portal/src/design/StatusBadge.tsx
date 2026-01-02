// apps/portal/src/design/StatusBadge.tsx
import * as React from "react";

type StatusType = "success" | "warning" | "error" | "info" | "neutral";

interface StatusBadgeProps {
  type?: StatusType;
  children: React.ReactNode;
}

const typeColors: Record<StatusType, { bg: string; text: string }> = {
  success: { bg: "var(--portal-success)", text: "var(--portal-bg)" },
  warning: { bg: "var(--portal-warning)", text: "var(--portal-bg)" },
  error: { bg: "var(--portal-error)", text: "var(--portal-text-primary)" },
  info: { bg: "var(--portal-info)", text: "var(--portal-text-primary)" },
  neutral: { bg: "var(--portal-border)", text: "var(--portal-text-secondary)" },
};

export function StatusBadge({ type = "neutral", children }: StatusBadgeProps) {
  const colors = typeColors[type];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontSize: "var(--portal-font-size-sm)",
        fontWeight: "var(--portal-font-weight-medium)",
        padding: "calc(var(--portal-space-1) / 2) var(--portal-space-1)",
        borderRadius: "var(--portal-radius-sm)",
        background: colors.bg,
        color: colors.text,
      }}
    >
      {children}
    </span>
  );
}
