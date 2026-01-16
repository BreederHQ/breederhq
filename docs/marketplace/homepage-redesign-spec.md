# Homepage Redesign Specification

**Date**: 2026-01-15
**Priority**: P0 - Critical
**Status**: Ready for Engineering

---

## Executive Summary

Complete homepage rewrite. **Do not modify the existing file.** Build this fresh.

The new homepage must scream: **"LIST YOUR ANIMALS OR SERVICES HERE"**

---

## Complete New HomePage Component

Replace the entire contents of `apps/marketplace/src/marketplace/pages/HomePage.tsx` with this:

```tsx
// apps/marketplace/src/marketplace/pages/HomePage.tsx
// Complete homepage rewrite - Supplier-first for cold-start marketplace

import * as React from "react";
import { Link } from "react-router-dom";
import {
  getPublicOffspringGroups,
  getBreederAnimalListings,
  getBreederOffspringGroups,
  getBreederServices,
  getBreederInquiries,
} from "../../api/client";
import { formatCents } from "../../utils/format";
import { useIsSeller, useTenantId } from "../../gate/MarketplaceGate";
import { updateSEO, addStructuredData, getOrganizationStructuredData } from "../../utils/seo";

// ============================================================================
// ICONS
// ============================================================================

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
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

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M9 5l7 7-7 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DollarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PercentIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="2" />
      <circle cx="15" cy="15" r="2" stroke="currentColor" strokeWidth="2" />
      <path d="M19 5L5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function MessageCircleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
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

function ToolsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PawFilledIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 13c-2.5 0-5.5 2-5.5 5 0 2 2 4 5.5 4s5.5-2 5.5-4c0-3-3-5-5.5-5z" />
      <ellipse cx="6.5" cy="9" rx="2.5" ry="3" />
      <ellipse cx="17.5" cy="9" rx="2.5" ry="3" />
      <ellipse cx="9.5" cy="5" rx="2" ry="2.5" />
      <ellipse cx="14.5" cy="5" rx="2" ry="2.5" />
    </svg>
  );
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
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

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
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

// Supplier type icons
function DogIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 2.344-2.5M14 5.172C14 3.782 15.577 2.679 17.5 3c2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.855-1.45-2.344-2.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <ellipse cx="12" cy="14" rx="5" ry="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 18v3M9.5 21h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function HorseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M22 9s-2-2-4-2c-2.5 0-3.5 1.5-4.5 3L12 13l-3 7H7l1-4-3 1-2 3H2l2-6 4-2 3-4c.5-1 1.5-3 4-3h4l3 4z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="18" cy="6" r="1" fill="currentColor" />
    </svg>
  );
}

function RabbitIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M18 8c0-2.5-1.5-5-4-5s-4 2.5-4 5M6 8c0-2.5 1.5-5 4-5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <ellipse cx="12" cy="14" rx="6" ry="5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="9" cy="12" r="1" fill="currentColor" />
      <circle cx="15" cy="12" r="1" fill="currentColor" />
      <path d="M12 14v1M10 16h4M12 19v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function GraduationCapIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M22 10l-10-5-10 5 10 5 10-5zM6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ScissorsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth="2" />
      <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2" />
      <path d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function TruckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M16 16V3H1v13h15zm0 0h6v-6l-3-3h-3v9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="5.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="18.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v11z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function HeartPulseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M3 12h4l3 9 4-18 3 9h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WrenchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 15a3 3 0 100-6 3 3 0 000 6z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InboxIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M22 12h-6l-2 3h-4l-2-3H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LayersIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ============================================================================
// SECTION 1: HERO - Supplier-focused
// ============================================================================

function HeroSection() {
  return (
    <section className="relative py-16 md:py-20">
      <div className="text-center max-w-3xl mx-auto px-4">
        {/* Main headline - supplier focused */}
        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight mb-6">
          List Your Animals or Services
        </h1>

        {/* Value prop subhead */}
        <p className="text-xl text-text-secondary mb-10 max-w-2xl mx-auto">
          No fees. No commissions. Connect directly with quality buyers.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          {/* Primary CTA - Suppliers */}
          <a
            href="https://breederhq.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[hsl(var(--brand-orange))] text-white text-lg font-semibold hover:bg-[hsl(var(--brand-orange))]/90 transition-colors shadow-lg shadow-[hsl(var(--brand-orange))]/25"
          >
            Start Listing - It's Free
            <ArrowRightIcon className="h-5 w-5" />
          </a>

          {/* Secondary CTA - Buyers */}
          <Link
            to="/animals"
            className="inline-flex items-center gap-2 px-6 py-4 text-white font-medium hover:text-[hsl(var(--brand-orange))] transition-colors"
          >
            Browse the Marketplace
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>

        {/* Trust micro-copy */}
        <p className="text-sm text-text-tertiary">
          No credit card required
        </p>
      </div>
    </section>
  );
}

// ============================================================================
// SECTION 2: VALUE PROPS - Why list here
// ============================================================================

function ValuePropsSection() {
  const valueProps = [
    {
      icon: DollarIcon,
      title: "Zero Listing Fees",
      description: "List unlimited animals and services at no cost.",
    },
    {
      icon: PercentIcon,
      title: "No Commissions",
      description: "We don't take a cut. Keep 100% of what you earn.",
    },
    {
      icon: MessageCircleIcon,
      title: "Direct Connection",
      description: "Buyers contact you directly. No middleman.",
    },
    {
      icon: ToolsIcon,
      title: "Professional Tools",
      description: "Powered by BreederHQ breeding management software.",
    },
  ];

  return (
    <section className="py-12 border-t border-border-subtle">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
        {valueProps.map((prop) => {
          const Icon = prop.icon;
          return (
            <div key={prop.title} className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--brand-teal))]/10 flex items-center justify-center mx-auto mb-4">
                <Icon className="h-7 w-7 text-[hsl(var(--brand-teal))]" />
              </div>
              <h3 className="font-semibold text-white mb-2">{prop.title}</h3>
              <p className="text-sm text-text-tertiary">{prop.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ============================================================================
// SECTION 3: WHO SHOULD LIST - Supplier types
// ============================================================================

function WhoShouldListSection() {
  const supplierTypes = [
    { icon: DogIcon, label: "Dog & Cat Breeders" },
    { icon: HorseIcon, label: "Horse Breeders" },
    { icon: RabbitIcon, label: "Small Animal Breeders" },
    { icon: GraduationCapIcon, label: "Professional Trainers" },
    { icon: ScissorsIcon, label: "Groomers & Handlers" },
    { icon: TruckIcon, label: "Pet Transporters" },
    { icon: CameraIcon, label: "Animal Photographers" },
    { icon: HeartPulseIcon, label: "Veterinary Services" },
    { icon: WrenchIcon, label: "Farriers & Specialists" },
  ];

  return (
    <section className="py-12">
      <h2 className="text-2xl font-bold text-white text-center mb-8">
        Built for Breeders and Service Providers
      </h2>

      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-4">
        {supplierTypes.map((type) => {
          const Icon = type.icon;
          return (
            <div key={type.label} className="text-center">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-2">
                <Icon className="h-6 w-6 text-text-secondary" />
              </div>
              <p className="text-xs text-text-tertiary">{type.label}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ============================================================================
// SECTION 4: BROWSE SECTION - For buyers (secondary)
// ============================================================================

function BrowseSection() {
  return (
    <section className="py-12 border-t border-border-subtle">
      <h2 className="text-xl font-bold text-white text-center mb-6">
        Looking to Buy?
      </h2>

      <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
        <Link
          to="/animals"
          className="rounded-xl border border-border-subtle bg-portal-card p-6 text-center hover:bg-portal-card-hover hover:border-border-default transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-[hsl(var(--brand-orange))]/10 flex items-center justify-center mx-auto mb-3">
            <PawFilledIcon className="h-6 w-6 text-[hsl(var(--brand-orange))]" />
          </div>
          <h3 className="font-semibold text-white group-hover:text-[hsl(var(--brand-orange))] transition-colors">Animals</h3>
        </Link>

        <Link
          to="/breeders"
          className="rounded-xl border border-border-subtle bg-portal-card p-6 text-center hover:bg-portal-card-hover hover:border-border-default transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-[hsl(var(--brand-orange))]/10 flex items-center justify-center mx-auto mb-3">
            <ShieldCheckIcon className="h-6 w-6 text-[hsl(var(--brand-orange))]" />
          </div>
          <h3 className="font-semibold text-white group-hover:text-[hsl(var(--brand-orange))] transition-colors">Breeders</h3>
        </Link>

        <Link
          to="/services"
          className="rounded-xl border border-border-subtle bg-portal-card p-6 text-center hover:bg-portal-card-hover hover:border-border-default transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-[hsl(var(--brand-orange))]/10 flex items-center justify-center mx-auto mb-3">
            <BriefcaseIcon className="h-6 w-6 text-[hsl(var(--brand-orange))]" />
          </div>
          <h3 className="font-semibold text-white group-hover:text-[hsl(var(--brand-orange))] transition-colors">Services</h3>
        </Link>
      </div>
    </section>
  );
}

// ============================================================================
// SECTION 5: RECENT LISTINGS - Only if inventory exists
// ============================================================================

interface FeaturedItem {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  price: string | null;
  imageUrl?: string | null;
}

function FeaturedCard({ item }: { item: FeaturedItem }) {
  return (
    <Link to={item.href} className="block group">
      <div className="rounded-xl border border-border-subtle bg-portal-card overflow-hidden transition-all hover:bg-portal-card-hover hover:border-border-default hover:-translate-y-0.5 hover:shadow-lg">
        {/* Image */}
        <div className="aspect-[4/3] bg-gradient-to-br from-border-default to-border-subtle flex items-center justify-center">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
          ) : (
            <PawFilledIcon className="h-12 w-12 text-text-tertiary/50" />
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-white mb-1 line-clamp-1 group-hover:text-[hsl(var(--brand-orange))] transition-colors">
            {item.title}
          </h3>
          <p className="text-sm text-text-tertiary line-clamp-1 mb-2">{item.subtitle}</p>
          {item.price && (
            <p className="text-sm font-medium text-[hsl(var(--brand-orange))]">{item.price}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

function RecentListingsSection() {
  const [listings, setListings] = React.useState<FeaturedItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let dead = false;

    async function fetchListings() {
      try {
        const result = await getPublicOffspringGroups({ limit: 4 });
        if (dead) return;

        const items: FeaturedItem[] = (result.items || []).map((l) => ({
          id: String(l.id),
          title: l.title || `${l.breed || l.species} Offspring`,
          subtitle: l.breeder?.name || "Breeder",
          href:
            l.breeder?.slug && l.listingSlug
              ? `/programs/${l.breeder.slug}/offspring-groups/${l.listingSlug}`
              : "/animals",
          price: l.priceMinCents ? formatCents(l.priceMinCents) : null,
          imageUrl: l.coverImageUrl,
        }));

        setListings(items);
      } catch (err) {
        console.error("Failed to fetch listings:", err);
      } finally {
        if (!dead) setLoading(false);
      }
    }

    fetchListings();
    return () => { dead = true; };
  }, []);

  // Don't render if no listings
  if (!loading && listings.length === 0) return null;

  return (
    <section className="py-12 border-t border-border-subtle">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Recent Listings</h2>
        <Link
          to="/animals"
          className="text-sm text-text-secondary hover:text-white transition-colors flex items-center gap-1"
        >
          View all
          <ChevronRightIcon className="h-4 w-4" />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-border-subtle bg-portal-card overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-border-default" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-border-default rounded w-3/4" />
                <div className="h-3 bg-border-default rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {listings.map((item) => (
            <FeaturedCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}

// ============================================================================
// SECTION 6: BOTTOM CTA - Final reminder
// ============================================================================

function BottomCTASection() {
  return (
    <section className="py-12 border-t border-border-subtle">
      <div className="text-center max-w-xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-3">
          Ready to reach more buyers?
        </h2>
        <p className="text-text-secondary mb-6">
          List your animals or services today. It's free.
        </p>
        <a
          href="https://breederhq.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[hsl(var(--brand-orange))] text-white font-semibold hover:bg-[hsl(var(--brand-orange))]/90 transition-colors"
        >
          Start Listing
          <ArrowRightIcon className="h-5 w-5" />
        </a>
      </div>
    </section>
  );
}

// ============================================================================
// SELLER HOME PAGE - Dashboard for breeders (unchanged from original)
// ============================================================================

interface SellerStats {
  totalAnimals: number;
  totalOffspring: number;
  totalServices: number;
  pendingInquiries: number;
}

function SellerHomePage() {
  const tenantId = useTenantId();
  const [stats, setStats] = React.useState<SellerStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!tenantId) return;
    let dead = false;

    async function fetchStats() {
      try {
        const [animalsRes, offspringRes, servicesRes, inquiriesRes] = await Promise.all([
          getBreederAnimalListings(tenantId!, { limit: 1 }),
          getBreederOffspringGroups(tenantId!, { limit: 1 }),
          getBreederServices(tenantId!, { limit: 1 }),
          getBreederInquiries(tenantId!, { limit: 1, status: "pending" }),
        ]);
        if (dead) return;

        setStats({
          totalAnimals: animalsRes.total || 0,
          totalOffspring: offspringRes.total || 0,
          totalServices: servicesRes.total || 0,
          pendingInquiries: inquiriesRes.total || 0,
        });
      } catch (err) {
        console.error("Failed to fetch seller stats:", err);
        setStats({
          totalAnimals: 0,
          totalOffspring: 0,
          totalServices: 0,
          pendingInquiries: 0,
        });
      } finally {
        if (!dead) setLoading(false);
      }
    }

    fetchStats();
    return () => { dead = true; };
  }, [tenantId]);

  return (
    <div className="max-w-portal mx-auto px-4 md:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
          Marketplace Dashboard
        </h1>
        <p className="text-text-secondary">
          Manage your marketplace presence and connect with buyers
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border-subtle bg-portal-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-[hsl(var(--brand-orange))]/10 flex items-center justify-center">
              <PawFilledIcon className="h-5 w-5 text-[hsl(var(--brand-orange))]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {loading ? "-" : stats?.totalAnimals ?? 0}
          </p>
          <p className="text-sm text-text-tertiary">Animal Listings</p>
        </div>

        <div className="rounded-xl border border-border-subtle bg-portal-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-[hsl(var(--brand-blue))]/10 flex items-center justify-center">
              <LayersIcon className="h-5 w-5 text-[hsl(var(--brand-blue))]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {loading ? "-" : stats?.totalOffspring ?? 0}
          </p>
          <p className="text-sm text-text-tertiary">Offspring Listings</p>
        </div>

        <div className="rounded-xl border border-border-subtle bg-portal-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <BriefcaseIcon className="h-5 w-5 text-green-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {loading ? "-" : stats?.totalServices ?? 0}
          </p>
          <p className="text-sm text-text-tertiary">Service Listings</p>
        </div>

        <div className="rounded-xl border border-border-subtle bg-portal-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <InboxIcon className="h-5 w-5 text-yellow-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {loading ? "-" : stats?.pendingInquiries ?? 0}
          </p>
          <p className="text-sm text-text-tertiary">Pending Inquiries</p>
        </div>
      </div>

      {/* Primary Action - Manage Storefront */}
      <Link
        to="/manage/breeder"
        className="block w-full text-left rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent p-6 md:p-8 hover:border-emerald-500/50 transition-all group cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
              <SettingsIcon className="h-7 w-7 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Manage your Breeding Program Storefront</h2>
              <p className="text-text-secondary">
                Set up your business profile, location, and breeding programs
              </p>
            </div>
          </div>
          <ArrowRightIcon className="h-6 w-6 text-emerald-400 group-hover:translate-x-1 transition-transform" />
        </div>
      </Link>

      {/* Quick Actions Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        <Link
          to="/manage/animals"
          className="block text-left rounded-xl border border-border-subtle bg-portal-card p-5 hover:bg-portal-card-hover hover:border-border-default transition-all group cursor-pointer"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-[hsl(var(--brand-orange))]/10 flex items-center justify-center group-hover:bg-[hsl(var(--brand-orange))]/20 transition-colors">
              <PawFilledIcon className="h-6 w-6 text-[hsl(var(--brand-orange))]" />
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1 group-hover:text-[hsl(var(--brand-orange))] transition-colors">
                Manage Animal Listings
              </h3>
              <p className="text-sm text-text-tertiary">
                List individual animals for sale or showcase your breeding stock
              </p>
            </div>
          </div>
        </Link>

        <Link
          to="/manage/services"
          className="block text-left rounded-xl border border-border-subtle bg-portal-card p-5 hover:bg-portal-card-hover hover:border-border-default transition-all group cursor-pointer"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
              <BriefcaseIcon className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1 group-hover:text-green-400 transition-colors">
                Manage Services Listings
              </h3>
              <p className="text-sm text-text-tertiary">
                Offer training, grooming, or other professional services
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Secondary Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <Link
          to="/manage/inquiries"
          className="block text-left rounded-xl border border-border-subtle bg-portal-card p-5 hover:bg-portal-card-hover hover:border-border-default transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <InboxIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white group-hover:text-yellow-400 transition-colors">
                  View Inquiries
                </h3>
                <p className="text-sm text-text-tertiary">
                  Respond to buyer questions and requests
                </p>
              </div>
            </div>
            {stats && stats.pendingInquiries > 0 && (
              <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-yellow-500/20 text-yellow-400">
                {stats.pendingInquiries} pending
              </span>
            )}
          </div>
        </Link>

        <Link
          to="/manage/waitlist"
          className="block text-left rounded-xl border border-border-subtle bg-portal-card p-5 hover:bg-portal-card-hover hover:border-border-default transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <UsersIcon className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors">
                Waitlist Management
              </h3>
              <p className="text-sm text-text-tertiary">
                View and manage buyers on your waitlists
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Browse Marketplace Link */}
      <div className="border-t border-border-subtle pt-8">
        <div className="text-center">
          <p className="text-text-secondary mb-4">
            Want to see how your listings appear to buyers?
          </p>
          <Link
            to="/animals"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg border border-border-subtle text-text-secondary hover:text-white hover:border-border-default transition-colors cursor-pointer"
          >
            Browse the Marketplace
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

export function HomePage() {
  const isSeller = useIsSeller();
  const [renderError, setRenderError] = React.useState<Error | null>(null);

  // SEO for home page
  React.useEffect(() => {
    updateSEO({
      title: "BreederHQ Marketplace – List Your Animals & Services Free",
      description:
        "List your animals, breeding program, or professional services for free. No fees, no commissions. Connect directly with quality buyers. Breeders, trainers, groomers, transporters welcome.",
      canonical: "https://marketplace.breederhq.com/",
      keywords:
        "list animals for sale, list breeding program, animal services marketplace, free pet listing, breeder marketplace, dog breeder listing, cat breeder listing, horse breeder listing",
      noindex: false,
    });
    addStructuredData(getOrganizationStructuredData());
  }, []);

  // Error handler
  React.useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      console.error("HomePage render error:", event.error);
      setRenderError(event.error);
    };
    window.addEventListener("error", errorHandler);
    return () => window.removeEventListener("error", errorHandler);
  }, []);

  if (renderError) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6">
          <h2 className="text-xl font-bold text-white mb-2">Error Loading Page</h2>
          <p className="text-text-secondary mb-4">
            There was a problem loading the marketplace home page.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  // Sellers get dashboard
  if (isSeller) {
    return <SellerHomePage />;
  }

  // Public homepage - supplier-focused
  return (
    <div className="space-y-0 pb-0">
      {/* 1. Hero - Supplier recruitment */}
      <HeroSection />

      {/* 2. Value Props - Why list here */}
      <ValuePropsSection />

      {/* 3. Who Should List - Supplier types */}
      <WhoShouldListSection />

      {/* 4. Browse - For buyers (secondary) */}
      <BrowseSection />

      {/* 5. Recent Listings - Only if inventory exists */}
      <RecentListingsSection />

      {/* 6. Bottom CTA - Final reminder */}
      <BottomCTASection />
    </div>
  );
}

export default HomePage;
```

