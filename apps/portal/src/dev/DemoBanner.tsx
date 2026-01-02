// apps/portal/src/dev/DemoBanner.tsx
// Small muted pill banner for demo data mode
// Shown at top of affected pages when demo mode is on

import * as React from "react";

export function DemoBanner() {
  const handleTurnOff = () => {
    // Remove mock=1 from URL if present
    const url = new URL(window.location.href);
    url.searchParams.delete("mock");

    // Clear localStorage
    try {
      localStorage.removeItem("portal_mock");
    } catch {
      // Ignore localStorage errors
    }

    // Navigate to clean URL and reload
    window.location.href = url.toString();
  };

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--portal-space-2)",
        padding: "var(--portal-space-1) var(--portal-space-2)",
        background: "var(--portal-bg-elevated)",
        border: "1px solid var(--portal-border-subtle)",
        borderRadius: "var(--portal-radius-md)",
        fontSize: "var(--portal-font-size-xs)",
        color: "var(--portal-text-tertiary)",
      }}
    >
      <span>Demo data</span>
      <button
        onClick={handleTurnOff}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          fontSize: "var(--portal-font-size-xs)",
          color: "var(--portal-accent)",
          cursor: "pointer",
          textDecoration: "none",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.textDecoration = "underline";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.textDecoration = "none";
        }}
      >
        Turn off
      </button>
    </div>
  );
}
