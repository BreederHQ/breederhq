// apps/portal/src/design/HeaderBar.tsx
import * as React from "react";

interface HeaderBarProps {
  children: React.ReactNode;
}

export function HeaderBar({ children }: HeaderBarProps) {
  return (
    <header
      style={{
        height: "var(--portal-header-height)",
        borderBottom: "1px solid var(--portal-border)",
        background: "var(--portal-bg-elevated)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: "var(--portal-max-width)",
          margin: "0 auto",
          height: "100%",
          display: "flex",
          alignItems: "center",
          padding: "0 var(--portal-space-2)",
          gap: "var(--portal-space-4)",
        }}
      >
        {children}
      </div>
    </header>
  );
}
