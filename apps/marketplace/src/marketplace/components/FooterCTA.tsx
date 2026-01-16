// apps/marketplace/src/marketplace/components/FooterCTA.tsx
// Final conversion section with dual CTAs for breeders and service providers

import * as React from "react";
import { Link } from "react-router-dom";

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

export function FooterCTA() {
  return (
    <section className="py-16 md:py-20 bg-gray-100 border-t border-gray-200" aria-labelledby="footer-cta-title">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section heading */}
        <h2 id="footer-cta-title" className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">
          Ready to join BreederHQ Marketplace?
        </h2>

        {/* Two CTA cards - both use orange for primary actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Breeder card */}
          <div className="p-8 rounded-xl border border-gray-200 bg-white text-center shadow-sm">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">I'm a Breeder</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              List my breeding program and reach qualified buyers
            </p>
            <a
              href="https://breederhq.com/signup"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[hsl(var(--brand-orange))] text-white font-semibold hover:bg-[hsl(var(--brand-orange))]/90 transition-colors shadow-md"
            >
              Get Started
              <ArrowRightIcon className="h-4 w-4" />
            </a>
          </div>

          {/* Service provider card */}
          <div className="p-8 rounded-xl border border-gray-200 bg-white text-center shadow-sm">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">I Offer Services</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              List my professional services - free during early access
            </p>
            <Link
              to="/provider"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[hsl(var(--brand-orange))] text-white font-semibold hover:bg-[hsl(var(--brand-orange))]/90 transition-colors shadow-md"
            >
              List Services
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FooterCTA;
