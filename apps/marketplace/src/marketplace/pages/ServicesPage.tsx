// apps/marketplace/src/marketplace/pages/ServicesPage.tsx
// Services browse page - wired to real API
import * as React from "react";
import { Link } from "react-router-dom";
import {
  getPublicServices,
  type PublicServiceListing,
  type ServiceListingType,
} from "../../api/client";
import { formatCents } from "../../utils/format";

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

  // Get available types from current services for showing filter counts
  const availableTypes = React.useMemo(() => {
    const types = new Set(services.map((s) => s.listingType));
    return SERVICE_TYPES.filter((t) => types.has(t));
  }, [services]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[28px] font-bold text-white tracking-tight leading-tight">
          Services
        </h1>
        <p className="text-sm text-text-tertiary mt-1">
          Stud services, training, grooming, and other breeder offerings.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 text-sm font-medium rounded-portal-xs transition-colors ${
            filter === "all"
              ? "bg-border-default text-white"
              : "text-text-secondary hover:text-white hover:bg-portal-card-hover"
          }`}
        >
          All
        </button>
        {SERVICE_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setFilter(type)}
            className={`px-3 py-1.5 text-sm font-medium rounded-portal-xs transition-colors ${
              filter === type
                ? "bg-border-default text-white"
                : "text-text-secondary hover:text-white hover:bg-portal-card-hover"
            }`}
          >
            {SERVICE_TYPE_LABELS[type] || type}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div className="text-[13px] text-text-tertiary">
        {loading ? (
          <span className="inline-block h-3.5 w-20 bg-border-default rounded animate-pulse" />
        ) : (
          `${total} service${total === 1 ? "" : "s"}`
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-portal border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Services grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-portal border border-border-subtle bg-portal-card p-5 animate-pulse"
            >
              <div className="h-4 bg-border-default rounded w-1/4 mb-3" />
              <div className="h-5 bg-border-default rounded w-3/4 mb-3" />
              <div className="h-4 bg-border-default rounded w-full mb-2" />
              <div className="h-4 bg-border-default rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="rounded-portal border border-border-subtle bg-portal-card p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-border-default flex items-center justify-center">
            <svg
              className="w-6 h-6 text-text-muted"
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
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">
            No services available yet
          </h2>
          <p className="text-sm text-text-tertiary mb-6 max-w-md mx-auto">
            {filter === "all"
              ? "No services have been published yet. Check back later or browse breeders to see their offerings."
              : `No ${SERVICE_TYPE_LABELS[filter] || filter} services found. Try a different filter.`}
          </p>
          <Link
            to="/breeders"
            className="inline-flex items-center px-5 py-2.5 rounded-portal-xs bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
          >
            Browse breeders
          </Link>
        </div>
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

/**
 * Service card component.
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

  return (
    <div className="rounded-portal border border-border-subtle bg-portal-card p-5 h-full flex flex-col">
      {/* Type badge */}
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-border-default text-text-secondary">
          {SERVICE_TYPE_LABELS[service.listingType] || service.listingType}
        </span>
      </div>

      {/* Service title */}
      <h3 className="text-[15px] font-semibold text-white mb-2">
        {service.title}
      </h3>

      {/* Description */}
      {service.description && (
        <p className="text-sm text-text-secondary mb-3 flex-grow line-clamp-3">
          {service.description}
        </p>
      )}

      {/* Provider and location */}
      <div className="text-[13px] text-text-tertiary mb-3">
        {service.provider && (
          <>
            {providerLink ? (
              <Link
                to={providerLink}
                className="text-accent hover:text-accent-hover transition-colors"
              >
                {service.provider.name}
              </Link>
            ) : (
              <span>{service.provider.name}</span>
            )}
            {location && <span className="mx-1">·</span>}
          </>
        )}
        {location && <span>{location}</span>}
      </div>

      {/* Price and CTA */}
      <div className="pt-3 border-t border-border-subtle flex items-center justify-between">
        <span className="text-[15px] text-accent font-semibold">{priceText}</span>
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
  );
}
