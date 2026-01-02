// apps/portal/src/dev/DemoModeToggle.tsx
import * as React from "react";
import { isPortalMockEnabled } from "./mockFlag";

export function DemoModeToggle() {
  const [mockEnabled, setMockEnabled] = React.useState(isPortalMockEnabled());

  const handleEnable = () => {
    try {
      localStorage.setItem("portal_mock", "1");
    } catch {
      // Ignore localStorage errors
    }
    window.location.reload();
  };

  const handleDisable = () => {
    try {
      localStorage.removeItem("portal_mock");
    } catch {
      // Ignore localStorage errors
    }
    // Remove mock=1 from URL if present
    const url = new URL(window.location.href);
    url.searchParams.delete("mock");
    window.location.href = url.toString();
  };

  if (mockEnabled) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--portal-space-2)",
          padding: "4px 8px",
          background: "var(--portal-bg-elevated)",
          border: "1px solid var(--portal-border-subtle)",
          borderRadius: "var(--portal-radius-md)",
          fontSize: "var(--portal-font-size-xs)",
          flexShrink: 0,
        }}
      >
        <span style={{ color: "var(--portal-text-tertiary)" }}>Demo data</span>
        <button
          onClick={handleDisable}
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

  return (
    <button
      onClick={handleEnable}
      style={{
        background: "none",
        border: "none",
        padding: "4px 8px",
        fontSize: "var(--portal-font-size-xs)",
        color: "var(--portal-text-tertiary)",
        cursor: "pointer",
        textDecoration: "none",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "var(--portal-text-secondary)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "var(--portal-text-tertiary)";
      }}
    >
      Enable demo
    </button>
  );
}
