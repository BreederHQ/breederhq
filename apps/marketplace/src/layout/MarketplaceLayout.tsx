// apps/marketplace/src/layout/MarketplaceLayout.tsx
import * as React from "react";
import { joinApi } from "../api/client";

interface Props {
  authenticated: boolean;
  children: React.ReactNode;
}

/**
 * Main marketplace layout with top bar and content area.
 * Premium dark gradient background with subtle radial highlight.
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
    <div className="min-h-screen text-white relative font-sans antialiased">
      {/* Background with gradient and radial highlight */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(120, 80, 200, 0.15), transparent),
            linear-gradient(to bottom, #0a0a0f, #111118, #0d0d12)
          `,
        }}
      />

      {/* Top bar */}
      <header className="sticky top-0 z-40 h-14 border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="h-full w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Left: Marketplace brand */}
          <a href="/" className="text-lg font-semibold tracking-tight text-white hover:text-white/90 transition-colors">
            Marketplace
          </a>

          {/* Right: Account status */}
          <div className="flex items-center gap-4">
            {/* Subtle version indicator */}
            <span className="hidden sm:inline-block text-[10px] text-white/30 font-mono uppercase tracking-wider">
              v3
            </span>

            {authenticated && (
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline text-sm text-white/50">Signed in</span>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="px-3 py-1.5 text-sm rounded-lg bg-white/10 border border-white/10 text-white/80 hover:text-white hover:bg-white/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50"
                >
                  {loggingOut ? "..." : "Logout"}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
