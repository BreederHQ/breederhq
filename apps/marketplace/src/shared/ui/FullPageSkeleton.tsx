// apps/marketplace/src/shared/ui/FullPageSkeleton.tsx
import * as React from "react";

/**
 * Full-page loading skeleton shown while verifying access.
 * Matches Platform style with centered spinner/loading indicator.
 */
export function FullPageSkeleton() {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-page"
      style={{ minHeight: "100vh" }}
    >
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-8 h-8 border-2 border-hairline border-t-brand-orange rounded-full animate-spin"
          aria-label="Loading"
        />
        <span className="text-sm text-secondary">Verifying access...</span>
      </div>
    </div>
  );
}
