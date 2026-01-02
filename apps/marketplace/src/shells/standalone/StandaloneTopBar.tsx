// apps/marketplace/src/shells/standalone/StandaloneTopBar.tsx
import * as React from "react";
import { joinApi } from "../../shared/http/baseUrl";

interface Props {
  authenticated: boolean;
}

/**
 * Top bar for standalone marketplace shell.
 * Calm, minimal design with 56px height.
 */
export function StandaloneTopBar({ authenticated }: Props) {
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
    <header className="sticky top-0 z-40 h-14 border-b border-white/10 bg-black/20 backdrop-blur">
      <div className="h-full w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left: Marketplace label */}
        <span className="text-base font-semibold tracking-tight text-white">
          Marketplace
        </span>

        {/* Right: Reset badge + Account status */}
        <div className="flex items-center gap-3">
          {/* UI RESET ACTIVE stamp - stays until approval */}
          <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold">
            UI RESET ACTIVE
          </span>

          {authenticated && (
            <>
              <span className="text-sm text-white/70">Signed in</span>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="px-3 py-1.5 text-sm rounded-lg bg-white/10 border border-white/10 text-white hover:bg-white/15 transition-colors disabled:opacity-50"
              >
                {loggingOut ? "Logging out..." : "Logout"}
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
