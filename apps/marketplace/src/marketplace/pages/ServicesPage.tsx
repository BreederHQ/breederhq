// apps/marketplace/src/marketplace/pages/ServicesPage.tsx
// Services browse page - demo mode backed
import * as React from "react";
import { Link } from "react-router-dom";
import { isDemoMode, setDemoMode } from "../../demo/demoMode";
import { getMockServices, simulateDelay, type MockService } from "../../demo/mockData";
import { formatCents } from "../../utils/format";

const SERVICE_TYPE_LABELS: Record<string, string> = {
  stud: "Stud Service",
  guardianship: "Guardianship",
  training: "Training",
  delivery: "Delivery",
  grooming: "Grooming",
  boarding: "Boarding",
};

/**
 * Services page - browse breeder services.
 * In demo mode: shows mock services.
 * In real mode: shows coming soon state.
 */
export function ServicesPage() {
  const [services, setServices] = React.useState<MockService[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<string>("all");
  const demoMode = isDemoMode();

  React.useEffect(() => {
    if (!demoMode) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      await simulateDelay(180);
      setServices(getMockServices());
      setLoading(false);
    };

    fetchData();
  }, [demoMode]);

  // Filter services by type
  const filteredServices = filter === "all"
    ? services
    : services.filter((s) => s.type === filter);

  // Get unique service types for filter
  const serviceTypes = Array.from(new Set(services.map((s) => s.type)));

  // Handle enabling demo mode
  const handleEnableDemo = () => {
    setDemoMode(true);
    window.location.reload();
  };

  // Real mode: show coming soon state
  if (!demoMode) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[28px] font-bold text-white tracking-tight leading-tight">
            Services
          </h1>
          <p className="text-sm text-text-tertiary mt-1">
            Stud services, guardianship, and breeder offerings.
          </p>
        </div>

        <div className="rounded-portal border border-border-subtle bg-portal-card p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-border-default flex items-center justify-center">
            <svg className="w-6 h-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Services browse is coming soon</h2>
          <p className="text-sm text-text-tertiary mb-6 max-w-md mx-auto">
            Services are published by breeders. Browse breeder profiles to learn about their offerings.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/breeders"
              className="inline-flex items-center px-5 py-2.5 rounded-portal-xs bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
            >
              Browse breeders
            </Link>
            <button
              type="button"
              onClick={handleEnableDemo}
              className="text-sm text-text-tertiary hover:text-white transition-colors"
            >
              Preview with demo data
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Demo mode: show services grid
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[28px] font-bold text-white tracking-tight leading-tight">
          Services
        </h1>
        <p className="text-sm text-text-tertiary mt-1">
          Stud services, guardianship, and breeder offerings.
        </p>
      </div>

      {/* Filter tabs */}
      {!loading && services.length > 0 && (
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
          {serviceTypes.map((type) => (
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
      )}

      {/* Results count */}
      <div className="text-[13px] text-text-tertiary">
        {loading ? (
          <span className="inline-block h-3.5 w-20 bg-border-default rounded animate-pulse" />
        ) : (
          `${filteredServices.length} service${filteredServices.length === 1 ? "" : "s"}`
        )}
      </div>

      {/* Services grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-portal border border-border-subtle bg-portal-card p-5 animate-pulse">
              <div className="h-4 bg-border-default rounded w-1/4 mb-3" />
              <div className="h-5 bg-border-default rounded w-3/4 mb-3" />
              <div className="h-4 bg-border-default rounded w-full mb-2" />
              <div className="h-4 bg-border-default rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="rounded-portal border border-border-subtle bg-portal-card p-8 text-center">
          <p className="text-sm text-text-tertiary">No services match your filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredServices.map((service) => (
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
function ServiceCard({ service }: { service: MockService }) {
  const priceText = service.priceRange
    ? service.priceRange.min === service.priceRange.max
      ? formatCents(service.priceRange.min)
      : `${formatCents(service.priceRange.min)} - ${formatCents(service.priceRange.max)}`
    : "Contact for pricing";

  return (
    <div className="rounded-portal border border-border-subtle bg-portal-card p-5 h-full flex flex-col">
      {/* Service type badge */}
      <div className="mb-2">
        <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-border-default text-text-secondary">
          {SERVICE_TYPE_LABELS[service.type] || service.type}
        </span>
      </div>

      {/* Service name */}
      <h3 className="text-[15px] font-semibold text-white mb-2">
        {service.name}
      </h3>

      {/* Description */}
      <p className="text-sm text-text-secondary mb-3 flex-grow">
        {service.description}
      </p>

      {/* Breeder and location */}
      <div className="text-[13px] text-text-tertiary mb-3">
        <Link
          to={`/programs/${service.programSlug}`}
          className="text-accent hover:text-accent-hover transition-colors"
        >
          {service.programName}
        </Link>
        <span className="mx-1">·</span>
        <span>{service.location}</span>
      </div>

      {/* Price and CTA */}
      <div className="pt-3 border-t border-border-subtle flex items-center justify-between">
        <span className="text-[15px] text-accent font-semibold">{priceText}</span>
        <Link
          to={`/programs/${service.programSlug}`}
          className="text-[13px] text-text-secondary hover:text-white transition-colors"
        >
          View breeder
        </Link>
      </div>
    </div>
  );
}
