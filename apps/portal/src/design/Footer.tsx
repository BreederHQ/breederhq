// apps/portal/src/design/Footer.tsx
import * as React from "react";

export function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--portal-border-subtle)",
        padding: "var(--portal-space-4) var(--portal-space-2)",
        marginTop: "auto",
      }}
    >
      <div
        style={{
          maxWidth: "var(--portal-max-width)",
          margin: "0 auto",
          textAlign: "center",
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
      </div>
    </footer>
  );
}