---

## Summary

This is a **complete replacement** of `HomePage.tsx`.

**New page flow:**
1. **Hero**: "List Your Animals or Services" with orange CTA
2. **Value Props**: 4-grid showing zero fees, no commissions, direct connection, pro tools
3. **Who Should List**: 9 icons showing all supplier types welcome
4. **Browse Section**: Small "Looking to Buy?" with 3 category cards
5. **Recent Listings**: Only renders if inventory exists
6. **Bottom CTA**: "Ready to reach more buyers?"

**Copy the entire code block above into the file.**

---

## Acceptance Criteria

- [ ] Hero headline is "List Your Animals or Services"
- [ ] Primary CTA is "Start Listing - It's Free" (orange)
- [ ] Secondary CTA is "Browse the Marketplace"
- [ ] Value props show: Zero fees, No commissions, Direct connection, Pro tools
- [ ] Who Should List shows 9 supplier types with icons
- [ ] Browse section has 3 cards: Animals, Breeders, Services
- [ ] Recent Listings only renders if there are listings
- [ ] Bottom CTA says "Ready to reach more buyers?"
- [ ] SEO title updated to mention "List Your Animals & Services Free"
- [ ] Mobile responsive (2-col value props, 3-col supplier types)
- [ ] All touch targets minimum 44px
