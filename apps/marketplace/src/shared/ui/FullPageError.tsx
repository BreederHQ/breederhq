// apps/marketplace/src/shared/ui/FullPageError.tsx
import * as React from "react";

interface Props {
  onRetry: () => void;
  message?: string;
}

/**
 * Full-page error state with retry button.
 * Shows friendly message without raw error details.
 */
export function FullPageError({ onRetry, message }: Props) {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-page"
      style={{ minHeight: "100vh" }}
    >
      <div className="flex flex-col items-center gap-4 text-center px-4">
        <div className="text-4xl text-secondary" aria-hidden="true">
          ⚠
        </div>
        <p className="text-primary text-base">
          {message ?? "Unable to verify access. Try again."}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 rounded-md bg-brand-orange text-black font-medium hover:opacity-90 transition-opacity"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
