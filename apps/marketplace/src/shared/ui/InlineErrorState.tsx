// apps/marketplace/src/shared/ui/InlineErrorState.tsx
import * as React from "react";

interface Props {
  title?: string;
  message: string;
  onRetry?: () => void;
}

/**
 * Inline error state for sections that failed to load.
 * Shows error message with optional retry button.
 */
export function InlineErrorState({ title, message, onRetry }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <div
        className="text-3xl text-secondary mb-3"
        aria-hidden="true"
      >
        ⚠
      </div>
      {title && (
        <h3 className="text-base font-semibold text-primary mb-1">{title}</h3>
      )}
      <p className="text-sm text-secondary max-w-md mb-4">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 rounded-md bg-surface-2 border border-hairline text-primary text-sm font-medium hover:bg-surface-3 transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}
