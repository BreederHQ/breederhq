// apps/marketplace/src/layout/MarketplaceLayout.tsx
// Marketplace-appropriate layout: solid elevated header, no Portal gradient
import * as React from "react";
import { joinApi } from "../api/client";

interface Props {
  authenticated: boolean;
  children: React.ReactNode;
}

/**
 * Main marketplace layout.
 * Solid elevated header (no Portal gradient/blur), 64px height, max-width 1200px.
 */
export function MarketplaceLayout({ authenticated, children }: Props) {
  const [loggingOut, setLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
      await fetch(joinApi("/api/v1/auth/logout"), {
        method: "POST",
        credentials: "include",
        headers: {
          ...(xsrf ? { "x-csrf-token": decodeURIComponent(xsrf) } : {}),
        },
      });
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn("Logout request failed:", err);
      }
    } finally {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-portal-bg text-white relative font-sans antialiased">
      {/* Solid header - Marketplace-appropriate, no Portal gradient/blur */}
      <header className="sticky top-0 z-40 h-header border-b border-border-subtle bg-portal-elevated">
        <div className="h-full w-full max-w-portal mx-auto px-6 flex items-center justify-between">
          {/* Left: Marketplace brand */}
          <a href="/" className="text-base font-semibold tracking-tight text-white hover:text-white/90 transition-colors">
            BreederHQ Marketplace
          </a>

          {/* Right: Account actions */}
          {authenticated && (
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="px-3.5 py-2 text-sm font-medium rounded-portal-xs bg-border-default border border-border-subtle text-text-secondary hover:text-white hover:bg-portal-card-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              {loggingOut ? "..." : "Logout"}
            </button>
          )}
        </div>
      </header>

      {/* Content frame - max-width 1200px */}
      <main className="w-full max-w-portal mx-auto px-6 pt-8 pb-16">
        {children}
      </main>
    </div>
  );
}
