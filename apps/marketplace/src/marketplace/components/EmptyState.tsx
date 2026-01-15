// apps/marketplace/src/marketplace/components/EmptyState.tsx
// Reusable empty state component for marketplace sections

import * as React from "react";
import { Link } from "react-router-dom";

interface EmptyStateProps {
  variant: "listings" | "breeders" | "services";
  showCTA?: boolean;
}

function PawIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <ellipse cx="12" cy="16" rx="4" ry="3" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="7" cy="10" rx="2" ry="2.5" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="17" cy="10" rx="2" ry="2.5" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="10" cy="6" rx="1.5" ry="2" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="14" cy="6" rx="1.5" ry="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const EMPTY_STATE_CONTENT = {
  listings: {
    icon: PawIcon,
    title: "Be first to find your match",
    description: "New breeding programs are adding animals now. Browse verified breeders while listings grow, or set up alerts for specific breeds.",
    ctaText: "Browse Breeders",
    ctaHref: "/breeders",
    altCtaText: "List Your Animals",
    altCtaHref: "https://breederhq.com",
    altCtaExternal: true,
  },
  breeders: {
    icon: UsersIcon,
    title: "The first breeders are setting up",
    description: "Verified breeding programs are joining. Get notified when breeders in your area list, or join as one of the first.",
    ctaText: "Get Notified",
    ctaHref: "#notify", // TODO: Implement notification signup
    altCtaText: "Join as a Breeder",
    altCtaHref: "https://breederhq.com",
    altCtaExternal: true,
  },
  services: {
    icon: BriefcaseIcon,
    title: "Professional services coming soon",
    description: "Trainers, groomers, transporters, and more are joining. Offer your services to the breeding community?",
    ctaText: "Get Notified",
    ctaHref: "#notify", // TODO: Implement notification signup
    altCtaText: "List Your Services Free",
    altCtaHref: "/provider",
    altCtaExternal: false,
  },
};

export function EmptyState({ variant, showCTA = true }: EmptyStateProps) {
  const content = EMPTY_STATE_CONTENT[variant];
  const Icon = content.icon;

  return (
    <div className="text-center py-12 px-4">
      <div className="w-16 h-16 rounded-2xl bg-border-default/50 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-text-tertiary" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{content.title}</h3>
      <p className="text-sm text-text-tertiary max-w-md mx-auto mb-6">
        {content.description}
      </p>
      {showCTA && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to={content.ctaHref}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-[hsl(var(--brand-blue))] text-white text-sm font-medium hover:bg-[hsl(var(--brand-blue))]/90 transition-colors"
          >
            {content.ctaText}
          </Link>
          {content.altCtaExternal ? (
            <a
              href={content.altCtaHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-border-subtle text-text-secondary text-sm font-medium hover:text-white hover:border-border-default transition-colors"
            >
              {content.altCtaText}
            </a>
          ) : (
            <Link
              to={content.altCtaHref}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-border-subtle text-text-secondary text-sm font-medium hover:text-white hover:border-border-default transition-colors"
            >
              {content.altCtaText}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
