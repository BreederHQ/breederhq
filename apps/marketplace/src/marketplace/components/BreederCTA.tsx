// apps/marketplace/src/marketplace/components/BreederCTA.tsx
// Breeder recruitment section - drives to breederhq.com subscription

import * as React from "react";

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

export function BreederCTA() {
  return (
    <section className="py-16 md:py-20 bg-gray-50" aria-labelledby="breeder-cta-title">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section header */}
        <div className="max-w-3xl mb-12">
          <h2 id="breeder-cta-title" className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Your breeding program deserves better than a classified ad.
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            BreederHQ breeders don't just list animals - they manage complete breeding programs. Health records, pedigrees, litter planning, buyer communication - all in one place. The marketplace shows buyers what makes you different.
          </p>
        </div>

        {/* Two column comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          {/* Left: What buyers see */}
          <div className="p-8 rounded-xl border border-gray-200 bg-white shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-6">What buyers see</h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start gap-3">
                <span className="text-[hsl(var(--brand-blue))] mt-1">•</span>
                <span>Your complete breeding program</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[hsl(var(--brand-blue))] mt-1">•</span>
                <span>All your animals with photos and details</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[hsl(var(--brand-blue))] mt-1">•</span>
                <span>Health test results and certifications</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[hsl(var(--brand-blue))] mt-1">•</span>
                <span>Pedigree information and lineage</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[hsl(var(--brand-blue))] mt-1">•</span>
                <span>Past litters and planned breedings</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[hsl(var(--brand-blue))] mt-1">•</span>
                <span>Reviews from previous buyers</span>
              </li>
            </ul>
          </div>

          {/* Right: What you get */}
          <div className="p-8 rounded-xl border border-[hsl(var(--brand-blue))]/30 bg-[hsl(var(--brand-blue))]/5">
            <h3 className="text-xl font-bold text-gray-900 mb-6">What you get</h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start gap-3">
                <span className="text-[hsl(var(--brand-blue))] mt-1">•</span>
                <span>Complete breeding management software</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[hsl(var(--brand-blue))] mt-1">•</span>
                <span>Health record tracking and reminders</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[hsl(var(--brand-blue))] mt-1">•</span>
                <span>Pedigree database and COI calculator</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[hsl(var(--brand-blue))] mt-1">•</span>
                <span>Litter management and puppy tracking</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[hsl(var(--brand-blue))] mt-1">•</span>
                <span>Buyer inquiries in one place</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[hsl(var(--brand-blue))] mt-1">•</span>
                <span>Marketplace exposure to qualified buyers</span>
              </li>
            </ul>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="text-center">
          <a
            href="https://breederhq.com/signup"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-[hsl(var(--brand-blue))] text-white font-semibold text-lg hover:bg-[hsl(var(--brand-blue))]/90 transition-colors shadow-md"
          >
            Start Your Free Trial
            <ArrowRightIcon className="h-5 w-5" />
          </a>
          <p className="text-sm text-gray-500 mt-3">
            Already a subscriber?{" "}
            <a
              href="https://breederhq.com/dashboard/marketplace"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[hsl(var(--brand-blue))] hover:underline"
            >
              Enable marketplace in your dashboard
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

export default BreederCTA;
