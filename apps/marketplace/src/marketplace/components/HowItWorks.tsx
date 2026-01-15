// apps/marketplace/src/marketplace/components/HowItWorks.tsx
// Three-step explainer for first-time marketplace visitors

import * as React from "react";

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MessageCircleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const STEPS = [
  {
    icon: SearchIcon,
    title: "Browse full programs",
    description: "Search by breed, location, or species. See complete breeding operations — animals, health records, pedigrees — not isolated listings.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Check their track record",
    description: "Review health testing results, breeding history, and buyer reviews before you reach out. Know who you're working with.",
  },
  {
    icon: MessageCircleIcon,
    title: "Message breeders directly",
    description: "Ask questions, request additional info, or schedule a visit. No middlemen, no waiting for callbacks.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-8">
      <h2 className="text-xl font-bold text-white text-center mb-8">How It Works</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.title} className="text-center">
              {/* Step number and icon */}
              <div className="relative inline-flex items-center justify-center mb-4">
                <div className="w-14 h-14 rounded-full bg-[hsl(var(--brand-blue))]/10 flex items-center justify-center">
                  <Icon className="w-7 h-7 text-[hsl(var(--brand-blue))]" />
                </div>
                <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[hsl(var(--brand-orange))] text-white text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </span>
              </div>
              {/* Content */}
              <h3 className="font-semibold text-white mb-2">{step.title}</h3>
              <p className="text-sm text-text-tertiary max-w-xs mx-auto">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default HowItWorks;
