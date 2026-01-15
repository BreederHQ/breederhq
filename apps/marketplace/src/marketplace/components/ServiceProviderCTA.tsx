// apps/marketplace/src/marketplace/components/ServiceProviderCTA.tsx
// Recruitment section for service providers with fee comparison

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

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
  { icon: CameraIcon, label: "Photography" },
  { icon: HomeIcon, label: "Boarding" },
  { icon: HeartPulseIcon, label: "Veterinary" },
];

export function ServiceProviderCTA() {
  return (
    <section className="py-16 md:py-20 bg-[hsl(var(--brand-orange))]" aria-labelledby="service-provider-title">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 id="service-provider-title" className="text-3xl md:text-4xl font-bold text-white mb-4">
            Grow your business with the breeding community
          </h2>
          <p className="text-lg text-white/90 max-w-3xl mx-auto leading-relaxed">
            Trainers, groomers, transporters, photographers, vets - list your services and connect with clients who value professional animal care.
          </p>
        </div>

        {/* Service category pills */}
        <div className="flex flex-wrap gap-2 justify-center mb-12">
          {SERVICE_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <span
                key={cat.label}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 border border-white/30 text-sm text-white"
              >
                <Icon className="w-4 h-4" />
                {cat.label}
              </span>
            );
          })}
          <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 border border-white/30 text-sm text-white/80">
            +8 more
          </span>
        </div>

        {/* Two column layout: Why list + Fee comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          {/* Left: Why list on BreederHQ */}
          <div className="p-8 rounded-xl bg-white shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Why list on BreederHQ?</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[hsl(var(--brand-orange))]/10 flex items-center justify-center mt-0.5">
                  <CheckIcon className="w-3 h-3 text-[hsl(var(--brand-orange))]" />
                </div>
                <span className="text-gray-600">Reach clients who value quality over price</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[hsl(var(--brand-orange))]/10 flex items-center justify-center mt-0.5">
                  <CheckIcon className="w-3 h-3 text-[hsl(var(--brand-orange))]" />
                </div>
                <span className="text-gray-600">Build your professional profile and reputation</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[hsl(var(--brand-orange))]/10 flex items-center justify-center mt-0.5">
                  <CheckIcon className="w-3 h-3 text-[hsl(var(--brand-orange))]" />
                </div>
                <span className="text-gray-600">Connect directly with clients - no middleman</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[hsl(var(--brand-orange))]/10 flex items-center justify-center mt-0.5">
                  <CheckIcon className="w-3 h-3 text-[hsl(var(--brand-orange))]" />
                </div>
                <span className="text-gray-600">Collect verified reviews from real clients</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[hsl(var(--brand-orange))]/10 flex items-center justify-center mt-0.5">
                  <CheckIcon className="w-3 h-3 text-[hsl(var(--brand-orange))]" />
                </div>
                <span className="text-gray-600">Showcase credentials, certifications, and experience</span>
              </li>
            </ul>
          </div>

          {/* Right: Keep 100% of your fees */}
          <div className="p-8 rounded-xl bg-white shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Keep 100% of your fees</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Unlike Rover or Wag, we don't take a percentage of your bookings. You keep everything you earn.
            </p>

            {/* Fee comparison table */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600">Rover</span>
                <span className="text-gray-400 line-through">20% per booking</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600">Wag</span>
                <span className="text-gray-400 line-through">40% per booking</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-900 font-semibold">BreederHQ</span>
                <span className="text-[hsl(var(--brand-orange))] font-bold text-lg">$0</span>
              </div>
            </div>

            <p className="text-sm text-gray-500">
              Direct contact with clients. Set your own rates. No commissions.
            </p>
          </div>
        </div>

        {/* CTA button - white on orange background */}
        <div className="text-center">
          <Link
            to="/provider"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-white text-[hsl(var(--brand-orange))] font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg"
          >
            List Your Services - It's Free
            <ArrowRightIcon className="h-5 w-5" />
          </Link>
          <p className="text-sm text-white/80 mt-3">
            Takes about 5 minutes. No credit card required.
          </p>
        </div>
      </div>
    </section>
  );
}

export default ServiceProviderCTA;
