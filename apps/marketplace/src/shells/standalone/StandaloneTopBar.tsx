// apps/marketplace/src/shells/standalone/StandaloneTopBar.tsx
import * as React from "react";
import { joinApi } from "../../shared/http/baseUrl";

interface Props {
  authenticated: boolean;
}

/**
 * Top bar for standalone marketplace shell.
 * Semi-transparent with subtle border, 56px height.
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
    <header className="sticky top-0 z-40 h-14 border-b border-white/10 bg-black/50 backdrop-blur-sm">
      <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Left: Marketplace label */}
        <span className="text-base font-semibold tracking-tight">
          Marketplace
        </span>

        {/* Right: Account status + reset badge */}
        <div className="flex items-center gap-3">
          {/* TEMPORARY: Reset badge - remove after visual confirmation */}
          <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold">
            UI RESET ACTIVE
          </span>
          {authenticated && (
            <>
              <span className="text-sm opacity-70">Signed in</span>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="px-3 py-1.5 text-sm rounded-lg bg-white/10 border border-white/10 hover:bg-white/15 transition-colors disabled:opacity-50"
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
