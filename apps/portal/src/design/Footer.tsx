// apps/portal/src/design/Footer.tsx
import * as React from "react";

export function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--portal-border-subtle)",
        padding: "var(--portal-space-3) var(--portal-space-4)",
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
          gap: "var(--portal-space-4)",
        }}
      >
        <p
          style={{
            fontSize: "var(--portal-font-size-sm)",
            color: "var(--portal-text-secondary)",
            margin: 0,
          }}
        >
          Powered by BreederHQ
        </p>
        <a
          href="/terms"
          style={{
            fontSize: "var(--portal-font-size-sm)",
            color: "var(--portal-text-secondary)",
            textDecoration: "none",
            transition: "color var(--portal-transition)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--portal-text-primary)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--portal-text-secondary)")}
        >
          Terms of Service
        </a>
      </div>
    </footer>
  );
}
