// apps/marketplace/src/marketplace/pages/HomePage.tsx
// Marketplace home page - 3-section layout with hero cards and featured rows
import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { isDemoMode, setDemoMode } from "../../demo/demoMode";
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

/**
 * Marketplace home page - 3 stacked sections.
 * Each section has a hero card + row of featured cards.
 */
export function HomePage() {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = React.useState("");
  const demoMode = isDemoMode();

  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchValue.trim();
    if (q) {
      navigate(`/animals?q=${encodeURIComponent(q)}`);
    } else {
      navigate("/animals");
    }
  };

  // Handle enabling demo mode
  const handleEnableDemo = () => {
    setDemoMode(true);
    window.location.reload();
  };

  return (
    <div className="space-y-10">
      {/* Hero section */}
      <div className="space-y-5">
        <div>
          <h1 className="text-[28px] font-bold text-white tracking-tight leading-tight">
            Marketplace
          </h1>
          <p className="text-sm text-text-tertiary mt-1">
            Browse animals, explore breeders, and request information.
          </p>
        </div>

        {/* Search input */}
        <form onSubmit={handleSearchSubmit} className="max-w-2xl">
          <div className="relative">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search breed, breeder, or location..."
              className="w-full h-12 pl-12 pr-4 rounded-portal-sm bg-portal-card border border-border-subtle text-sm text-white placeholder-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
            />
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </form>
      </div>

      {/* Animals Section */}
      <AnimalsSection demoMode={demoMode} onEnableDemo={handleEnableDemo} />

      {/* Breeders Section */}
      <BreedersSection demoMode={demoMode} onEnableDemo={handleEnableDemo} />

      {/* Services Section */}
      <ServicesSection demoMode={demoMode} onEnableDemo={handleEnableDemo} />
    </div>
  );
}

// ============================================================================
// ANIMALS SECTION
// ============================================================================

function AnimalsSection({
  demoMode,
  onEnableDemo,
}: {
  demoMode: boolean;
  onEnableDemo: () => void;
}) {
  const [listings, setListings] = React.useState<PublicOffspringGroupListingDTO[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!demoMode) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      await simulateDelay(200);
      const all = getAllMockListings().filter((l) => l.countAvailable > 0);
      setListings(all.slice(0, 7)); // 1 hero + 6 row cards
      setLoading(false);
    };
    fetchData();
  }, [demoMode]);

  const hero = listings[0] || null;
  const row = listings.slice(1, 7);

  if (!demoMode) {
    return (
      <SectionWrapper
        title="Animals"
        description="Find your perfect companion from health-tested breeders."
        viewAllHref="/animals"
        viewAllLabel="View all animals"
      >
        <ComingSoonCard
          title="Animals browse is coming soon"
          description="We're building a unified marketplace experience. In the meantime, browse animals through individual breeders."
          ctaHref="/breeders"
          ctaLabel="Browse breeders"
          onEnableDemo={onEnableDemo}
        />
      </SectionWrapper>
    );
  }

  return (
    <SectionWrapper
      title="Animals"
      description="Find your perfect companion from health-tested breeders."
      viewAllHref="/animals"
      viewAllLabel="View all animals"
    >
      {loading ? (
        <LoadingState heroCard rowCards={6} />
      ) : (
        <>
          {/* Hero card */}
          {hero && <AnimalHeroCard listing={hero} />}

          {/* Row of cards */}
          {row.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
              {row.map((listing, idx) => (
                <AnimalRowCard
                  key={`${listing.programSlug}-${listing.slug}`}
                  listing={listing}
                  boosted={demoMode && idx === 0}
                />
              ))}
            </div>
          )}
        </>
      )}
    </SectionWrapper>
  );
}

