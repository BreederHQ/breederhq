// apps/marketplace/src/ui/components/ShellLayout.tsx
import * as React from "react";

interface ShellLayoutProps {
  children: React.ReactNode;
}

/**
 * Centered content wrapper with max width and padding.
 */
export function ShellLayout({ children }: ShellLayoutProps) {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {children}
    </div>
  );
}
