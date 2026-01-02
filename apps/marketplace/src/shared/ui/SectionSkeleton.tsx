// apps/marketplace/src/shared/ui/SectionSkeleton.tsx
import * as React from "react";

interface Props {
  /** Number of skeleton rows to render. Default: 6 */
  rows?: number;
}

/**
 * Neutral skeleton blocks for loading states.
 * Aligned to card/list rhythm. No spinners.
 */
export function SectionSkeleton({ rows = 6 }: Props) {
  return (
    <div className="space-y-3 py-4" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-16 rounded-lg bg-surface-2 animate-pulse"
          style={{
            // Vary widths slightly for visual rhythm
            width: i % 3 === 0 ? "100%" : i % 3 === 1 ? "95%" : "90%",
          }}
        />
      ))}
      <span className="sr-only">Loading content...</span>
    </div>
  );
}
