// apps/marketplace/src/marketplace/pages/HomePage.tsx
// Marketplace home page - Intent router with featured section
import * as React from "react";
import { Link } from "react-router-dom";
import { isDemoMode, setDemoMode } from "../../demo/demoMode";
import { Seo } from "../../seo";
import {
  getAllMockListings,
  getMockPrograms,
  getMockServices,
  simulateDelay,
  type MockService,
} from "../../demo/mockData";
import { formatCents } from "../../utils/format";
import type {
  PublicOffspringGroupListingDTO,
  PublicProgramSummaryDTO,
} from "../../api/types";

type FeaturedCategory = "animals" | "breeders" | "services";

/**
 * Marketplace home page - Intent router.
 * Section A: Three intent cards (Animals, Breeders, Services)
 * Section B: Featured items (rotates category in demo mode)
 */
export function HomePage() {
  const demoMode = isDemoMode();

  // Rotate featured category on each page load in demo mode
  const [featuredCategory] = React.useState<FeaturedCategory>(() => {
    const categories: FeaturedCategory[] = ["animals", "breeders", "services"];
    return categories[Math.floor(Math.random() * categories.length)];
  });

  // Handle enabling demo mode
  const handleEnableDemo = () => {
    setDemoMode(true);
    window.location.reload();
  };

  return (
    <div className="space-y-16">
      <Seo
        title="Home"
        description="Browse animals, connect with breeders, and find services on the BreederHQ Marketplace."
        path="/"
        ogType="website"
      />

      {/* Section A: Intent Selection */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto">
          <h1 className="text-[28px] font-bold text-white tracking-tight leading-tight">
            What are you looking for?
          </h1>
          <p className="text-sm text-text-tertiary mt-2">
            Choose where to start your search.
          </p>
        </div>

        {/* Intent Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <IntentCard
            title="Animals"
            description="Find available animals by species and breed."
            ctaLabel="Browse animals"
            href="/animals"
            icon={<AnimalIcon />}
          />
          <IntentCard
            title="Breeders"
            description="Explore breeding programs and join waitlists."
            ctaLabel="Browse breeders"
            href="/breeders"
            icon={<BreederIcon />}
          />
          <IntentCard
            title="Services"
            description="Stud, training, delivery, and breeder services."
            ctaLabel="Browse services"
            href="/services"
            icon={<ServiceIcon />}
          />
        </div>
      </section>

      {/* Section B: Featured */}
      <FeaturedSection
        demoMode={demoMode}
        category={featuredCategory}
        onEnableDemo={handleEnableDemo}
      />
    </div>
  );
}

// ============================================================================
// INTENT CARDS
// ============================================================================

function IntentCard({
  title,
  description,
  ctaLabel,
  href,
  icon,
}: {
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link to={href} className="block group">
      <div className="rounded-portal border border-border-subtle bg-portal-card p-6 h-full transition-all hover:bg-portal-card-hover hover:border-border-default hover:-translate-y-0.5">
        <div className="flex flex-col h-full">
          {/* Icon */}
          <div className="w-10 h-10 rounded-full bg-border-default flex items-center justify-center mb-4 group-hover:bg-accent/10 transition-colors">
            {icon}
          </div>

          {/* Content */}
          <h2 className="text-lg font-semibold text-white mb-2">{title}</h2>
          <p className="text-sm text-text-tertiary mb-4 flex-grow">
            {description}
          </p>

          {/* CTA */}
          <div className="flex items-center gap-2 text-sm text-accent font-medium group-hover:text-accent-hover transition-colors">
            <span>{ctaLabel}</span>
            <svg
              className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ============================================================================
// ICONS
// ============================================================================

function AnimalIcon() {
  return (
    <svg
      className="w-5 h-5 text-text-secondary"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
      />
    </svg>
  );
}

function BreederIcon() {
  return (
    <svg
      className="w-5 h-5 text-text-secondary"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  );
}

function ServiceIcon() {
  return (
    <svg
      className="w-5 h-5 text-text-secondary"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

// ============================================================================
// FEATURED SECTION
// ============================================================================

function FeaturedSection({
  demoMode,
  category,
  onEnableDemo,
}: {
  demoMode: boolean;
  category: FeaturedCategory;
  onEnableDemo: () => void;
}) {
  const [items, setItems] = React.useState<FeaturedItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!demoMode) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      await simulateDelay(200);

      let featured: FeaturedItem[] = [];

      if (category === "animals") {
        const listings = getAllMockListings().filter((l) => l.countAvailable > 0);
        featured = listings.slice(0, 4).map((l) => ({
          id: `${l.programSlug}-${l.slug}`,
          type: "animal" as const,
          title: l.title || "Untitled",
          subtitle: l.breed || l.species,
          href: `/programs/${l.programSlug}/offspring-groups/${l.slug}`,
          price: l.priceRange ? formatCents(l.priceRange.min) : null,
        }));
      } else if (category === "breeders") {
        const { items: breeders } = getMockPrograms({ limit: 4 });
        featured = breeders.map((b) => ({
          id: b.slug,
          type: "breeder" as const,
          title: b.name,
          subtitle: `${b.breed} · ${b.location}`,
          href: `/programs/${b.slug}`,
          price: null,
        }));
      } else {
        const services = getMockServices().slice(0, 4);
        featured = services.map((s) => ({
          id: s.id,
          type: "service" as const,
          title: s.name,
          subtitle: s.programName,
          href: `/programs/${s.programSlug}`,
          price: s.priceRange ? formatCents(s.priceRange.min) : null,
        }));
      }

      setItems(featured);
      setLoading(false);
    };

    fetchData();
  }, [demoMode, category]);

  // Non-demo mode: show subtle placeholder
  if (!demoMode) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Featured right now</h2>
        <div className="rounded-portal border border-border-subtle bg-portal-card p-6 text-center">
          <p className="text-sm text-text-tertiary mb-4">
            Featured listings will appear here once the marketplace is live.
          </p>
          <button
            type="button"
            onClick={onEnableDemo}
            className="text-sm text-text-secondary hover:text-white transition-colors"
          >
            Preview with demo data
          </button>
        </div>
      </section>
    );
  }

  const categoryLabel =
    category === "animals"
      ? "Animals"
      : category === "breeders"
      ? "Breeders"
      : "Services";

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-white">Featured right now</h2>
        <span className="text-xs text-text-muted">· {categoryLabel}</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-portal border border-border-subtle bg-portal-card p-5 animate-pulse"
            >
              <div className="h-4 bg-border-default rounded w-3/4 mb-3" />
              <div className="h-3 bg-border-default rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((item, idx) => (
            <FeaturedCard key={item.id} item={item} featured={idx === 0} />
          ))}
        </div>
      )}
    </section>
  );
}

interface FeaturedItem {
  id: string;
  type: "animal" | "breeder" | "service";
  title: string;
  subtitle: string;
  href: string;
  price: string | null;
}

function FeaturedCard({
  item,
  featured,
}: {
  item: FeaturedItem;
  featured?: boolean;
}) {
  return (
    <Link to={item.href} className="block group">
      <div className="rounded-portal border border-border-subtle bg-portal-card p-5 h-full transition-colors hover:bg-portal-card-hover hover:border-border-default">
        {/* Featured badge - only on first item */}
        {featured && (
          <span className="inline-block px-1.5 py-0.5 mb-3 text-[10px] font-semibold rounded bg-amber-500/20 text-amber-400 uppercase tracking-wide">
            Featured
          </span>
        )}

        {/* Title */}
        <h3 className="text-[15px] font-semibold text-white mb-1 line-clamp-1 group-hover:text-accent transition-colors">
          {item.title}
        </h3>

        {/* Subtitle */}
        <p className="text-sm text-text-tertiary line-clamp-1">{item.subtitle}</p>

        {/* Price (only shown in Featured section) */}
        {item.price && (
          <p className="text-sm text-accent font-medium mt-3">{item.price}</p>
        )}
      </div>
    </Link>
  );
}
