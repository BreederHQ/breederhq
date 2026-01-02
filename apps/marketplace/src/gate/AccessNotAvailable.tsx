// apps/marketplace/src/gate/AccessNotAvailable.tsx
import * as React from "react";
import { joinApi } from "../api/client";

/**
 * Shown when user is authenticated but not entitled to access marketplace.
 * Styled with Tailwind - centered card with title, body, and actions.
 */
export function AccessNotAvailable() {
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
    } catch {
      // Ignore logout errors
    } finally {
      window.location.assign("/auth/login");
    }
  };

  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-yellow-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h1 className="text-xl font-semibold text-white mb-3">
            Marketplace access not available
          </h1>
          <p className="text-white/60 text-sm mb-6">
            This account is signed in, but Marketplace access is not enabled.
            Please contact support if you believe this is an error.
          </p>

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full h-10 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50"
            >
              {loggingOut ? "Logging out..." : "Sign out"}
            </button>
            <a
              href="/auth/login"
              className="block text-sm text-white/50 hover:text-orange-400 transition-colors"
            >
              Back to sign in
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
