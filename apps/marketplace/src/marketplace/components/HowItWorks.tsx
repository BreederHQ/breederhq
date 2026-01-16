// apps/marketplace/src/marketplace/components/HowItWorks.tsx
// 3-step explainer for buyers - How BreederHQ Works

import * as React from "react";

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
      <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 2L4 6v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-8-4z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

interface Step {
  number: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STEPS: Step[] = [
  {
    number: 1,
    title: "Browse Programs",
    description: "Search by breed, species, or location. See complete breeding programs, not just individual listings.",
    icon: SearchIcon,
  },
  {
    number: 2,
    title: "Verify Credentials",
    description: "Review health testing, breeding history, and program details before you reach out.",
    icon: ShieldCheckIcon,
  },
  {
    number: 3,
    title: "Connect Directly",
    description: "Message breeders and service providers. Ask questions, request info, schedule visits.",
    icon: MessageCircleIcon,
  },
];

export function HowItWorks() {
  return (
    <section className="py-16 md:py-20 bg-gray-100" aria-labelledby="how-it-works-title">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section heading */}
        <h2 id="how-it-works-title" className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">
          How BreederHQ Works
        </h2>

        {/* Three steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="text-center">
                {/* Icon */}
                <div className="w-16 h-16 rounded-xl bg-white border border-gray-300 flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <Icon className="w-8 h-8 text-gray-700" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
