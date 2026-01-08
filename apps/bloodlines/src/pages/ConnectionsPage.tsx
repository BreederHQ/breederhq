// apps/bloodlines/src/pages/ConnectionsPage.tsx
import * as React from "react";
import { PageHeader, Button } from "@bhq/ui";

/* ───────────────── Coming Soon Page ───────────────── */

export default function ConnectionsPage() {
  return (
    <div className="p-6">
      <PageHeader
        title="Connections"
        subtitle="Match identities across breeders and manage info requests"
      />

      <div className="mt-8 max-w-2xl mx-auto">
        <div className="rounded-2xl border border-hairline bg-surface p-8 text-center">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[hsl(var(--brand-orange))]/20 to-[hsl(var(--brand-teal))]/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-[hsl(var(--brand-orange))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>

          <h2 className="text-2xl font-semibold text-primary mb-3">Coming Soon</h2>
          <p className="text-secondary max-w-md mx-auto">
            The Connections feature will allow you to discover and connect with other breeders who own animals
            related to yours through shared pedigrees.
          </p>

          {/* Planned Features */}
          <div className="mt-8 text-left space-y-4">
            <h3 className="text-sm font-semibold text-secondary uppercase tracking-wider">Planned Features</h3>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-strong">
                <div className="flex-shrink-0 w-8 h-8 rounded-md bg-[hsl(var(--brand-orange))]/10 flex items-center justify-center">
                  <span className="text-base">🔍</span>
                </div>
                <div>
                  <div className="font-medium text-sm text-primary">Identity Matching</div>
                  <p className="text-xs text-secondary mt-0.5">
                    Automatic matching of animals across breeders via microchip, registry numbers, and DNA profiles.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-strong">
                <div className="flex-shrink-0 w-8 h-8 rounded-md bg-[hsl(var(--brand-orange))]/10 flex items-center justify-center">
                  <span className="text-base">📬</span>
                </div>
                <div>
                  <div className="font-medium text-sm text-primary">Info Requests</div>
                  <p className="text-xs text-secondary mt-0.5">
                    Request pedigree information from other breeders who own ancestors or descendants of your animals.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-strong">
                <div className="flex-shrink-0 w-8 h-8 rounded-md bg-[hsl(var(--brand-orange))]/10 flex items-center justify-center">
                  <span className="text-base">🔒</span>
                </div>
                <div>
                  <div className="font-medium text-sm text-primary">Privacy Controls</div>
                  <p className="text-xs text-secondary mt-0.5">
                    Fine-grained control over what information you share with connected breeders.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-strong">
                <div className="flex-shrink-0 w-8 h-8 rounded-md bg-[hsl(var(--brand-orange))]/10 flex items-center justify-center">
                  <span className="text-base">🌐</span>
                </div>
                <div>
                  <div className="font-medium text-sm text-primary">Network Explorer</div>
                  <p className="text-xs text-secondary mt-0.5">
                    Browse pedigrees across the entire BreederHQ network, respecting privacy settings.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Back button */}
          <div className="mt-8">
            <Button
              variant="ghost"
              onClick={() => {
                window.history.pushState(null, "", "/bloodlines");
                window.dispatchEvent(new PopStateEvent("popstate"));
              }}
            >
              Back to Bloodlines
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
