// apps/marketplace/src/marketplace/pages/HomePage.tsx
// Marketplace home page - Landing page with hero, categories, featured content
// Per design spec: Hero + Search, Category Tiles, Featured Programs, Trust Section
// For sellers: Shows SellerHomePage with management dashboard

import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getPrograms,
  getPublicOffspringGroups,
  getPublicServices,
  getBreederAnimalListings,
  getBreederOffspringGroups,
  getBreederServices,
  getBreederInquiries,
} from "../../api/client";
import { formatCents } from "../../utils/format";
import { useIsSeller, useTenantId } from "../../gate/MarketplaceGate";

// ============================================================================
// ICONS
// ============================================================================

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
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

function StarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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

// Category-specific icons
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
      <path d="M12 18v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9.5 21h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CatIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 5c-1.5 0-2.5 1-3.5 2S7 9 7 11c0 3.5 2.239 6 5 6s5-2.5 5-6c0-2-.5-3-1.5-4s-2-2-3.5-2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M7 11l-2-7M17 11l2-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 13h.01M14 13h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 14v1.5M10.5 15.5l3 .5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 17v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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
      <path d="M12 14v1M10 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 19v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PawIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <ellipse cx="12" cy="16" rx="4" ry="3" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="7" cy="10" rx="2" ry="2.5" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="17" cy="10" rx="2" ry="2.5" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="10" cy="6" rx="1.5" ry="2" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="14" cy="6" rx="1.5" ry="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

// Bold filled paw for hero cards - clean version
function PawFilledIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      {/* Main pad */}
      <path d="M12 13c-2.5 0-5.5 2-5.5 5 0 2 2 4 5.5 4s5.5-2 5.5-4c0-3-3-5-5.5-5z" />
      {/* Top left toe */}
      <ellipse cx="6.5" cy="9" rx="2.5" ry="3" />
      {/* Top right toe */}
      <ellipse cx="17.5" cy="9" rx="2.5" ry="3" />
      {/* Inner left toe */}
      <ellipse cx="9.5" cy="5" rx="2" ry="2.5" />
      {/* Inner right toe */}
      <ellipse cx="14.5" cy="5" rx="2" ry="2.5" />
    </svg>
  );
}

// ============================================================================
// ICONS FOR PRIMARY CATEGORIES
// ============================================================================

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

// ============================================================================
// HERO SECTION
// ============================================================================

