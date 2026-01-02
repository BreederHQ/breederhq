// apps/marketplace/src/auth/AuthPage.tsx
// Auth landing page for marketplace access.
import * as React from "react";

interface Props {
  /** The path the user was trying to access, computed by MarketplaceGate */
  returnToPath: string;
}

/**
 * Auth landing page shown when user is not authenticated.
 * Provides links to login/register with returnTo preserved.
 */
export function AuthPage({ returnToPath }: Props) {
  const encodedReturnTo = encodeURIComponent(returnToPath);

  const signInUrl = `/auth/login?returnTo=${encodedReturnTo}`;
  const createAccountUrl = `/auth/register?returnTo=${encodedReturnTo}`;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-sans antialiased bg-gradient-to-b from-gray-900 to-black">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-8">
          <h1 className="text-2xl font-semibold text-white mb-2">
            Sign in to Marketplace
          </h1>
          <p className="text-white/60 text-sm mb-8">
            Access breeder programs and listings
          </p>

          <div className="space-y-3">
            <a
              href={signInUrl}
              className="block w-full py-3 px-4 rounded-lg bg-orange-500 text-white font-medium text-center hover:bg-orange-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50"
            >
              Sign in
            </a>
            <a
              href={createAccountUrl}
              className="block w-full py-3 px-4 rounded-lg bg-white/10 border border-white/10 text-white font-medium text-center hover:bg-white/15 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            >
              Create account
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