function AnimalHeroCard({ listing }: { listing: PublicOffspringGroupListingDTO }) {
  const priceText = listing.priceRange
    ? listing.priceRange.min === listing.priceRange.max
      ? formatCents(listing.priceRange.min)
      : `${formatCents(listing.priceRange.min)} - ${formatCents(listing.priceRange.max)}`
    : null;

  return (
    <Link
      to={`/programs/${listing.programSlug}/offspring-groups/${listing.slug}`}
      className="block"
    >
      <div className="rounded-portal border border-border-subtle bg-portal-card p-6 transition-colors hover:bg-portal-card-hover hover:border-border-default">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white mb-1">
              {listing.title || "Untitled Listing"}
            </h3>
            <p className="text-sm text-text-secondary mb-2">
              {listing.breed || listing.species} · {listing.programName}
            </p>
            <p className="text-[13px] text-text-tertiary line-clamp-2">
              {listing.description}
            </p>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="text-right">
              <div className="text-[13px] text-text-tertiary mb-1">
                {listing.countAvailable} available
              </div>
              {priceText && (
                <div className="text-lg text-accent font-semibold">{priceText}</div>
              )}
            </div>
            <svg
              className="w-5 h-5 text-text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}

function AnimalRowCard({
  listing,
  boosted,
}: {
  listing: PublicOffspringGroupListingDTO;
  boosted?: boolean;
}) {
  const priceText = listing.priceRange
    ? formatCents(listing.priceRange.min)
    : null;

  return (
    <Link
      to={`/programs/${listing.programSlug}/offspring-groups/${listing.slug}`}
      className="block"
    >
      <div className="rounded-portal border border-border-subtle bg-portal-card p-4 h-full transition-colors hover:bg-portal-card-hover hover:border-border-default">
        {boosted && <BoostedBadge />}
        <h4 className="text-sm font-semibold text-white mb-1 line-clamp-1">
          {listing.title || "Untitled"}
        </h4>
        <p className="text-xs text-text-tertiary mb-2 line-clamp-1">
          {listing.breed || listing.species}
        </p>
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-secondary">{listing.countAvailable} avail</span>
          {priceText && <span className="text-accent font-medium">{priceText}</span>}
        </div>
      </div>
    </Link>
  );
}

// ============================================================================
// BREEDERS SECTION
// ============================================================================

function BreedersSection({
  demoMode,
  onEnableDemo,
}: {
  demoMode: boolean;
  onEnableDemo: () => void;
}) {
  const [breeders, setBreeders] = React.useState<PublicProgramSummaryDTO[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!demoMode) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      await simulateDelay(250);
      const { items } = getMockPrograms({ limit: 7 });
      setBreeders(items);
      setLoading(false);
    };
    fetchData();
  }, [demoMode]);

  const hero = breeders[0] || null;
  const row = breeders.slice(1, 7);

  if (!demoMode) {
    return (
      <SectionWrapper
        title="Breeders"
        description="Connect with reputable breeders in your area."
        viewAllHref="/breeders"
        viewAllLabel="View all breeders"
      >
        <ComingSoonCard
          title="Discover trusted breeders"
          description="Browse verified breeder profiles, view their programs, and reach out directly."
          ctaHref="/breeders"
          ctaLabel="Browse breeders"
          onEnableDemo={onEnableDemo}
        />
      </SectionWrapper>
    );
  }

  return (
    <SectionWrapper
      title="Breeders"
      description="Connect with reputable breeders in your area."
      viewAllHref="/breeders"
      viewAllLabel="View all breeders"
    >
      {loading ? (
        <LoadingState heroCard rowCards={6} />
      ) : (
        <>
          {/* Hero card */}
          {hero && <BreederHeroCard breeder={hero} />}

          {/* Row of cards */}
          {row.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
              {row.map((breeder, idx) => (
                <BreederRowCard
                  key={breeder.slug}
                  breeder={breeder}
                  boosted={demoMode && idx === 0}
                />
              ))}
            </div>
          )}
        </>
      )}
    </SectionWrapper>
  );
}

