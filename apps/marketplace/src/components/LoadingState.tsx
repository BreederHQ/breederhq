// apps/marketplace/src/components/LoadingState.tsx
import * as React from "react";
import { Spinner } from "@bhq/ui";

type LoadingStateProps = {
  /** Variant determines the skeleton layout to prevent layout shift */
  variant?: "default" | "program" | "detail";
};

export function LoadingState({ variant = "default" }: LoadingStateProps) {
  if (variant === "program") {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        {/* Header skeleton */}
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-20 h-20 rounded-xl bg-surface-strong/50" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-7 w-48 bg-surface-strong/50 rounded" />
            <div className="h-4 w-32 bg-surface-strong/30 rounded" />
          </div>
        </div>
        {/* Section skeletons */}
        <div className="rounded-xl border border-hairline bg-surface p-3 space-y-3">
          <div className="h-5 w-24 bg-surface-strong/50 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="h-24 bg-surface-strong/30 rounded-lg" />
            <div className="h-24 bg-surface-strong/30 rounded-lg" />
          </div>
        </div>
        <div className="rounded-xl border border-hairline bg-surface p-3 space-y-3">
          <div className="h-5 w-20 bg-surface-strong/50 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="h-24 bg-surface-strong/30 rounded-lg" />
            <div className="h-24 bg-surface-strong/30 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "detail") {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        {/* Back button skeleton */}
        <div className="h-8 w-32 bg-surface-strong/30 rounded" />
        {/* Header skeleton */}
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-20 h-20 rounded-xl bg-surface-strong/50" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-7 w-48 bg-surface-strong/50 rounded" />
            <div className="h-4 w-32 bg-surface-strong/30 rounded" />
          </div>
        </div>
        {/* Content skeleton */}
        <div className="rounded-xl border border-hairline bg-surface p-3 space-y-3">
          <div className="h-5 w-24 bg-surface-strong/50 rounded" />
          <div className="h-16 bg-surface-strong/30 rounded" />
        </div>
      </div>
    );
  }

  // Default: centered spinner
  return (
    <div className="p-6 flex items-center justify-center min-h-[300px]">
      <Spinner size={24} className="text-[hsl(var(--brand-orange))]" />
    </div>
  );
}
