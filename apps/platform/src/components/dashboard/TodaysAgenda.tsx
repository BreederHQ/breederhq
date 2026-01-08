// apps/platform/src/components/dashboard/TodaysAgenda.tsx
// Today's task list - just the tasks, no greeting (handled by Dashboard hero)

import * as React from "react";
import type { AgendaItem, AgendaItemKind } from "../../features/useDashboardDataV2";

type Props = {
  userFirstName: string;
  items: AgendaItem[];
  onComplete: (id: string) => void;
  onReschedule?: (id: string, newDate: string) => void;
};

// ─────────────────── Styles ───────────────────

function LocalStyles() {
  return (
    <style>{`
@keyframes bhq-check {
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}
.bhq-check-appear { animation: bhq-check .3s ease-out both; }
.bhq-task-item:hover {
  background: rgba(255, 107, 53, 0.08) !important;
  border-color: rgba(255, 107, 53, 0.3) !important;
}
@media (prefers-reduced-motion: reduce) {
  .bhq-check-appear { animation: none; }
}
    `}</style>
  );
}

// ─────────────────── Helpers ───────────────────

const KIND_CONFIG: Record<AgendaItemKind, { label: string; bgColor: string; icon: React.ReactNode }> = {
  breeding_appt: {
    label: "Breeding",
    bgColor: "#ff6b35",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 2a3 3 0 0 0-3 3v1a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 9a3 3 0 0 0-3 3 3 3 0 0 0 6 0 3 3 0 0 0-3-3Z" />
        <path d="M5 9a3 3 0 0 0-3 3 3 3 0 0 0 6 0 3 3 0 0 0-3-3Z" />
        <path d="M12 16c-4 0-6 3-6 5v1h12v-1c0-2-2-5-6-5Z" />
      </svg>
    ),
  },
  health_check: {
    label: "Health",
    bgColor: "#22c55e",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  placement: {
    label: "Placement",
    bgColor: "#a855f7",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  contract: {
    label: "Contract",
    bgColor: "#3b82f6",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  reminder: {
    label: "Reminder",
    bgColor: "#eab308",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  vaccination: {
    label: "Vaccination",
    bgColor: "#06b6d4",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="m18 2 4 4" />
        <path d="m17 7 3-3" />
        <path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5" />
        <path d="m9 11 4 4" />
        <path d="m5 19-3 3" />
        <path d="m14 4 6 6" />
      </svg>
    ),
  },
  weigh_in: {
    label: "Weigh-in",
    bgColor: "#14b8a6",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
};

// ─────────────────── Components ───────────────────

function CheckIcon({ checked }: { checked: boolean }) {
  if (!checked) {
    return (
      <div
        style={{
          width: "22px",
          height: "22px",
          borderRadius: "50%",
          border: "2px solid rgba(60, 60, 60, 0.8)",
          transition: "all 0.2s ease",
        }}
      />
    );
  }
  return (
    <div
      className="bhq-check-appear"
      style={{
        width: "22px",
        height: "22px",
        borderRadius: "50%",
        backgroundColor: "#22c55e",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg style={{ width: "12px", height: "12px", color: "#fff" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
  );
}

function AgendaItemCard({
  item,
  onComplete,
}: {
  item: AgendaItem;
  onComplete: (id: string) => void;
}) {
  const [completing, setCompleting] = React.useState(false);
  const config = KIND_CONFIG[item.kind] || KIND_CONFIG.reminder;

  const handleComplete = () => {
    setCompleting(true);
    setTimeout(() => {
      onComplete(item.id);
    }, 300);
  };

  const severityBorderColor =
    item.severity === "critical"
      ? "#ef4444"
      : item.severity === "important"
        ? "#f59e0b"
        : "transparent";

  return (
    <div
      className="bhq-task-item"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "14px 16px",
        borderRadius: "12px",
        border: "1px solid rgba(60, 60, 60, 0.5)",
        borderLeftWidth: "3px",
        borderLeftColor: severityBorderColor,
        backgroundColor: "#1a1a1a",
        transition: "all 0.2s ease",
        opacity: completing ? 0.5 : 1,
        transform: completing ? "scale(0.98)" : "scale(1)",
      }}
    >
      <button
        onClick={handleComplete}
        disabled={completing}
        style={{
          flexShrink: 0,
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          outline: "none",
        }}
        aria-label={`Mark "${item.title}" as complete`}
      >
        <CheckIcon checked={completing || item.completed} />
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "0.9375rem",
            fontWeight: 500,
            color: completing ? "rgba(255, 255, 255, 0.5)" : "#fff",
            textDecoration: completing ? "line-through" : "none",
          }}
        >
          {item.title}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 10px",
          borderRadius: "999px",
          backgroundColor: config.bgColor,
          color: "#fff",
          fontSize: "11px",
          fontWeight: 600,
        }}
      >
        {config.icon}
        <span style={{ display: "none", "@media (min-width: 640px)": { display: "inline" } } as any}>
          {config.label}
        </span>
      </div>
    </div>
  );
}

function EmptyAgenda() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem 1rem",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, rgba(255, 107, 53, 0.2) 0%, rgba(34, 197, 94, 0.2) 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "1rem",
        }}
      >
        <svg style={{ width: "32px", height: "32px", color: "#22c55e" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>
      <div style={{ fontSize: "1.125rem", fontWeight: 600, color: "#fff", marginBottom: "0.25rem" }}>
        All clear for today!
      </div>
      <div style={{ fontSize: "0.875rem", color: "rgba(255, 255, 255, 0.5)" }}>
        No scheduled tasks — enjoy your day!
      </div>
    </div>
  );
}

// ─────────────────── Main Component ───────────────────

export default function TodaysAgenda({ userFirstName, items, onComplete }: Props) {
  // Separate completed and pending items
  const pendingItems = items.filter((i) => !i.completed);

  return (
    <div>
      <LocalStyles />

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <svg
            style={{ width: "18px", height: "18px", color: "#ff6b35" }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#fff" }}>
            Today's Tasks
          </span>
          {pendingItems.length > 0 && (
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: "999px",
                backgroundColor: "#ff6b35",
                color: "#fff",
              }}
            >
              {pendingItems.length}
            </span>
          )}
        </div>
      </div>

      {/* Agenda items */}
      {pendingItems.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {pendingItems.map((item) => (
            <AgendaItemCard key={item.id} item={item} onComplete={onComplete} />
          ))}
        </div>
      ) : (
        <EmptyAgenda />
      )}
    </div>
  );
}
