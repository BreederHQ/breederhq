import * as React from "react";
import {
  PageHeader,
  SectionCard,
  Badge,
} from "@bhq/ui";

export default function AppMarketplace() {
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("bhq:module", {
          detail: { key: "marketplace", label: "Marketplace" },
        })
      );
    }
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Hero Section */}
      <div className="relative">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-[hsl(var(--brand-orange))]/20 to-[hsl(var(--brand-teal))]/20 border border-[hsl(var(--brand-orange))]/30 flex items-center justify-center text-3xl">
            🛒
          </div>

          {/* Title & Subtitle */}
          <div className="flex-1 min-w-0">
            <PageHeader
              title="Marketplace"
              subtitle="A trusted place to showcase programs, animals, and availability"
            />
          </div>

          {/* Status Badge */}
          <div className="flex-shrink-0">
            <Badge variant="amber" className="text-xs">Coming Soon</Badge>
          </div>
        </div>

        {/* Status Note */}
        <div className="mt-4 rounded-lg border border-dashed border-hairline bg-surface-strong/50 p-3">
          <div className="flex items-start gap-2 text-xs text-secondary">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <p>
              <strong className="font-semibold text-primary">Status:</strong> This module is a UI preview. No listings are saved yet.
            </p>
          </div>
        </div>
      </div>

      {/* What It Will Do - Split Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard
          title={
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>For Breeders</span>
            </div>
          }
          className="h-full"
        >
          <ul className="space-y-2 text-sm text-secondary">
            <li className="flex items-start gap-2">
              <span className="text-[hsl(var(--brand-orange))] mt-0.5">•</span>
              <span>Showcase your program with a public profile</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[hsl(var(--brand-orange))] mt-0.5">•</span>
              <span>List studs, females, and offspring with full lineage</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[hsl(var(--brand-orange))] mt-0.5">•</span>
              <span>Control visibility (breeder-only or public)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[hsl(var(--brand-orange))] mt-0.5">•</span>
              <span>Manage inquiries in one place</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[hsl(var(--brand-orange))] mt-0.5">•</span>
              <span>Optional service packages (training, transport)</span>
            </li>
          </ul>
        </SectionCard>

        <SectionCard
          title={
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <span>For Buyers</span>
            </div>
          }
          className="h-full"
        >
          <ul className="space-y-2 text-sm text-secondary">
            <li className="flex items-start gap-2">
              <span className="text-[hsl(var(--brand-teal))] mt-0.5">•</span>
              <span>Search verified breeding programs</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[hsl(var(--brand-teal))] mt-0.5">•</span>
              <span>View lineage, pedigree, and registry data</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[hsl(var(--brand-teal))] mt-0.5">•</span>
              <span>See health testing and disclosures</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[hsl(var(--brand-teal))] mt-0.5">•</span>
              <span>Browse photo galleries and titles</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[hsl(var(--brand-teal))] mt-0.5">•</span>
              <span>Connect directly with breeders</span>
            </li>
          </ul>
        </SectionCard>
      </div>

      {/* Feature Grid */}
      <SectionCard title="Planned Capabilities">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Listings and Visibility */}
          <FeatureCard
            icon="📋"
            title="Listings and Visibility"
            description="Create rich program profiles with full control over public visibility and breeder-only access."
          />

          {/* Animals and Offspring */}
          <FeatureCard
            icon="🐾"
            title="Animals and Offspring"
            description="List studs, females for breeding, and offspring for pet homes or breeding programs."
          />

          {/* Trust and Proof */}
          <FeatureCard
            icon="✓"
            title="Trust and Proof"
            description="Display lineage, pedigree, registry identifiers, and show placements with lifetime earnings."
          />

          {/* Media and Health */}
          <FeatureCard
            icon="📸"
            title="Media and Health"
            description="Rich photo galleries combined with health testing results and medical disclosures."
          />

          {/* Inquiry Workflow */}
          <FeatureCard
            icon="💬"
            title="Inquiry Workflow"
            description="Streamlined contact process for stud service, breeding rights, puppy purchase, and program placement."
          />

          {/* Services */}
          <FeatureCard
            icon="🎁"
            title="Optional Services"
            description="Offer stud service packages, training programs, and transport options directly in your listing."
          />
        </div>
      </SectionCard>

      {/* Roadmap */}
      <SectionCard
        title={
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
            <span>Development Roadmap</span>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <RoadmapPhase
            number="1"
            title="Profiles and Inquiries"
            description="Program profiles, contact workflows, and breeder-only visibility."
          />
          <RoadmapPhase
            number="2"
            title="Listings and Proof"
            description="Animal listings with pedigree, registry data, titles, and health testing."
          />
          <RoadmapPhase
            number="3"
            title="Marketplace Workflows"
            description="Advanced filters, messaging, intake forms, and service packages."
          />
        </div>
      </SectionCard>

      {/* Footer Callout */}
      <div className="rounded-xl border border-[hsl(var(--brand-orange))]/20 bg-gradient-to-br from-[hsl(var(--brand-orange))]/5 to-[hsl(var(--brand-teal))]/5 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[hsl(var(--brand-orange))]/20 flex items-center justify-center text-lg">
            💡
          </div>
          <div>
            <div className="font-semibold text-sm text-primary mb-1">Want this sooner?</div>
            <p className="text-xs text-secondary">
              Build order will follow breeder demand and the Offspring and Animals data model maturity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────── Supporting Components ───────────────── */

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="rounded-lg border border-hairline bg-surface p-3 hover:border-[hsl(var(--brand-orange))]/30 transition-colors">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-2xl">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-primary mb-1">{title}</div>
          <p className="text-xs text-secondary leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}

function RoadmapPhase({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="rounded-lg border border-hairline bg-surface-strong/50 p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[hsl(var(--brand-orange))] text-white flex items-center justify-center text-xs font-bold">
          {number}
        </div>
        <div className="font-semibold text-sm text-primary">{title}</div>
      </div>
      <p className="text-xs text-secondary leading-relaxed">{description}</p>
    </div>
  );
}
