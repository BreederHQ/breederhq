// apps/marketplace/src/marketplace/pages/ServicesPage.tsx
// Services browse page - wired to real API with enhanced ServiceCard design
import * as React from "react";
import { Link } from "react-router-dom";
import {
  getPublicServices,
  type PublicServiceListing,
  type ServiceListingType,
} from "../../api/client";
import { formatCents } from "../../utils/format";
import { VerificationBadge } from "../components/VerificationBadge";
import { Breadcrumb } from "../components/Breadcrumb";

// ============================================================================
// Constants
// ============================================================================

const SERVICE_TYPE_LABELS: Record<string, string> = {
  STUD_SERVICE: "Stud Service",
  TRAINING: "Training",
  VETERINARY: "Veterinary",
  PHOTOGRAPHY: "Photography",
  GROOMING: "Grooming",
  TRANSPORT: "Transport",
  BOARDING: "Boarding",
  PRODUCT: "Product",
  OTHER_SERVICE: "Other",
};

const SERVICE_TYPES: ServiceListingType[] = [
  "STUD_SERVICE",
  "TRAINING",
  "VETERINARY",
  "PHOTOGRAPHY",
  "GROOMING",
  "TRANSPORT",
  "BOARDING",
  "PRODUCT",
  "OTHER_SERVICE",
];

// ============================================================================
// Icons
// ============================================================================

function StarIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.5}>
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function ImagePlaceholderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

// ============================================================================
// Components
// ============================================================================

/**
 * Rating display with stars
 */
function RatingDisplay({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      <StarIcon className="h-4 w-4 text-amber-400" filled />
      <span className="text-sm font-medium text-white">{rating.toFixed(1)}</span>
      <span className="text-sm text-text-tertiary">({count})</span>
    </div>
  );
}

/**
 * Skeleton loader for ServiceCard
 */
function ServiceCardSkeleton() {
  return (
    <div className="rounded-xl border border-border-subtle bg-portal-card overflow-hidden animate-pulse">
      {/* Image placeholder */}
      <div className="aspect-[4/3] bg-border-default" />
      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-5 w-20 bg-border-default rounded-full" />
          <div className="h-4 w-16 bg-border-default rounded" />
        </div>
        <div className="h-5 bg-border-default rounded w-3/4" />
        <div className="h-4 bg-border-default rounded w-full" />
        <div className="h-4 bg-border-default rounded w-2/3" />
        <div className="pt-3 flex items-center justify-between">
          <div className="h-5 w-16 bg-border-default rounded" />
          <div className="h-4 w-24 bg-border-default rounded" />
        </div>
      </div>
    </div>
  );
}

/**
 * Service card component with image, rating, and enhanced styling.
 */
