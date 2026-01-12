// apps/marketplace/src/marketplace/pages/HomePage.tsx
// Marketplace home page - Intent router with featured section
import * as React from "react";
import { Link } from "react-router-dom";
import { ManageListingDrawer } from "../../management/components/ManageListingDrawer";
import {
  getPrograms,
  getPublicOffspringGroups,
  getPublicServices,
} from "../../api/client";
import { formatCents } from "../../utils/format";

type FeaturedCategory = "animals" | "breeders" | "services";

/**
 * Marketplace home page - Intent router.
 * Section A: Three intent cards (Animals, Breeders, Services)
 * Section B: Featured items (rotates category based on what's available)
 */
export function HomePage() {
  // Rotate featured category on each page load
  const [featuredCategory] = React.useState<FeaturedCategory>(() => {
    const categories: FeaturedCategory[] = ["animals", "breeders", "services"];
    return categories[Math.floor(Math.random() * categories.length)];
  });

  // Check if user is a breeder (has tenant ID)
  const isBreeder = React.useMemo(() => {
    try {
      const w: any = typeof window !== "undefined" ? window : {};
      return !!(w.__BHQ_TENANT_ID__ || localStorage.getItem("BHQ_TENANT_ID"));
    } catch {
      return false;
    }
  }, []);

  // Manage listing drawer state
  const [manageDrawerOpen, setManageDrawerOpen] = React.useState(false);

  return (
    <div className="space-y-16">
      {/* Breeder Management Button */}
      {isBreeder && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setManageDrawerOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[hsl(var(--brand-orange))] text-white font-medium hover:bg-[hsl(var(--brand-orange))]/90 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Manage My Listing
          </button>
        </div>
      )}

      {/* Manage Listing Drawer */}
      <ManageListingDrawer
        open={manageDrawerOpen}
        onClose={() => setManageDrawerOpen(false)}
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
      <FeaturedSection category={featuredCategory} />
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

function FeaturedSection({ category }: { category: FeaturedCategory }) {
  const [items, setItems] = React.useState<FeaturedItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [hasItems, setHasItems] = React.useState(false);

  React.useEffect(() => {
    let dead = false;

    const fetchData = async () => {
      setLoading(true);

      let featured: FeaturedItem[] = [];

      try {
        if (category === "animals") {
          const result = await getPublicOffspringGroups({ limit: 4 });
          featured = (result.items || []).map((l) => ({
            id: String(l.id),
            type: "animal" as const,
            title: l.title || `${l.breed || l.species} Offspring`,
            subtitle: l.breed || l.species || "Animal",
            href:
              l.breeder?.slug && l.listingSlug
                ? `/programs/${l.breeder.slug}/offspring-groups/${l.listingSlug}`
                : "/animals",
            price: l.priceMinCents ? formatCents(l.priceMinCents) : null,
          }));
        } else if (category === "breeders") {
          const result = await getPrograms({ limit: 4 });
          featured = (result.items || []).map((b) => {
            const parts = [b.breed, b.location].filter((x): x is string => !!x);
            const speciesStr = Array.isArray(b.species) ? b.species.join(", ") : (b.species || "");
            return {
              id: b.slug,
              type: "breeder" as const,
              title: b.name,
              subtitle: parts.length > 0 ? parts.join(" · ") : (speciesStr || "Breeder"),
              href: `/programs/${b.slug}`,
              price: null,
            };
          });
        } else {
          const result = await getPublicServices({ limit: 4 });
          featured = (result.items || []).map((s) => ({
            id: String(s.id),
            type: "service" as const,
            title: s.title,
            subtitle: s.provider?.name || "Service Provider",
            href: s.provider?.slug ? `/breeders/${s.provider.slug}` : "/services",
            price: s.priceCents ? formatCents(s.priceCents) : null,
          }));
        }
      } catch (err) {
        console.error("Failed to fetch featured items:", err);
        featured = [];
      }

      if (!dead) {
        setItems(featured);
        setHasItems(featured.length > 0);
        setLoading(false);
      }
    };

    fetchData();
    return () => {
      dead = true;
    };
  }, [category]);

  // No items to show - hide the section entirely
  if (!loading && !hasItems) {
    return null;
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
