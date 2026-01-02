// apps/marketplace/src/shells/standalone/MarketplaceAuthPage.tsx
import * as React from "react";

/**
 * Placeholder auth page shown when user is not authenticated.
 * Provides buttons to navigate to login/register with returnTo preserved.
 */
export function MarketplaceAuthPage() {
  const returnTo = encodeURIComponent(
    window.location.pathname + window.location.search + window.location.hash
  );

  const handleSignIn = () => {
    window.location.href = `/auth/login?returnTo=${returnTo}`;
  };

  const handleCreateAccount = () => {
    window.location.href = `/auth/register?returnTo=${returnTo}`;
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-page px-4"
      style={{ minHeight: "100vh" }}
    >
      <div className="w-full max-w-md bg-surface border border-hairline rounded-xl p-6">
        <h1 className="text-xl font-semibold text-primary mb-2">
          Sign in to Marketplace
        </h1>
        <p className="text-sm text-secondary mb-6">
          Access breeder programs and listings
        </p>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleSignIn}
            className="w-full h-10 px-4 rounded-md bg-brand-orange text-black font-medium hover:opacity-90 transition-opacity"
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={handleCreateAccount}
            className="w-full h-10 px-4 rounded-md bg-surface-2 border border-hairline text-primary font-medium hover:bg-surface-3 transition-colors"
          >
            Create account
          </button>
        </div>
      </div>
    </div>
  );
}
