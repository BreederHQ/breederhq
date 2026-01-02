// apps/marketplace/src/shells/standalone/StandaloneShell.tsx
import * as React from "react";
import { StandaloneTopBar } from "./StandaloneTopBar";

interface Props {
  authenticated: boolean;
  children: React.ReactNode;
}

/**
 * Standalone shell layout for marketplace.
 * Dark gradient background with centered content column.
 */
export function StandaloneShell({ authenticated, children }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black text-white">
      <StandaloneTopBar authenticated={authenticated} />
      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-8">
        {children}
      </main>
      {/* Subtle footer stamp */}
      <footer className="fixed bottom-2 right-3 text-xs opacity-60">
        Marketplace beta
      </footer>
    </div>
  );
}