function HeroSection() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/animals?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <section className="relative pt-6 pb-8 md:pt-8 md:pb-10">
      <div className="text-center max-w-4xl mx-auto px-4">
        {/* Clean headline - no corporate buzzwords */}
        <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight mb-4">
          Animals. Breeders. Services.
        </h1>
        <p className="text-lg text-text-secondary mb-8 max-w-2xl mx-auto">
          Where Breeders and Buyers Connect
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-10">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search breeds, breeders, or services..."
              className="w-full h-14 pl-12 pr-4 rounded-xl border border-border-subtle bg-portal-card text-white text-base placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))]/50 focus:border-[hsl(var(--brand-orange))]"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 rounded-lg bg-[hsl(var(--brand-blue))] text-white text-sm font-medium hover:bg-[hsl(var(--brand-blue))]/90 transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {/* PRIMARY CATEGORY CARDS - Animals, Breeders, Services */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Animals Card */}
          <div className="rounded-2xl border border-border-subtle bg-portal-card p-8 h-full flex flex-col transition-all hover:bg-portal-card-hover hover:border-[hsl(var(--brand-blue))]/40 hover:-translate-y-1 hover:shadow-xl group">
            <div className="w-16 h-16 rounded-2xl bg-[#f27517] flex items-center justify-center mb-5 mx-auto">
              <PawFilledIcon className="h-9 w-9 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 text-center">Animals</h3>
            <p className="text-sm text-text-tertiary mb-5 text-center flex-grow">
              Browse Animals from Breeding Programs
            </p>
            <Link
              to="/animals"
              className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-[#005dc3] text-sm font-medium text-white hover:bg-[#005dc3]/80 transition-colors mt-auto"
            >
              Browse Animals
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>

          {/* Breeders Card */}
          <div className="rounded-2xl border border-border-subtle bg-portal-card p-8 h-full flex flex-col transition-all hover:bg-portal-card-hover hover:border-[hsl(var(--brand-blue))]/40 hover:-translate-y-1 hover:shadow-xl group">
            <div className="w-16 h-16 rounded-2xl bg-[#f27517] flex items-center justify-center mb-5 mx-auto">
              <ShieldCheckIcon className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 text-center">Breeders</h3>
            <p className="text-sm text-text-tertiary mb-5 text-center flex-grow">
              Find the Right Breeder for You
            </p>
            <Link
              to="/breeders"
              className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-[#005dc3] text-sm font-medium text-white hover:bg-[#005dc3]/80 transition-colors mt-auto"
            >
              Find Breeders
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>

          {/* Services Card */}
          <div className="rounded-2xl border border-border-subtle bg-portal-card p-8 h-full flex flex-col transition-all hover:bg-portal-card-hover hover:border-[hsl(var(--brand-blue))]/40 hover:-translate-y-1 hover:shadow-xl group">
            <div className="w-16 h-16 rounded-2xl bg-[#f27517] flex items-center justify-center mb-5 mx-auto">
              <BriefcaseIcon className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 text-center">Services</h3>
            <p className="text-sm text-text-tertiary mb-5 text-center flex-grow">
              Explore Animal-Related Service Providers
            </p>
            <Link
              to="/services"
              className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-[#005dc3] text-sm font-medium text-white hover:bg-[#005dc3]/80 transition-colors mt-auto"
            >
              Explore Services
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// CATEGORY TILES
// ============================================================================

interface CategoryTileProps {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  count?: number;
}

function CategoryTile({ title, description, href, icon, count }: CategoryTileProps) {
  return (
    <Link to={href} className="block group">
      <div className="relative rounded-xl border border-border-subtle bg-portal-card p-6 h-full transition-all hover:bg-portal-card-hover hover:border-border-default hover:-translate-y-0.5 hover:shadow-lg">
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-[hsl(var(--brand-orange))]/10 flex items-center justify-center mb-4 group-hover:bg-[hsl(var(--brand-orange))]/20 transition-colors">
          <div className="text-[hsl(var(--brand-orange))]">{icon}</div>
        </div>

        {/* Content */}
        <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-[hsl(var(--brand-orange))] transition-colors">
          {title}
        </h3>
        <p className="text-sm text-text-tertiary mb-3">{description}</p>

        {/* Count badge */}
        {count !== undefined && count > 0 && (
          <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-border-default text-text-secondary">
            {count}+ available
          </span>
        )}

        {/* Arrow */}
        <ChevronRightIcon className="absolute top-6 right-6 h-5 w-5 text-text-tertiary group-hover:text-[hsl(var(--brand-orange))] transition-colors" />
      </div>
    </Link>
  );
}

function CategorySection() {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Browse by Category</h2>
        <Link
          to="/animals"
          className="text-sm text-text-secondary hover:text-white transition-colors flex items-center gap-1"
        >
          View all
          <ChevronRightIcon className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <CategoryTile
          title="Dogs"
          description="Puppies & adult dogs"
          href="/animals?species=dog"
          icon={<DogIcon className="h-6 w-6" />}
        />
        <CategoryTile
          title="Cats"
          description="Kittens & adult cats"
          href="/animals?species=cat"
          icon={<CatIcon className="h-6 w-6" />}
        />
        <CategoryTile
          title="Horses"
          description="Foals & horses"
          href="/animals?species=horse"
          icon={<HorseIcon className="h-6 w-6" />}
        />
        <CategoryTile
          title="Rabbits"
          description="Bunnies & rabbits"
          href="/animals?species=rabbit"
          icon={<RabbitIcon className="h-6 w-6" />}
        />
        <CategoryTile
          title="Other Animals"
          description="Goats, sheep & more"
          href="/animals"
          icon={<PawIcon className="h-6 w-6" />}
        />
      </div>
    </section>
  );
}

// ============================================================================
// FEATURED LISTINGS
// ============================================================================

interface FeaturedItem {
  id: string;
  type: "animal" | "breeder" | "service";
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
        {/* Image placeholder */}
        <div className="aspect-[4/3] bg-gradient-to-br from-border-default to-border-subtle flex items-center justify-center">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <PawIcon className="h-12 w-12 text-text-tertiary/50" />
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
          type: "animal" as const,
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

  if (!loading && listings.length === 0) return null;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
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
// BREEDER CARD - Individual breeder display with verified badge
// ============================================================================

interface BreederCardData {
  id: string;
  name: string;
  slug: string;
  species: string[];
  breed: string | null;
  location: string | null;
  imageUrl: string | null;
  isVerified: boolean;
}

function BreederCard({ breeder }: { breeder: BreederCardData }) {
  const speciesDisplay = breeder.species.length > 0
    ? breeder.species.map(s => s.charAt(0) + s.slice(1).toLowerCase()).join(", ")
    : null;

  const subtitle = [breeder.breed, breeder.location].filter(Boolean).join(" · ") || speciesDisplay || "Breeder";

  return (
    <Link to={`/programs/${breeder.slug}`} className="block group">
      <div className="rounded-xl border border-border-subtle bg-portal-card overflow-hidden h-full transition-all hover:border-border-default hover:shadow-lg hover:-translate-y-0.5">
        {/* Header with avatar/image */}
        <div className="relative h-24 bg-gradient-to-br from-[hsl(var(--brand-orange))]/20 to-[hsl(var(--brand-orange))]/5">
          {/* Avatar */}
          <div className="absolute -bottom-6 left-4">
            <div className="h-14 w-14 rounded-full border-2 border-portal-card bg-portal-card flex items-center justify-center overflow-hidden">
              {breeder.imageUrl ? (
                <img src={breeder.imageUrl} alt={breeder.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-[hsl(var(--brand-orange))]">
                  {breeder.name[0]}
                </span>
              )}
            </div>
          </div>
          {/* Verified badge */}
          {breeder.isVerified && (
            <div className="absolute top-2 right-2">
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                <ShieldCheckIcon className="h-3 w-3" />
                Verified
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="pt-8 pb-4 px-4">
          <h3 className="font-semibold text-white mb-1 line-clamp-1 group-hover:text-[hsl(var(--brand-orange))] transition-colors">
            {breeder.name}
          </h3>
          <p className="text-sm text-text-tertiary line-clamp-1">{subtitle}</p>
        </div>
      </div>
    </Link>
  );
}

function RecentBreedersSection() {
  const [breeders, setBreeders] = React.useState<BreederCardData[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let dead = false;

    async function fetchBreeders() {
      try {
        const result = await getPrograms({ limit: 4 });
        if (dead) return;

        const items: BreederCardData[] = (result.items || []).map((b, idx) => ({
          id: `${b.slug}-${idx}`,
          name: b.name,
          slug: b.slug,
          species: Array.isArray(b.species) ? b.species : (b.species ? [b.species] : []),
          breed: b.breed || null,
          location: b.location || null,
          imageUrl: b.photoUrl || null,
          isVerified: true, // All breeders on platform are verified
        }));

        setBreeders(items);
      } catch (err) {
        console.error("Failed to fetch breeders:", err);
      } finally {
        if (!dead) setLoading(false);
      }
    }

    fetchBreeders();
    return () => { dead = true; };
  }, []);

  if (!loading && breeders.length === 0) return null;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Breeders</h2>
        <Link
          to="/breeders"
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
              <div className="h-24 bg-border-default" />
              <div className="p-4 pt-8">
                <div className="h-4 bg-border-default rounded w-3/4 mb-2" />
                <div className="h-3 bg-border-default rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {breeders.map((breeder) => (
            <BreederCard key={breeder.id} breeder={breeder} />
          ))}
        </div>
      )}
    </section>
  );
}

