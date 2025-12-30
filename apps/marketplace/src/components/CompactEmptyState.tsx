// apps/marketplace/src/components/CompactEmptyState.tsx
import * as React from "react";

type CompactEmptyStateProps = {
  message: string;
};

/**
 * A minimal empty state for inline sections (registrations, titles, health tests).
 * Unlike the full EmptyState, this is compact and less prominent.
 */
export function CompactEmptyState({ message }: CompactEmptyStateProps) {
  return (
    <div className="py-3 text-center">
      <p className="text-sm text-secondary/70">{message}</p>
    </div>
  );
}
