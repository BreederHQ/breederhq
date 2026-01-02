// apps/portal/src/design/InlineNotice.tsx
import * as React from "react";

type NoticeType = "success" | "warning" | "error" | "info";

interface InlineNoticeProps {
  type?: NoticeType;
  children: React.ReactNode;
}

const typeStyles: Record<NoticeType, { border: string; bg: string }> = {
  success: { border: "var(--portal-success)", bg: "color-mix(in srgb, var(--portal-success) 10%, transparent)" },
  warning: { border: "var(--portal-warning)", bg: "color-mix(in srgb, var(--portal-warning) 10%, transparent)" },
  error: { border: "var(--portal-error)", bg: "color-mix(in srgb, var(--portal-error) 10%, transparent)" },
  info: { border: "var(--portal-info)", bg: "color-mix(in srgb, var(--portal-info) 10%, transparent)" },
};

export function InlineNotice({ type = "info", children }: InlineNoticeProps) {
  const styles = typeStyles[type];

  return (
    <div
      style={{
        padding: "var(--portal-space-2)",
        borderLeft: `3px solid ${styles.border}`,
        background: styles.bg,
        borderRadius: "var(--portal-radius-sm)",
        fontSize: "var(--portal-font-size-sm)",
        color: "var(--portal-text-primary)",
      }}
    >
      {children}
    </div>
  );
}
