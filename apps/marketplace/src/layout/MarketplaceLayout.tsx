// apps/marketplace/src/layout/MarketplaceLayout.tsx
// Marketplace-appropriate layout: solid elevated header, no Portal gradient
import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { joinApi } from "../api/client";
import { useDemoMode } from "../demo/demoMode";

interface Props {
  authenticated: boolean;
  children: React.ReactNode;
}

/**
 * Main marketplace layout.
 * Solid elevated header (no Portal gradient/blur), 64px height, max-width 1200px.
 */
export function MarketplaceLayout({ authenticated, children }: Props) {
  const location = useLocation();
  const [loggingOut, setLoggingOut] = React.useState(false);
  const { demoMode, enable: enableDemo, disable: disableDemo } = useDemoMode();

  // Check if current path matches a nav item
  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

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
          {/* Left: Marketplace brand + nav */}
          <div className="flex items-center gap-6">
            <Link to="/" className="text-base font-semibold tracking-tight text-white hover:text-white/90 transition-colors">
              BreederHQ Marketplace
            </Link>

            {/* Nav links */}
            <nav className="hidden sm:flex items-center gap-1">
              <Link
                to="/"
                className={`px-3 py-1.5 text-sm font-medium rounded-portal-xs transition-colors ${
                  isActive("/") && !isActive("/litters") && !isActive("/breeders")
                    ? "text-white bg-border-default"
                    : "text-text-secondary hover:text-white hover:bg-portal-card-hover"
                }`}
              >
                Home
              </Link>
              <Link
                to="/litters"
                className={`px-3 py-1.5 text-sm font-medium rounded-portal-xs transition-colors ${
                  isActive("/litters")
                    ? "text-white bg-border-default"
                    : "text-text-secondary hover:text-white hover:bg-portal-card-hover"
                }`}
              >
                Litters
              </Link>
              <Link
                to="/breeders"
                className={`px-3 py-1.5 text-sm font-medium rounded-portal-xs transition-colors ${
                  isActive("/breeders") || isActive("/programs")
                    ? "text-white bg-border-default"
                    : "text-text-secondary hover:text-white hover:bg-portal-card-hover"
                }`}
              >
                Breeders
              </Link>
              <span
                className="px-3 py-1.5 text-sm font-medium rounded-portal-xs text-text-muted cursor-not-allowed"
                title="Coming soon"
              >
                Services
              </span>
            </nav>
          </div>

          {/* Right: Demo mode controls + Account actions */}
          <div className="flex items-center gap-3">
            {/* Demo mode controls */}
            {demoMode ? (
              <>
                <span className="px-2 py-1 text-xs font-medium rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Demo mode
                </span>
                <button
                  type="button"
                  onClick={disableDemo}
                  className="text-sm text-text-tertiary hover:text-white transition-colors"
                >
                  Turn off
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={enableDemo}
                className="px-3 py-1.5 text-sm font-medium rounded-portal-xs bg-border-default border border-border-subtle text-text-secondary hover:text-white hover:bg-portal-card-hover transition-colors"
              >
                Preview with demo data
              </button>
            )}

            {/* Logout button */}
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
        </div>
      </header>

      {/* Content frame - max-width 1200px */}
      <main className="w-full max-w-portal mx-auto px-6 pt-8 pb-16">
        {children}
      </main>
    </div>
  );
}
