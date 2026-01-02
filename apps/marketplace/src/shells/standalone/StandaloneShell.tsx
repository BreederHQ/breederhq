// apps/marketplace/src/shells/standalone/StandaloneShell.tsx
import * as React from "react";
import { StandaloneTopBar } from "./StandaloneTopBar";

interface Props {
  authenticated: boolean;
  children: React.ReactNode;
}

/**
 * Standalone shell layout for marketplace.
 * Includes top bar and centered content area matching Platform patterns.
 */
export function StandaloneShell({ authenticated, children }: Props) {
  return (
    <div className="min-h-screen bg-page text-primary">
      <StandaloneTopBar authenticated={authenticated} />
      <main className="mx-auto w-full max-w-5xl px-4 py-6">
        {children}
      </main>
    </div>
  );
}
