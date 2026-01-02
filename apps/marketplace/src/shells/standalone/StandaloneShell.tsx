// apps/marketplace/src/shells/standalone/StandaloneShell.tsx
import * as React from "react";
import { StandaloneTopBar } from "./StandaloneTopBar";

interface Props {
  authenticated: boolean;
  children: React.ReactNode;
}

/**
 * Standalone shell layout for marketplace.
 * Premium dark gradient background with subtle radial highlight.
 */
export function StandaloneShell({ authenticated, children }: Props) {
  return (
    <div className="min-h-screen text-white relative">
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

      <StandaloneTopBar authenticated={authenticated} />

      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
