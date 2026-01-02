// apps/marketplace/src/gate/AccessNotAvailable.tsx
import * as React from "react";

/**
 * Shown when user is authenticated but not entitled to access marketplace.
 */
export function AccessNotAvailable() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-4xl text-secondary mb-4" aria-hidden="true">
        🔒
      </div>
      <h1 className="text-xl font-semibold text-primary mb-2">
        Marketplace Access Not Available
      </h1>
      <p className="text-secondary max-w-md">
        Your account does not currently have access to the Marketplace.
        Please contact support if you believe this is an error.
      </p>
    </div>
  );
}