// ============================================================================
// TRUST SECTION - What BreederHQ actually offers (no BS)
// ============================================================================

function TrustSection() {
  return (
    <div className="space-y-6">
      {/* BREEDERS CARD - Text left, icons right */}
      <section className="rounded-2xl bg-gradient-to-br from-portal-card to-portal-card-hover border border-border-subtle p-8 md:p-10">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left: Value statement */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Not a classified ad. A breeding program.
            </h2>
            <p className="text-text-secondary mb-6 leading-relaxed">
              BreederHQ breeders use our platform to manage their entire program - animals, health records, pedigrees, litters. What you see here is their real operation, not a one-off listing.
            </p>
            <Link
              to="/breeders"
              className="inline-flex items-center gap-2 text-[hsl(var(--brand-orange))] font-medium hover:underline"
            >
              Browse breeders
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>

          {/* Right: What's actually different */}
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                <PawIcon className="h-5 w-5 text-white/60" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Full Program Visibility</h3>
                <p className="text-sm text-text-tertiary">
                  See their animals, breeding history, health testing, and past litters - not just one listing.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                <MessageCircleIcon className="h-5 w-5 text-white/60" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Direct Connection</h3>
                <p className="text-sm text-text-tertiary">
                  Message breeders directly. Ask questions, request more info, schedule visits.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                <StarIcon className="h-5 w-5 text-white/60" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Established Programs</h3>
                <p className="text-sm text-text-tertiary">
                  Breeders actively managing their animals, health records, and breeding plans on our platform.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES CARD - Icons left, text right (flipped layout) */}
      <section className="rounded-2xl bg-gradient-to-br from-portal-card to-portal-card-hover border border-border-subtle p-8 md:p-10">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left: Service features */}
          <div className="space-y-4 md:order-1">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                <BriefcaseIcon className="h-5 w-5 text-white/60" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Professional Services</h3>
                <p className="text-sm text-text-tertiary">
                  Training, grooming, transport, photography, and more from verified providers.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                <ShieldCheckIcon className="h-5 w-5 text-white/60" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Vetted Providers</h3>
                <p className="text-sm text-text-tertiary">
                  Service providers connected to the breeding community, not random listings.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                <MessageCircleIcon className="h-5 w-5 text-white/60" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Direct Booking</h3>
                <p className="text-sm text-text-tertiary">
                  Contact providers directly to discuss your needs and schedule services.
                </p>
              </div>
            </div>
          </div>

          {/* Right: Value statement */}
          <div className="md:order-2 md:text-right">
            <h2 className="text-2xl font-bold text-white mb-4">
              Services for breeders and buyers.
            </h2>
            <p className="text-text-secondary mb-6 leading-relaxed">
              Find professional services to support your animals - from training and grooming to transport and health testing. All from providers who understand the breeding community.
            </p>
            <Link
              to="/services"
              className="inline-flex items-center gap-2 text-[hsl(var(--brand-orange))] font-medium hover:underline md:justify-end"
            >
              Browse services
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