function BreederHeroCard({ breeder }: { breeder: PublicProgramSummaryDTO }) {
  return (
    <Link to={`/programs/${breeder.slug}`} className="block">
      <div className="rounded-portal border border-border-subtle bg-portal-card p-6 transition-colors hover:bg-portal-card-hover hover:border-border-default">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white mb-1">{breeder.name}</h3>
            <p className="text-sm text-text-secondary mb-2">
              {breeder.breed} · {breeder.location}
            </p>
            <p className="text-[13px] text-text-tertiary">
              View profile to learn about their breeding program and available animals.
            </p>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <span className="text-sm text-accent font-medium">View profile</span>
            <svg
              className="w-5 h-5 text-text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}

function BreederRowCard({
  breeder,
  boosted,
}: {
  breeder: PublicProgramSummaryDTO;
  boosted?: boolean;
}) {
  return (
    <Link to={`/programs/${breeder.slug}`} className="block">
      <div className="rounded-portal border border-border-subtle bg-portal-card p-4 h-full transition-colors hover:bg-portal-card-hover hover:border-border-default">
        {boosted && <BoostedBadge />}
        <h4 className="text-sm font-semibold text-white mb-1 line-clamp-1">
          {breeder.name}
        </h4>
        <p className="text-xs text-text-tertiary mb-1 line-clamp-1">{breeder.breed}</p>
        <p className="text-xs text-text-secondary">{breeder.location}</p>
      </div>
    </Link>
  );
}

// ============================================================================
// SERVICES SECTION
// ============================================================================

function ServicesSection({
  demoMode,
  onEnableDemo,
}: {
  demoMode: boolean;
  onEnableDemo: () => void;
}) {
  const [services, setServices] = React.useState<MockService[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!demoMode) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      await simulateDelay(180);
      const all = getMockServices();
      setServices(all.slice(0, 7)); // 1 hero + 6 row
      setLoading(false);
    };
    fetchData();
  }, [demoMode]);

  const hero = services[0] || null;
  const row = services.slice(1, 7);

  if (!demoMode) {
    return (
      <SectionWrapper
        title="Services"
        description="Stud services, training, delivery, and more from trusted providers."
        viewAllHref="/services"
        viewAllLabel="View all services"
      >
        <ComingSoonCard
          title="Services browse is coming soon"
          description="Services are published by breeders. Browse breeder profiles to learn about their offerings."
          ctaHref="/breeders"
          ctaLabel="Browse breeders"
          onEnableDemo={onEnableDemo}
        />
      </SectionWrapper>
    );
  }

  return (
    <SectionWrapper
      title="Services"
      description="Stud services, training, delivery, and more from trusted providers."
      viewAllHref="/services"
      viewAllLabel="View all services"
    >
      {loading ? (
        <LoadingState heroCard rowCards={6} />
      ) : (
        <>
          {/* Hero card */}
          {hero && <ServiceHeroCard service={hero} />}

          {/* Row of cards */}
          {row.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
              {row.map((service, idx) => (
                <ServiceRowCard
                  key={service.id}
                  service={service}
                  boosted={demoMode && idx === 0}
                />
              ))}
            </div>
          )}
        </>
      )}
    </SectionWrapper>
  );
}

const SERVICE_TYPE_LABELS: Record<string, string> = {
  stud: "Stud Service",
  guardianship: "Guardianship",
  training: "Training",
  delivery: "Delivery",
  grooming: "Grooming",
  boarding: "Boarding",
};

