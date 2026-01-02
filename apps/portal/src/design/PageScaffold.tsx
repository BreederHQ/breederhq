// apps/portal/src/design/PageScaffold.tsx
// Shared page scaffold for all portal pages
// Provides consistent layout, compact headers, and proper spacing
import * as React from "react";

/* ────────────────────────────────────────────────────────────────────────────
 * Page Header - Compact design (30-40% height reduction from old heroes)
 * ──────────────────────────────────────────────────────────────────────────── */

export type HeaderStatus = "success" | "warning" | "error" | "info" | "action" | "neutral";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  status?: HeaderStatus;
  statusLabel?: string;
  actions?: React.ReactNode;
}

const statusConfig: Record<HeaderStatus, { bg: string; color: string; dot: string }> = {
  success: {
    bg: "var(--portal-success-soft)",
    color: "var(--portal-success)",
    dot: "var(--portal-success)",
  },
  warning: {
    bg: "var(--portal-warning-soft)",
    color: "var(--portal-warning)",
    dot: "var(--portal-warning)",
  },
  error: {
    bg: "var(--portal-error-soft)",
    color: "var(--portal-error)",
    dot: "var(--portal-error)",
  },
  info: {
    bg: "var(--portal-info-soft)",
    color: "var(--portal-info)",
    dot: "var(--portal-info)",
  },
  action: {
    bg: "var(--portal-accent-muted)",
    color: "var(--portal-accent)",
    dot: "var(--portal-accent)",
  },
  neutral: {
    bg: "var(--portal-bg-elevated)",
    color: "var(--portal-text-secondary)",
    dot: "var(--portal-text-tertiary)",
  },
};

function StatusBadge({ status, label }: { status: HeaderStatus; label: string }) {
  const config = statusConfig[status] || statusConfig.neutral;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 10px",
        background: config.bg,
        borderRadius: "var(--portal-radius-full)",
      }}
    >
      <div
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: config.dot,
          boxShadow: status === "error" || status === "action" ? `0 0 6px ${config.dot}` : undefined,
        }}
      />
      <span
        style={{
          fontSize: "var(--portal-font-size-xs)",
          fontWeight: "var(--portal-font-weight-semibold)",
          color: config.color,
          textTransform: "uppercase",
          letterSpacing: "0.02em",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function PageHeader({ title, subtitle, status, statusLabel, actions }: PageHeaderProps) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "var(--portal-space-3)",
        paddingBottom: "var(--portal-space-3)",
        borderBottom: "1px solid var(--portal-border-subtle)",
        marginBottom: "var(--portal-space-3)",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Title row with optional status badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--portal-space-2)",
            flexWrap: "wrap",
            marginBottom: subtitle ? "4px" : 0,
          }}
        >
          <h1
            style={{
              fontSize: "var(--portal-font-size-xl)",
              fontWeight: "var(--portal-font-weight-bold)",
              color: "var(--portal-text-primary)",
              margin: 0,
              letterSpacing: "var(--portal-letter-spacing-tight)",
              lineHeight: "var(--portal-line-height-tight)",
            }}
          >
            {title}
          </h1>
          {status && statusLabel && <StatusBadge status={status} label={statusLabel} />}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <p
            style={{
              fontSize: "var(--portal-font-size-sm)",
              color: "var(--portal-text-secondary)",
              margin: 0,
              lineHeight: "var(--portal-line-height-normal)",
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Actions slot */}
      {actions && (
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "var(--portal-space-2)" }}>
          {actions}
        </div>
      )}
    </header>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Page Scaffold - Main container
 * ──────────────────────────────────────────────────────────────────────────── */

interface PageScaffoldProps {
  title: string;
  subtitle?: string;
  status?: HeaderStatus;
  statusLabel?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  narrow?: boolean;
}

export function PageScaffold({
  title,
  subtitle,
  status,
  statusLabel,
  actions,
  children,
  narrow = false,
}: PageScaffoldProps) {
  return (
    <div
      style={{
        maxWidth: narrow ? "var(--portal-max-width-narrow)" : "var(--portal-max-width)",
        margin: "0 auto",
        padding: "var(--portal-space-3) var(--portal-space-2)",
      }}
    >
      <PageHeader
        title={title}
        subtitle={subtitle}
        status={status}
        statusLabel={statusLabel}
        actions={actions}
      />
      <div>{children}</div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Section Header - For content sections within pages
 * ──────────────────────────────────────────────────────────────────────────── */

interface SectionHeaderProps {
  title: string;
  action?: React.ReactNode;
  variant?: "default" | "danger";
}

export function SectionHeader({ title, action, variant = "default" }: SectionHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "var(--portal-space-2)",
      }}
    >
      <h2
        style={{
          fontSize: "var(--portal-font-size-sm)",
          fontWeight: "var(--portal-font-weight-semibold)",
          textTransform: "uppercase",
          letterSpacing: "var(--portal-letter-spacing-wide)",
          color: variant === "danger" ? "var(--portal-error)" : "var(--portal-text-tertiary)",
          margin: 0,
        }}
      >
        {title}
      </h2>
      {action}
    </div>
  );
}

export default PageScaffold;
