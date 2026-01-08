// apps/platform/src/components/dashboard/AlertBanner.tsx
// Critical action items banner - color-coded by severity

import * as React from "react";
import type { AlertItem, AlertSeverity } from "../../features/useDashboardDataV2";

type Props = {
  alerts: AlertItem[];
  onDismiss: (id: string) => void;
  onAction?: (alert: AlertItem) => void;
};

const SEVERITY_STYLES: Record<AlertSeverity, { bg: string; border: string; icon: string; badge: string }> = {
  critical: {
    bg: "bg-[rgba(239,68,68,0.12)]",
    border: "border-[rgba(239,68,68,0.4)]",
    icon: "text-[#ef4444]",
    badge: "bg-[#dc2626]",
  },
  warning: {
    bg: "bg-[rgba(245,158,11,0.12)]",
    border: "border-[rgba(245,158,11,0.4)]",
    icon: "text-[#f59e0b]",
    badge: "bg-[#d97706]",
  },
  info: {
    bg: "bg-[rgba(59,130,246,0.12)]",
    border: "border-[rgba(59,130,246,0.4)]",
    icon: "text-[#3b82f6]",
    badge: "bg-[#2563eb]",
  },
};

function AlertIcon({ severity }: { severity: AlertSeverity }) {
  if (severity === "critical") {
    return (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    );
  }
  if (severity === "warning") {
    return (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function DismissIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`w-4 h-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function AlertCard({
  alert,
  onDismiss,
  onAction,
}: {
  alert: AlertItem;
  onDismiss: (id: string) => void;
  onAction?: (alert: AlertItem) => void;
}) {
  const styles = SEVERITY_STYLES[alert.severity];

  return (
    <div
      className={`
        ${styles.bg} ${styles.border}
        border rounded-lg p-3
        flex items-start gap-3
        transition-all duration-200
        hover:brightness-110
      `}
    >
      <div className={`${styles.icon} flex-shrink-0 mt-0.5`}>
        <AlertIcon severity={alert.severity} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-medium text-white text-sm">{alert.title}</div>
        {alert.message && (
          <div className="text-[rgba(255,255,255,0.7)] text-xs mt-0.5">{alert.message}</div>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {alert.actionHref && (
          <a
            href={alert.actionHref}
            onClick={(e) => {
              if (onAction) {
                e.preventDefault();
                onAction(alert);
              }
            }}
            className={`
              ${styles.badge}
              text-white text-xs font-medium
              px-2.5 py-1 rounded
              hover:brightness-110 transition-all
            `}
          >
            {alert.actionLabel || "View"}
          </a>
        )}

        {alert.dismissible && (
          <button
            onClick={() => onDismiss(alert.id)}
            className="p-1 rounded hover:bg-white/10 text-[rgba(255,255,255,0.5)] hover:text-white transition-colors"
            aria-label="Dismiss alert"
          >
            <DismissIcon />
          </button>
        )}
      </div>
    </div>
  );
}

export default function AlertBanner({ alerts, onDismiss, onAction }: Props) {
  const [expanded, setExpanded] = React.useState(true);

  // No alerts - don't render
  if (alerts.length === 0) return null;

  // Count by severity
  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const warningCount = alerts.filter((a) => a.severity === "warning").length;
  const infoCount = alerts.filter((a) => a.severity === "info").length;

  // Collapsed view - show badge with counts
  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="
          w-full rounded-xl border
          border-[rgba(60,60,60,0.5)]
          bg-[#1a1a1a]
          p-3
          flex items-center justify-between
          hover:bg-[#222222]
          hover:border-[rgba(255,107,53,0.3)]
          transition-all
        "
      >
        <div className="flex items-center gap-3">
          <div className="text-[#ff6b35]">
            <AlertIcon severity="warning" />
          </div>
          <span className="text-white text-sm font-medium">
            {alerts.length} alert{alerts.length !== 1 ? "s" : ""} require attention
          </span>
        </div>

        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <span className={`${SEVERITY_STYLES.critical.badge} text-white text-xs px-2 py-0.5 rounded-full`}>
              {criticalCount}
            </span>
          )}
          {warningCount > 0 && (
            <span className={`${SEVERITY_STYLES.warning.badge} text-white text-xs px-2 py-0.5 rounded-full`}>
              {warningCount}
            </span>
          )}
          {infoCount > 0 && (
            <span className={`${SEVERITY_STYLES.info.badge} text-white text-xs px-2 py-0.5 rounded-full`}>
              {infoCount}
            </span>
          )}
          <ChevronIcon expanded={false} />
        </div>
      </button>
    );
  }

  // Expanded view - show all alerts
  return (
    <div
      className="
        rounded-xl border
        border-[rgba(60,60,60,0.5)]
        bg-[#1a1a1a]
        overflow-hidden
      "
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(false)}
        className="
          w-full p-3
          flex items-center justify-between
          hover:bg-[#222222]
          transition-colors
          border-b border-[rgba(60,60,60,0.5)]
        "
      >
        <div className="flex items-center gap-2">
          <div className="text-[#ff6b35]">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <span className="text-white text-sm font-medium">Action Required</span>
          <span className="text-[rgba(255,255,255,0.5)] text-xs">
            ({alerts.length} alert{alerts.length !== 1 ? "s" : ""})
          </span>
        </div>
        <ChevronIcon expanded={true} />
      </button>

      {/* Alert list */}
      <div className="p-3 space-y-2">
        {alerts.map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onDismiss={onDismiss}
            onAction={onAction}
          />
        ))}
      </div>
    </div>
  );
}
