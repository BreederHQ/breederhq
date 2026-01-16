// apps/marketplace/src/marketplace/components/DualRecruitmentSection.tsx
// Side-by-side recruitment section for service providers AND breeders with equal weight

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

// Service category icons (matching ServiceProviderCTA.tsx)
function ScissorsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 9a3 3 0 100-6 3 3 0 000 6zM6 15a3 3 0 100 6 3 3 0 000-6z" stroke="currentColor" strokeWidth="2" />
      <path d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function TruckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M16 16V3H1v13h15zm0 0h6v-6l-3-3h-3v9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="5.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="18.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v11z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2" />
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

function GraduationCapIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M22 10l-10-5-10 5 10 5 10-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 10v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const SERVICE_CATEGORIES = [
  { icon: GraduationCapIcon, label: "Training" },
  { icon: ScissorsIcon, label: "Grooming" },
  { icon: TruckIcon, label: "Transport" },
  { icon: HomeIcon, label: "Boarding" },
  { icon: CameraIcon, label: "Photography" },
  { icon: HeartPulseIcon, label: "Veterinary" },
];

export function DualRecruitmentSection() {
  return (
    <section className="grid md:grid-cols-2 gap-6">
      {/* Service Provider Card - FIRST on mobile (order-first or HTML structure) */}
      <div
        className="order-first md:order-none flex flex-col rounded-2xl border border-[hsl(var(--brand-teal))]/30 bg-gradient-to-br from-[hsl(var(--brand-teal))]/5 to-transparent p-8"
        aria-labelledby="provider-recruitment-title"
      >
        <div className="flex-1">
          <h2 id="provider-recruitment-title" className="text-2xl font-bold text-white mb-4">
            OFFER YOUR SERVICES TO THE BREEDING COMMUNITY
          </h2>
          <p className="text-text-secondary mb-6 leading-relaxed">
            Trainers, groomers, transporters, photographers, vets - breeders and buyers need your expertise. List your services and connect with clients who understand the value of professional animal care.
          </p>

          {/* Service category pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            {SERVICE_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <span
                  key={cat.label}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-text-secondary"
                >
                  <Icon className="w-4 h-4" />
                  {cat.label}
                </span>
              );
            })}
            <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-text-tertiary">
              +10 more
            </span>
          </div>

          {/* Value props */}
          <ul className="space-y-2 mb-6">
            <li className="flex items-center gap-2 text-sm text-text-secondary">
              <span className="text-[hsl(var(--brand-teal))]">✓</span>
              No platform fees
            </li>
            <li className="flex items-center gap-2 text-sm text-text-secondary">
              <span className="text-[hsl(var(--brand-teal))]">✓</span>
              Direct client contact
            </li>
            <li className="flex items-center gap-2 text-sm text-text-secondary">
              <span className="text-[hsl(var(--brand-teal))]">✓</span>
              Build your reputation
            </li>
          </ul>
        </div>

        <div className="mt-6">
          <Link
            to="/provider"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[hsl(var(--brand-teal))] text-white font-medium hover:bg-[hsl(var(--brand-teal))]/90 transition-colors"
            style={{ minHeight: "48px" }}
          >
            List Your Services
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Breeder Card - SECOND on mobile */}
      <div
        className="flex flex-col rounded-2xl border border-[hsl(var(--brand-blue))]/30 bg-gradient-to-br from-[hsl(var(--brand-blue))]/5 to-transparent p-8"
        aria-labelledby="breeder-recruitment-title"
      >
        <div className="flex-1">
          <h2 id="breeder-recruitment-title" className="text-2xl font-bold text-white mb-4">
            ALREADY A BREEDERHQ BREEDER?
          </h2>
          <p className="text-text-secondary mb-6 leading-relaxed">
            Showcase your breeding program and animals to qualified buyers actively searching for what you offer.
          </p>

          {/* Value props */}
          <ul className="space-y-2 mb-6">
            <li className="flex items-center gap-2 text-sm text-text-secondary">
              <span className="text-[hsl(var(--brand-blue))]">✓</span>
              Connected to your existing BreederHQ account
            </li>
            <li className="flex items-center gap-2 text-sm text-text-secondary">
              <span className="text-[hsl(var(--brand-blue))]">✓</span>
              Full program visibility
            </li>
            <li className="flex items-center gap-2 text-sm text-text-secondary">
              <span className="text-[hsl(var(--brand-blue))]">✓</span>
              Direct buyer inquiries
            </li>
          </ul>
        </div>

        <div className="mt-6">
          <a
            href="https://breederhq.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[hsl(var(--brand-blue))] text-white font-medium hover:bg-[hsl(var(--brand-blue))]/90 transition-colors"
            style={{ minHeight: "48px" }}
          >
            List as Breeder
            <ArrowRightIcon className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

export default DualRecruitmentSection;
