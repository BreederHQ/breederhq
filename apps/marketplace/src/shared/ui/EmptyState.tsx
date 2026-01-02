// apps/marketplace/src/shared/ui/EmptyState.tsx
import * as React from "react";

interface Props {
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Empty state for lists/pages with no content.
 * Matches portal card spacing and typography.
 */
export function EmptyState({ title, body, actionLabel, onAction }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div
        className="text-4xl text-secondary mb-4"
        aria-hidden="true"
      >
        📭
      </div>
      <h2 className="text-lg font-semibold text-primary mb-2">{title}</h2>
      {body && (
        <p className="text-sm text-secondary max-w-md mb-4">{body}</p>
      )}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="px-4 py-2 rounded-md bg-brand-orange text-black font-medium hover:opacity-90 transition-opacity"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