function ServiceCard({ service }: { service: PublicServiceListing }) {
  // Format price display
  let priceText = "Contact for pricing";
  if (service.priceCents != null) {
    priceText = formatCents(service.priceCents);
    if (service.priceType === "starting_at") {
      priceText = `From ${priceText}`;
    }
  }

  // Build location string
  const location = [service.city, service.state].filter(Boolean).join(", ");

  // Determine link to provider
  const providerLink =
    service.provider?.type === "breeder" && service.provider.slug
      ? `/breeders/${service.provider.slug}`
      : null;

  // Get first image or use placeholder
  const imageUrl = service.images?.[0] ?? null;

  // Mock rating data (will be populated when backend supports it)
  const mockRating = 4.8;
  const mockReviewCount = 24;
  const hasRating = false; // Set to true when rating data is available

  return (
    <div className="group rounded-xl border border-border-subtle bg-portal-card overflow-hidden h-full flex flex-col transition-all hover:bg-portal-card-hover hover:border-border-default hover:-translate-y-0.5 hover:shadow-lg">
      {/* Image area */}
      <div className="relative aspect-[4/3] bg-border-default overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={service.title}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImagePlaceholderIcon className="w-12 h-12 text-text-tertiary" />
          </div>
        )}
        {/* Category badge overlay */}
        <div className="absolute top-3 left-3">
          <span className="inline-block px-2.5 py-1 text-xs font-medium rounded-full bg-portal-bg/80 backdrop-blur-sm text-white border border-white/10">
            {SERVICE_TYPE_LABELS[service.listingType] || service.listingType}
          </span>
        </div>
      </div>

      {/* Content area */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Header row with rating */}
        <div className="flex items-center justify-between mb-2">
          {hasRating && <RatingDisplay rating={mockRating} count={mockReviewCount} />}
          {!hasRating && <div />}
        </div>

        {/* Service title */}
        <h3 className="text-[15px] font-semibold text-white mb-1 group-hover:text-[hsl(var(--brand-orange))] transition-colors line-clamp-2">
          {service.title}
        </h3>

        {/* Description */}
        {service.description && (
          <p className="text-sm text-text-secondary mb-3 flex-grow line-clamp-2">
            {service.description}
          </p>
        )}

        {/* Provider and location */}
        <div className="text-[13px] text-text-tertiary mb-3">
          {service.provider && (
            <div className="font-medium text-text-secondary">
              {service.provider.name}
            </div>
          )}
          {location && <div>{location}</div>}
        </div>

        {/* Price and CTA */}
        <div className="pt-3 border-t border-border-subtle flex items-center justify-between mt-auto">
          <span className="text-[15px] text-[hsl(var(--brand-orange))] font-semibold">
            {priceText}
          </span>
          {providerLink && (
            <Link
              to={providerLink}
              className="text-[13px] text-text-secondary hover:text-white transition-colors"
            >
              View provider
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Empty state component
 */
function EmptyState({ filter }: { filter: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-border-default flex items-center justify-center mb-4">
        <BriefcaseIcon className="w-8 h-8 text-text-tertiary" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">
        No services available yet
      </h3>
      <p className="text-text-tertiary max-w-sm mb-6">
        {filter === "all"
          ? "No services have been published yet. Check back later or browse breeders to see their offerings."
          : `No ${SERVICE_TYPE_LABELS[filter] || filter} services found. Try a different filter.`}
      </p>
      <Link
        to="/breeders"
        className="px-4 py-2 text-sm bg-[hsl(var(--brand-orange))] text-white rounded-lg hover:bg-[hsl(var(--brand-orange))]/90 transition-colors"
      >
        Browse Breeders
      </Link>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Services page - browse published services from breeders and service providers.
 */
export function ServicesPage() {
  const [services, setServices] = React.useState<PublicServiceListing[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<string>("all");
  const [total, setTotal] = React.useState(0);

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = filter === "all" ? {} : { type: filter };
        const response = await getPublicServices(params);
        setServices(response.items);
        setTotal(response.total);
      } catch (err: any) {
        console.error("Failed to fetch services:", err);
        setError(err.message || "Failed to load services");
        setServices([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filter]);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Services" },
        ]}
      />

      {/* Page header */}
      <div>
        <h1 className="text-[28px] font-bold text-white tracking-tight">
          Services
        </h1>
        <p className="text-text-secondary mt-1">
          Stud services, training, grooming, and other breeder offerings
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            filter === "all"
              ? "bg-[hsl(var(--brand-orange))]/10 text-[hsl(var(--brand-orange))] border border-[hsl(var(--brand-orange))]/30"
              : "text-text-secondary hover:text-white hover:bg-portal-card-hover border border-transparent"
          }`}
        >
          All
        </button>
        {SERVICE_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setFilter(type)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              filter === type
                ? "bg-[hsl(var(--brand-orange))]/10 text-[hsl(var(--brand-orange))] border border-[hsl(var(--brand-orange))]/30"
                : "text-text-secondary hover:text-white hover:bg-portal-card-hover border border-transparent"
            }`}
          >
            {SERVICE_TYPE_LABELS[type] || type}
          </button>
        ))}
      </div>

      {/* Results count */}
      {!loading && !error && (
        <p className="text-sm text-text-tertiary">
          {total} service{total === 1 ? "" : "s"}
          {filter !== "all" && " found"}
        </p>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Services grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ServiceCardSkeleton key={i} />
          ))}
        </div>
      ) : services.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}
    </div>
  );
}

export default ServicesPage;
