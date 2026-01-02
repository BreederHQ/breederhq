// apps/marketplace/src/shells/standalone/StandaloneTopBar.tsx
import * as React from "react";
import { joinApi } from "../../shared/http/baseUrl";

interface Props {
  authenticated: boolean;
}

/**
 * Top bar for standalone marketplace shell.
 * Shows "Marketplace" label on left, account status on right.
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
      // Reload to trigger re-auth check
      window.location.reload();
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-surface/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        {/* Left: Marketplace label */}
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold text-primary tracking-tight">
            Marketplace
          </span>
        </div>

        {/* Right: Account status */}
        <div className="flex items-center gap-3">
          {authenticated && (
            <>
              <span className="text-sm text-secondary">Signed in</span>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="px-3 py-1.5 text-sm rounded-md bg-surface-2 border border-hairline text-primary hover:bg-surface-3 transition-colors disabled:opacity-50"
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
