// apps/portal/src/design/Footer.tsx
import * as React from "react";

const linkStyle: React.CSSProperties = {
  fontSize: "var(--portal-font-size-sm)",
  color: "var(--portal-text-muted)",
  textDecoration: "none",
  opacity: 0.6,
};

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
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--portal-space-3)" }}>
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
          <nav style={{ display: "flex", alignItems: "center", gap: "var(--portal-space-2)" }}>
            <a href="/terms" style={linkStyle}>
              Terms of Service
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
