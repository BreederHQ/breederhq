// apps/marketplace/src/marketplace/components/BuyerValueProps.tsx
// "Not a classified ad. A breeding program." - Buyer value proposition section

import * as React from "react";
import { Link } from "react-router-dom";

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function MessageCircleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeartPulseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M3 12h4l3 9 4-18 3 9h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface ValueProp {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const VALUE_PROPS: ValueProp[] = [
  {
    title: "Full Program Visibility",
    description: "See their animals, breeding history, health testing, and past litters - not just one photo and a phone number.",
    icon: EyeIcon,
  },
  {
    title: "Direct Connection",
    description: "Message breeders directly. Ask questions, request more information, schedule a visit.",
    icon: MessageCircleIcon,
  },
  {
    title: "Verified Health Testing",
    description: "OFA, PennHIP, genetic screening - see actual test results, not just claims.",
    icon: HeartPulseIcon,
  },
  {
    title: "Established Programs",
    description: "Breeders actively managing their animals, tracking health records, and planning litters on our platform.",
    icon: BuildingIcon,
  },
];

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M14 5l7 7m0 0l-7 7m7-7H3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BuyerValueProps() {
  return (
    <section className="py-16 md:py-20 bg-gradient-to-br from-portal-card to-portal-card-hover" aria-labelledby="buyer-value-title">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section heading and description */}
        <div className="max-w-3xl mb-12">
          <h2 id="buyer-value-title" className="text-3xl md:text-4xl font-bold text-white mb-4">
            Not a classified ad. A breeding program.
          </h2>
          <p className="text-lg text-text-secondary leading-relaxed mb-6">
            BreederHQ breeders use our platform to manage their entire operation - animals, health records, pedigrees, litters. What you see is their real program, not a one-off listing.
          </p>
          <Link
            to="/breeders"
            className="inline-flex items-center gap-2 text-[hsl(var(--brand-orange))] font-medium hover:underline"
          >
            Browse breeders
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>

        {/* Value prop cards - 2x2 grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {VALUE_PROPS.map((prop) => {
            const Icon = prop.icon;
            return (
              <div
                key={prop.title}
                className="flex items-start gap-4 p-6 rounded-xl border border-border-subtle bg-portal-elevated hover:border-[hsl(var(--brand-orange))]/30 transition-colors"
              >
                {/* Icon */}
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[hsl(var(--brand-orange))]/10 flex items-center justify-center">
                  <Icon className="h-6 w-6 text-[hsl(var(--brand-orange))]" />
                </div>

                {/* Content */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">{prop.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{prop.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default BuyerValueProps;