// ============================================================================
// SERVICES SECTION - Simple list of recent services
// ============================================================================

function ServicesSection() {
  const [services, setServices] = React.useState<FeaturedItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let dead = false;

    async function fetchServices() {
      try {
        const result = await getPublicServices({ limit: 4 });
        if (dead) return;

        const items: FeaturedItem[] = (result.items || []).map((s) => ({
          id: String(s.id),
          type: "service" as const,
          title: s.title,
          subtitle: s.provider?.name || "Service Provider",
          href: s.provider?.slug ? `/breeders/${s.provider.slug}` : "/services",
          price: s.priceCents ? formatCents(s.priceCents) : null,
        }));

        setServices(items);
      } catch (err) {
        console.error("Failed to fetch services:", err);
      } finally {
        if (!dead) setLoading(false);
      }
    }

    fetchServices();
    return () => { dead = true; };
  }, []);

  // Don't show section if no services
  if (!loading && services.length === 0) return null;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Recent Services</h2>
        <Link
          to="/services"
          className="text-sm text-text-secondary hover:text-white transition-colors flex items-center gap-1"
        >
          View all
          <ChevronRightIcon className="h-4 w-4" />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-border-subtle bg-portal-card p-5 animate-pulse">
              <div className="h-4 bg-border-default rounded w-3/4 mb-2" />
              <div className="h-3 bg-border-default rounded w-1/2 mb-3" />
              <div className="h-3 bg-border-default rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {services.map((service) => (
            <Link key={service.id} to={service.href} className="block group">
              <div className="rounded-xl border border-border-subtle bg-portal-card p-5 h-full transition-all hover:bg-portal-card-hover hover:border-border-default hover:-translate-y-0.5 hover:shadow-lg">
                <h3 className="font-semibold text-white mb-1 line-clamp-1 group-hover:text-[hsl(var(--brand-orange))] transition-colors">
                  {service.title}
                </h3>
                <p className="text-sm text-text-tertiary line-clamp-1 mb-2">{service.subtitle}</p>
                {service.price && (
                  <p className="text-sm font-medium text-[hsl(var(--brand-orange))]">{service.price}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

// ============================================================================
// CTA SECTION - Unified message for suppliers (breeders + service providers)
// ============================================================================

function CTASection() {
  return (
    <section className="rounded-2xl border border-[hsl(var(--brand-blue))]/30 bg-[hsl(var(--brand-blue))]/5 p-8 md:p-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="max-w-xl">
          <h2 className="text-xl font-bold text-white mb-2">
            Join the BreederHQ Marketplace
          </h2>
          <p className="text-text-secondary">
            List your breeding program, animals, or professional services. Reach qualified buyers actively searching for what you offer.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="https://breederhq.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-[hsl(var(--brand-orange))]/60 bg-transparent text-white font-medium hover:bg-[hsl(var(--brand-orange))]/30 hover:border-[hsl(var(--brand-orange))] transition-colors min-w-[160px]"
          >
            List as Breeder
            <ArrowRightIcon className="h-4 w-4" />
          </a>
          <Link
            to="/provider"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-[hsl(var(--brand-orange))]/60 bg-transparent text-white font-medium hover:bg-[hsl(var(--brand-orange))]/30 hover:border-[hsl(var(--brand-orange))] transition-colors min-w-[160px]"
          >
            List Services
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

// ============================================================================
// SELLER HOME PAGE - Dashboard for breeders accessing via platform portal
// ============================================================================

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
      <path
        d="M22 12h-6l-2 3h-4l-2-3H2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LayersIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface SellerStats {
  totalAnimals: number;
  totalOffspring: number;
  totalServices: number;
  pendingInquiries: number;
}

function SellerHomePage() {
  const tenantId = useTenantId();
  const navigate = useNavigate();
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
        // Set zeros on error so UI still renders
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
              <h2 className="text-xl font-bold text-white mb-1">Manage Your Storefront and Breeding Program Listings</h2>
              <p className="text-text-secondary">
                Set up your business profile, location, credentials, and breeding programs
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
                Manage Animals
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
                Manage Services
              </h3>
              <p className="text-sm text-text-tertiary">
                Offer stud services, training, grooming, or other professional services
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

export function HomePage() {
  const isSeller = useIsSeller();

  // Sellers get a completely different home page focused on management
  if (isSeller) {
    return <SellerHomePage />;
  }

  // Buyers get the standard marketplace browsing experience
  return (
    <div className="space-y-8 pb-0">
      {/* Hero with search and primary category cards (Animals, Breeders, Services) */}
      <HeroSection />

      {/* Recent Listings - the actual inventory buyers are here for */}
      <RecentListingsSection />

      {/* Trust section - why buy here vs elsewhere */}
      <TrustSection />

      {/* Supplier CTA - unified breeder + service provider recruitment */}
      <CTASection />
    </div>
  );
}

export default HomePage;
