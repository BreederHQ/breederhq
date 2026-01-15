// apps/marketplace/src/marketplace/components/ServiceProviderCTA.tsx
// Recruitment section for service providers - shows categories and value prop

import * as React from "react";
import { Link } from "react-router-dom";

// Service category icons
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

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M14 5l7 7m0 0l-7 7m7-7H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

export function ServiceProviderCTA() {
  return (
    <section className="rounded-2xl border border-[hsl(var(--brand-orange))]/30 bg-gradient-to-br from-[hsl(var(--brand-orange))]/5 to-transparent p-8 md:p-10">
      <div className="grid md:grid-cols-2 gap-8 items-center">
        {/* Left: Value proposition */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Offer your services to the breeding community
          </h2>
          <p className="text-text-secondary mb-6 leading-relaxed">
            Trainers, groomers, transporters, photographers, vets — breeders and buyers need your expertise. List your services and connect with clients who understand the value of professional animal care.
          </p>

          {/* Service category pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            {SERVICE_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <span
                  key={cat.label}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-text-secondary"
                >
                  <Icon className="w-4 h-4" />
                  {cat.label}
                </span>
              );
            })}
            <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-text-tertiary">
              +10 more
            </span>
          </div>

          <Link
            to="/provider"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[hsl(var(--brand-orange))] text-white font-medium hover:bg-[hsl(var(--brand-orange))]/90 transition-colors"
          >
            List Your Services
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>

        {/* Right: Why list here */}
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[hsl(var(--brand-orange))]/10 flex items-center justify-center">
              <span className="text-[hsl(var(--brand-orange))] font-bold">1</span>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">Reach the right clients</h3>
              <p className="text-sm text-text-tertiary">
                Connect with serious breeders and pet owners who value quality over price.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[hsl(var(--brand-orange))]/10 flex items-center justify-center">
              <span className="text-[hsl(var(--brand-orange))] font-bold">2</span>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">No platform fees</h3>
              <p className="text-sm text-text-tertiary">
                Direct contact with clients. No commissions, no middleman fees on bookings.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[hsl(var(--brand-orange))]/10 flex items-center justify-center">
              <span className="text-[hsl(var(--brand-orange))] font-bold">3</span>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">Build your reputation</h3>
              <p className="text-sm text-text-tertiary">
                Collect reviews, showcase your credentials, and stand out in your specialty.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ServiceProviderCTA;
