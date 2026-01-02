// apps/portal/src/design/Footer.tsx
import * as React from "react";
import { isPortalMockEnabled } from "../dev/mockFlag";

function DemoToggle() {
  const mockEnabled = isPortalMockEnabled();

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
    const url = new URL(window.location.href);
    url.searchParams.delete("mock");
    window.location.href = url.toString();
  };

  if (mockEnabled) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "var(--portal-space-1)" }}>
        <span style={{ color: "var(--portal-text-muted)", opacity: 0.6 }}>Demo mode</span>
        <button
          onClick={handleDisable}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            fontSize: "var(--portal-font-size-sm)",
            color: "var(--portal-accent)",
            cursor: "pointer",
            opacity: 0.8,
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
        padding: 0,
        fontSize: "var(--portal-font-size-sm)",
        color: "var(--portal-text-muted)",
        cursor: "pointer",
        opacity: 0.4,
      }}
    >
      Enable demo
    </button>
  );
}

export function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--portal-border-subtle)",
        padding: "var(--portal-space-3) var(--portal-space-2)",
        marginTop: "auto",
      }}
    >
      <div
        style={{
          maxWidth: "var(--portal-max-width)",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--portal-space-2)",
        }}
      >
        <p
          style={{
            fontSize: "var(--portal-font-size-sm)",
            color: "var(--portal-text-muted)",
            margin: 0,
            opacity: 0.4,
          }}
        >
          Powered by BreederHQ
        </p>
        <DemoToggle />
      </div>
    </footer>
  );
}
