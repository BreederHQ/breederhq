// apps/marketplace/src/components/MarketplacePreviewState.tsx
import * as React from "react";
import { PageHeader } from "@bhq/ui";

export function MarketplacePreviewState() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-[hsl(var(--brand-orange))]/20 to-[hsl(var(--brand-teal))]/20 border border-[hsl(var(--brand-orange))]/30 flex items-center justify-center text-2xl">
          🛒
        </div>
        <div className="flex-1 min-w-0">
          <PageHeader
            title="Marketplace Preview"
            subtitle="A trusted place to showcase programs, animals, and availability"
          />
        </div>
      </div>

      {/* Preview notice */}
      <div className="rounded-xl border border-dashed border-hairline bg-surface p-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-surface-strong/50 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-secondary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-primary mb-1">
              Program browsing is not available yet
            </h3>
            <p className="text-sm text-secondary max-w-md">
              This feature is being rolled out incrementally. Check back soon for the ability to browse and search breeding programs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