function ServiceHeroCard({ service }: { service: MockService }) {
  const priceText = service.priceRange
    ? service.priceRange.min === service.priceRange.max
      ? formatCents(service.priceRange.min)
      : `${formatCents(service.priceRange.min)} - ${formatCents(service.priceRange.max)}`
    : "Contact for pricing";

  return (
    <Link to={`/programs/${service.programSlug}`} className="block">
      <div className="rounded-portal border border-border-subtle bg-portal-card p-6 transition-colors hover:bg-portal-card-hover hover:border-border-default">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="mb-2">
              <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-border-default text-text-secondary">
                {SERVICE_TYPE_LABELS[service.type] || service.type}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">{service.name}</h3>
            <p className="text-sm text-text-secondary mb-2">
              {service.programName} · {service.location}
            </p>
            <p className="text-[13px] text-text-tertiary line-clamp-2">
              {service.description}
            </p>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="text-right">
              <div className="text-lg text-accent font-semibold">{priceText}</div>
            </div>
            <svg
              className="w-5 h-5 text-text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ServiceRowCard({
  service,
  boosted,
}: {
  service: MockService;
  boosted?: boolean;
}) {
  const priceText = service.priceRange
    ? formatCents(service.priceRange.min)
    : "Contact";

  return (
    <Link to={`/programs/${service.programSlug}`} className="block">
      <div className="rounded-portal border border-border-subtle bg-portal-card p-4 h-full transition-colors hover:bg-portal-card-hover hover:border-border-default">
        {boosted && <BoostedBadge />}
        <div className="mb-1">
          <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium rounded bg-border-default text-text-secondary">
            {SERVICE_TYPE_LABELS[service.type] || service.type}
          </span>
        </div>
        <h4 className="text-sm font-semibold text-white mb-1 line-clamp-1">
          {service.name}
        </h4>
        <p className="text-xs text-text-tertiary mb-2 line-clamp-1">
          {service.programName}
        </p>
        <div className="text-xs text-accent font-medium">{priceText}</div>
      </div>
    </Link>
  );
}

// ============================================================================
// SHARED COMPONENTS
// ============================================================================

function SectionWrapper({
  title,
  description,
  viewAllHref,
  viewAllLabel,
  children,
}: {
  title: string;
  description: string;
  viewAllHref: string;
  viewAllLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="text-sm text-text-tertiary mt-0.5">{description}</p>
        </div>
        <Link
          to={viewAllHref}
          className="text-sm text-accent hover:text-accent-hover transition-colors flex-shrink-0"
        >
          {viewAllLabel}
        </Link>
      </div>
      {children}
    </section>
  );
}

function ComingSoonCard({
  title,
  description,
  ctaHref,
  ctaLabel,
  onEnableDemo,
}: {
  title: string;
  description: string;
  ctaHref: string;
  ctaLabel: string;
  onEnableDemo: () => void;
}) {
  return (
    <div className="rounded-portal border border-border-subtle bg-portal-card p-6 text-center">
      <h3 className="text-[15px] font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-text-tertiary mb-4 max-w-md mx-auto">{description}</p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          to={ctaHref}
          className="inline-flex items-center px-4 py-2 rounded-portal-xs bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
        >
          {ctaLabel}
        </Link>
        <button
          type="button"
          onClick={onEnableDemo}
          className="text-sm text-text-tertiary hover:text-white transition-colors"
        >
          Preview with demo data
        </button>
      </div>
    </div>
  );
}

function LoadingState({
  heroCard,
  rowCards,
}: {
  heroCard?: boolean;
  rowCards?: number;
}) {
  return (
    <>
      {heroCard && (
        <div className="rounded-portal border border-border-subtle bg-portal-card p-6 animate-pulse">
          <div className="h-5 bg-border-default rounded w-1/3 mb-3" />
          <div className="h-4 bg-border-default rounded w-1/2 mb-2" />
          <div className="h-4 bg-border-default rounded w-2/3" />
        </div>
      )}
      {rowCards && rowCards > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
          {Array.from({ length: rowCards }).map((_, i) => (
            <div
              key={i}
              className="rounded-portal border border-border-subtle bg-portal-card p-4 animate-pulse"
            >
              <div className="h-4 bg-border-default rounded w-3/4 mb-2" />
              <div className="h-3 bg-border-default rounded w-1/2 mb-2" />
              <div className="h-3 bg-border-default rounded w-1/3" />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function BoostedBadge() {
  return (
    <span className="inline-block px-1.5 py-0.5 mb-2 text-[10px] font-semibold rounded bg-amber-500/20 text-amber-400 uppercase tracking-wide">
      Boosted
    </span>
  );
}
