// apps/portal/src/pages/PortalTermsPage.tsx
// Terms of Service page for Client Portal
import * as React from "react";
import { TermsContent } from "@bhq/ui";
import logoUrl from "@bhq/ui/assets/logo.png";

export default function PortalTermsPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--portal-bg)",
        color: "var(--portal-text)",
        fontFamily: "var(--portal-font-family)",
      }}
    >
      {/* Simple header */}
      <header
        style={{
          borderBottom: "1px solid var(--portal-border-subtle)",
          background: "var(--portal-elevated)",
        }}
      >
        <div
          style={{
            maxWidth: "56rem",
            margin: "0 auto",
            padding: "1rem 1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <a
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <img
              src={logoUrl}
              alt="BreederHQ"
              style={{ width: "2.5rem", height: "2.5rem", objectFit: "contain" }}
            />
            <span style={{ fontSize: "1.125rem", fontWeight: 600 }}>BreederHQ Portal</span>
          </a>
          <a
            href="/"
            style={{
              fontSize: "var(--portal-font-size-sm)",
              color: "var(--portal-text-muted)",
              textDecoration: "none",
            }}
          >
            Back to Portal
          </a>
        </div>
      </header>

      {/* Terms content */}
      <main style={{ maxWidth: "56rem", margin: "0 auto", padding: "3rem 1.5rem" }}>
        <TermsContent style={{ color: "inherit" }} />
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--portal-border-subtle)",
          padding: "1.5rem",
        }}
      >
        <div
          style={{
            maxWidth: "56rem",
            margin: "0 auto",
            textAlign: "center",
            fontSize: "var(--portal-font-size-sm)",
            color: "var(--portal-text-muted)",
          }}
        >
          <p>&copy; {new Date().getFullYear()} BreederHQ LLC. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
