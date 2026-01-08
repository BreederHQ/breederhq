// apps/platform/src/components/dashboard/QuickActionsHub.tsx
// Grid of quick action buttons for common tasks

import * as React from "react";

type QuickAction = {
  key: string;
  label: string;
  icon: React.ReactNode;
  color: string;
};

type Props = {
  onAction: (action: string) => void;
};

// ─────────────────── Styles ───────────────────

function LocalStyles() {
  return (
    <style>{`
.bhq-action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}
.bhq-action-btn:hover .bhq-action-icon {
  transform: scale(1.15);
}
.bhq-action-btn:active {
  transform: translateY(0);
}
    `}</style>
  );
}

// ─────────────────── Icons ───────────────────

const Icons = {
  breeding: (
    <svg style={{ width: "24px", height: "24px" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 2a3 3 0 0 0-3 3v1a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 9a3 3 0 0 0-3 3 3 3 0 0 0 6 0 3 3 0 0 0-3-3Z" />
      <path d="M5 9a3 3 0 0 0-3 3 3 3 0 0 0 6 0 3 3 0 0 0-3-3Z" />
      <path d="M12 16c-4 0-6 3-6 5v1h12v-1c0-2-2-5-6-5Z" />
    </svg>
  ),
  animal: (
    <svg style={{ width: "24px", height: "24px" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 13c-3 0-4 2-4 3 0 .6.4 1 1 1h6c.6 0 1-.4 1-1 0-1-1-3-4-3Z" />
      <circle cx="7.5" cy="9" r="1.7" />
      <circle cx="16.5" cy="9" r="1.7" />
      <circle cx="10" cy="6.5" r="1.6" />
      <circle cx="14" cy="6.5" r="1.6" />
    </svg>
  ),
  health: (
    <svg style={{ width: "24px", height: "24px" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  contact: (
    <svg style={{ width: "24px", height: "24px" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  invoice: (
    <svg style={{ width: "24px", height: "24px" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  waitlist: (
    <svg style={{ width: "24px", height: "24px" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
};

const QUICK_ACTIONS: QuickAction[] = [
  { key: "new_plan", label: "New Breeding Plan", icon: Icons.breeding, color: "#ff6b35" },
  { key: "add_animal", label: "Add Animal", icon: Icons.animal, color: "#a855f7" },
  { key: "log_health", label: "Log Health Event", icon: Icons.health, color: "#22c55e" },
  { key: "add_contact", label: "Add Contact", icon: Icons.contact, color: "#3b82f6" },
  { key: "create_invoice", label: "Create Invoice", icon: Icons.invoice, color: "#eab308" },
  { key: "add_waitlist", label: "Add to Waitlist", icon: Icons.waitlist, color: "#06b6d4" },
];

// ─────────────────── Components ───────────────────

function ActionButton({
  action,
  onAction,
}: {
  action: QuickAction;
  onAction: (key: string) => void;
}) {
  const handleClick = () => {
    onAction(action.key);
  };

  return (
    <button
      onClick={handleClick}
      style={{ width: "100%", border: "none", background: "none", padding: 0, cursor: "pointer" }}
    >
      <div
        className="bhq-action-btn"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          padding: "16px 12px",
          borderRadius: "14px",
          border: `1px solid ${action.color}33`,
          background: `linear-gradient(135deg, ${action.color}15 0%, transparent 50%)`,
          transition: "all 0.2s ease",
        }}
      >
        <div
          className="bhq-action-icon"
          style={{
            color: action.color,
            transition: "transform 0.2s ease",
          }}
        >
          {action.icon}
        </div>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 500,
            color: "rgba(255, 255, 255, 0.8)",
            textAlign: "center",
            lineHeight: 1.3,
          }}
        >
          {action.label}
        </span>
      </div>
    </button>
  );
}

// ─────────────────── Main Component ───────────────────

export default function QuickActionsHub({ onAction }: Props) {
  return (
    <div>
      <LocalStyles />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
        <svg
          style={{ width: "18px", height: "18px", color: "#ff6b35" }}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
        </svg>
        <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#fff" }}>Quick Actions</span>
      </div>

      {/* Action grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "10px",
        }}
      >
        {QUICK_ACTIONS.map((action) => (
          <ActionButton key={action.key} action={action} onAction={onAction} />
        ))}
      </div>
    </div>
  );
}
