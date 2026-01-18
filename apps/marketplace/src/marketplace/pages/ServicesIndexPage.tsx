// apps/marketplace/src/marketplace/pages/ServicesIndexPage.tsx
// Services browse/index page - updated to match Animals/Breeders layout pattern
// Two-column layout with sidebar filter panel, search bar, grid/list toggle

import * as React from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  getPublicServices,
  type PublicServiceListing,
  type ServiceListingType,
  ApiError,
} from "../../api/client";
import { formatCents } from "../../utils/format";
import { VerificationBadge } from "../components/VerificationBadge";
import { Breadcrumb } from "../components/Breadcrumb";
import { useGateStatus } from "../../gate/MarketplaceGate";
import { DefaultCoverImage } from "../../shared/DefaultCoverImage";
import { updateSEO } from "../../utils/seo";
import { useMarketplaceTheme } from "../../context/MarketplaceThemeContext";

// =============================================================================
// Types
// =============================================================================

interface Filters {
  search: string;
  category: string;
  species: string;
  breed: string;
  location: string;
  priceMin: string;
  priceMax: string;
  sort: string;
}

type DisplayMode = "grid" | "list";

// =============================================================================
// Constants
// =============================================================================

const PAGE_SIZE = 24;

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

const CATEGORY_OPTIONS = [
  { value: "", label: "All Categories" },
  { value: "STUD_SERVICE", label: "Stud Service" },
  { value: "TRAINING", label: "Training" },
  { value: "VETERINARY", label: "Veterinary" },
  { value: "PHOTOGRAPHY", label: "Photography" },
  { value: "GROOMING", label: "Grooming" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "BOARDING", label: "Boarding" },
  { value: "PRODUCT", label: "Product" },
  { value: "OTHER_SERVICE", label: "Other" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A-Z" },
  { value: "name-desc", label: "Name: Z-A" },
  { value: "provider-asc", label: "Provider: A-Z" },
  { value: "provider-desc", label: "Provider: Z-A" },
  { value: "location-asc", label: "Location: A-Z" },
  { value: "location-desc", label: "Location: Z-A" },
];

const SPECIES_OPTIONS = [
  { value: "", label: "All Species" },
  { value: "dog", label: "Dogs" },
  { value: "cat", label: "Cats" },
  { value: "horse", label: "Horses" },
  { value: "rabbit", label: "Rabbits" },
  { value: "goat", label: "Goats" },
  { value: "sheep", label: "Sheep" },
];

// Popular breeds by species - for the breed filter dropdown
const BREED_OPTIONS: Record<string, { value: string; label: string }[]> = {
  dog: [
    { value: "", label: "All Breeds" },
    { value: "german-shepherd", label: "German Shepherd" },
    { value: "golden-retriever", label: "Golden Retriever" },
    { value: "labrador-retriever", label: "Labrador Retriever" },
    { value: "french-bulldog", label: "French Bulldog" },
    { value: "bulldog", label: "Bulldog" },
    { value: "poodle", label: "Poodle" },
    { value: "beagle", label: "Beagle" },
    { value: "rottweiler", label: "Rottweiler" },
    { value: "dachshund", label: "Dachshund" },
    { value: "yorkshire-terrier", label: "Yorkshire Terrier" },
    { value: "boxer", label: "Boxer" },
    { value: "australian-shepherd", label: "Australian Shepherd" },
    { value: "siberian-husky", label: "Siberian Husky" },
    { value: "cavalier-king-charles", label: "Cavalier King Charles Spaniel" },
    { value: "doberman", label: "Doberman Pinscher" },
    { value: "great-dane", label: "Great Dane" },
    { value: "miniature-schnauzer", label: "Miniature Schnauzer" },
    { value: "shih-tzu", label: "Shih Tzu" },
    { value: "boston-terrier", label: "Boston Terrier" },
    { value: "bernese-mountain-dog", label: "Bernese Mountain Dog" },
    { value: "pomeranian", label: "Pomeranian" },
    { value: "havanese", label: "Havanese" },
    { value: "shetland-sheepdog", label: "Shetland Sheepdog" },
    { value: "border-collie", label: "Border Collie" },
    { value: "other", label: "Other" },
  ],
  cat: [
    { value: "", label: "All Breeds" },
    { value: "persian", label: "Persian" },
    { value: "maine-coon", label: "Maine Coon" },
    { value: "ragdoll", label: "Ragdoll" },
    { value: "british-shorthair", label: "British Shorthair" },
    { value: "siamese", label: "Siamese" },
    { value: "abyssinian", label: "Abyssinian" },
    { value: "bengal", label: "Bengal" },
    { value: "scottish-fold", label: "Scottish Fold" },
    { value: "sphynx", label: "Sphynx" },
    { value: "russian-blue", label: "Russian Blue" },
    { value: "other", label: "Other" },
  ],
  horse: [
    { value: "", label: "All Breeds" },
    { value: "quarter-horse", label: "Quarter Horse" },
    { value: "thoroughbred", label: "Thoroughbred" },
    { value: "arabian", label: "Arabian" },
    { value: "paint-horse", label: "Paint Horse" },
    { value: "appaloosa", label: "Appaloosa" },
    { value: "morgan", label: "Morgan" },
    { value: "warmblood", label: "Warmblood" },
    { value: "friesian", label: "Friesian" },
    { value: "mustang", label: "Mustang" },
    { value: "other", label: "Other" },
  ],
  rabbit: [
    { value: "", label: "All Breeds" },
    { value: "holland-lop", label: "Holland Lop" },
    { value: "mini-rex", label: "Mini Rex" },
    { value: "netherland-dwarf", label: "Netherland Dwarf" },
    { value: "lionhead", label: "Lionhead" },
    { value: "flemish-giant", label: "Flemish Giant" },
    { value: "english-lop", label: "English Lop" },
    { value: "rex", label: "Rex" },
    { value: "other", label: "Other" },
  ],
  goat: [
    { value: "", label: "All Breeds" },
    { value: "nigerian-dwarf", label: "Nigerian Dwarf" },
    { value: "boer", label: "Boer" },
    { value: "nubian", label: "Nubian" },
    { value: "alpine", label: "Alpine" },
    { value: "lamancha", label: "LaMancha" },
    { value: "pygmy", label: "Pygmy" },
    { value: "other", label: "Other" },
  ],
  sheep: [
    { value: "", label: "All Breeds" },
    { value: "dorper", label: "Dorper" },
    { value: "suffolk", label: "Suffolk" },
    { value: "hampshire", label: "Hampshire" },
    { value: "merino", label: "Merino" },
    { value: "katahdin", label: "Katahdin" },
    { value: "other", label: "Other" },
  ],
};

// =============================================================================
// Icons
// =============================================================================

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M6 18L18 6M6 6l12 12"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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

function SortIcon({ className, direction }: { className?: string; direction?: "asc" | "desc" | null }) {
  if (direction === "asc") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M8 15l4-4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (direction === "desc") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M8 9l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  // Neutral state - both arrows
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M8 10l4-4 4 4M8 14l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// =============================================================================
// Filter Panel Component
// =============================================================================

interface FilterPanelProps {
  filters: Filters;
  onFilterChange: (key: keyof Filters, value: string) => void;
  onClear: () => void;
  resultCount: number;
  loading: boolean;
  isMobile?: boolean;
  onClose?: () => void;
}

function FilterPanel({
  filters,
  onFilterChange,
  onClear,
  resultCount,
  loading,
  isMobile = false,
  onClose,
}: FilterPanelProps) {
  const hasFilters = filters.category || filters.species || filters.breed || filters.location || filters.priceMin || filters.priceMax;

  return (
    <div className={`${isMobile ? "p-4" : "sticky top-4"} space-y-6`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Filters</h2>
        <div className="flex items-center gap-2">
          {hasFilters && (
            <button
              type="button"
              onClick={onClear}
              className="text-sm text-accent hover:text-accent/80 transition-colors"
            >
              Clear all
            </button>
          )}
          {isMobile && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-text-tertiary hover:text-white transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary">Category</label>
        <select
          value={filters.category}
          onChange={(e) => onFilterChange("category", e.target.value)}
          className="w-full h-10 px-3 rounded-lg bg-border-default border border-border-subtle text-sm text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors cursor-pointer"
        >
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Species */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary">Species</label>
        <select
          value={filters.species}
          onChange={(e) => {
            onFilterChange("species", e.target.value);
            // Clear breed filter when species changes
            if (filters.breed) {
              onFilterChange("breed", "");
            }
          }}
          className="w-full h-10 px-3 rounded-lg bg-border-default border border-border-subtle text-sm text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors cursor-pointer"
        >
          {SPECIES_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Breed - only shown when a species is selected */}
      {filters.species && BREED_OPTIONS[filters.species] && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-secondary">Breed</label>
          <select
            value={filters.breed}
            onChange={(e) => onFilterChange("breed", e.target.value)}
            className="w-full h-10 px-3 rounded-lg bg-border-default border border-border-subtle text-sm text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors cursor-pointer"
          >
            {BREED_OPTIONS[filters.species].map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Location */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary">Location</label>
        <div className="relative">
          <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="City, State, or ZIP"
            value={filters.location}
            onChange={(e) => onFilterChange("location", e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-lg bg-border-default border border-border-subtle text-sm text-white placeholder-text-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
          />
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary">Price Range</label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-sm">$</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Min"
              value={filters.priceMin}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, "");
                onFilterChange("priceMin", val);
              }}
              className="w-full h-10 pl-7 pr-3 rounded-lg bg-border-default border border-border-subtle text-sm text-white placeholder-text-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
            />
          </div>
          <span className="text-text-tertiary shrink-0">–</span>
          <div className="relative flex-1 min-w-0">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-sm">$</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Max"
              value={filters.priceMax}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, "");
                onFilterChange("priceMax", val);
              }}
              className="w-full h-10 pl-7 pr-3 rounded-lg bg-border-default border border-border-subtle text-sm text-white placeholder-text-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Mobile Result Count & Apply Button */}
      {isMobile && (
        <div className="pt-4 border-t border-border-subtle">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-lg bg-[hsl(var(--brand-orange))] text-white font-medium hover:bg-[hsl(var(--brand-orange))]/90 transition-colors"
          >
            {loading ? "Loading..." : `Show ${resultCount} results`}
          </button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Service Card Component
// =============================================================================

function ServiceCard({ service, lightMode = false }: { service: PublicServiceListing; lightMode?: boolean }) {
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

  return (
    <div className="group flex flex-col min-h-[240px] rounded-lg border border-border-subtle bg-portal-card overflow-hidden transition-all hover:border-border-default hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5">
      {/* Image area - 4:3 aspect ratio to match other cards */}
      <div className="relative aspect-[4/3] overflow-hidden flex-shrink-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={service.title}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <DefaultCoverImage lightMode={lightMode} />
        )}
        {/* Category badge overlay */}
        <div className="absolute top-3 left-3">
          <span className="inline-block px-2.5 py-1 text-xs font-medium rounded-full bg-portal-bg/80 backdrop-blur-sm text-white border border-white/10">
            {service.customServiceType || SERVICE_TYPE_LABELS[service.listingType] || service.listingType}
          </span>
        </div>
      </div>

      {/* Content area */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Service title */}
        <h3 className="text-[15px] font-semibold text-white leading-snug line-clamp-2 group-hover:text-[hsl(var(--brand-orange))] transition-colors">
          {service.title}
        </h3>

        {/* Description */}
        {service.description && (
          <p className="text-[12px] text-text-secondary mt-1 line-clamp-2">
            {service.description}
          </p>
        )}

        {/* Provider and location */}
        {service.provider && (
          <p className="text-[12px] text-text-tertiary mt-1">
            {service.provider.name}
          </p>
        )}

        {/* Bottom section - pushed to bottom with mt-auto */}
        <div className="mt-auto pt-3 space-y-2">
          {/* Location */}
          {location && (
            <div className="text-[12px] text-text-tertiary">{location}</div>
          )}

          {/* Price and CTA */}
          <div className="flex items-center justify-between">
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
    </div>
  );
}

// =============================================================================
// List View Table Header Component
// =============================================================================

interface ServiceListTableHeaderProps {
  sort: string;
  onSortChange: (sort: string) => void;
}

function ServiceListTableHeader({ sort, onSortChange }: ServiceListTableHeaderProps) {
  // Helper to determine sort direction for a column
  const getSortDirection = (column: string): "asc" | "desc" | null => {
    if (sort === `${column}-asc`) return "asc";
    if (sort === `${column}-desc`) return "desc";
    return null;
  };

  // Helper to toggle sort for a column
  const toggleSort = (column: string) => {
    const current = getSortDirection(column);
    if (current === null || current === "desc") {
      onSortChange(`${column}-asc`);
    } else {
      onSortChange(`${column}-desc`);
    }
  };

  // Check if price is sorted (special naming)
  const getPriceSortDirection = (): "asc" | "desc" | null => {
    if (sort === "price-asc") return "asc";
    if (sort === "price-desc") return "desc";
    return null;
  };

  const togglePriceSort = () => {
    const current = getPriceSortDirection();
    if (current === null || current === "desc") {
      onSortChange("price-asc");
    } else {
      onSortChange("price-desc");
    }
  };

  return (
    <div className="hidden md:flex items-center gap-4 px-3 py-2 mb-2 text-xs font-medium text-text-tertiary uppercase tracking-wide border-b border-border-subtle">
      {/* Thumbnail spacer */}
      <div className="w-16 flex-shrink-0" />

      {/* Name - sortable */}
      <button
        type="button"
        onClick={() => toggleSort("name")}
        className="flex items-center gap-1 flex-1 min-w-0 hover:text-white transition-colors"
      >
        Service
        <SortIcon className="w-4 h-4" direction={getSortDirection("name")} />
      </button>

      {/* Provider - sortable */}
      <button
        type="button"
        onClick={() => toggleSort("provider")}
        className="flex items-center gap-1 w-32 shrink-0 hover:text-white transition-colors"
      >
        Provider
        <SortIcon className="w-4 h-4" direction={getSortDirection("provider")} />
      </button>

      {/* Location - sortable */}
      <button
        type="button"
        onClick={() => toggleSort("location")}
        className="hidden lg:flex items-center gap-1 w-36 shrink-0 hover:text-white transition-colors"
      >
        Location
        <SortIcon className="w-4 h-4" direction={getSortDirection("location")} />
      </button>

      {/* Price - sortable */}
      <button
        type="button"
        onClick={togglePriceSort}
        className="flex items-center gap-1 w-28 justify-end shrink-0 hover:text-white transition-colors"
      >
        Price
        <SortIcon className="w-4 h-4" direction={getPriceSortDirection()} />
      </button>

      {/* Arrow spacer */}
      <div className="w-5 flex-shrink-0" />
    </div>
  );
}

// =============================================================================
// Service List Row Component (for list view)
// =============================================================================

function ServiceListRow({ service }: { service: PublicServiceListing }) {
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

  return (
    <Link
      to={providerLink || "#"}
      className="group flex items-center gap-4 p-3 rounded-xl border border-border-subtle bg-portal-card hover:bg-portal-card-hover hover:border-border-default transition-all"
    >
      {/* Thumbnail */}
      <div className="w-16 h-16 rounded-lg bg-border-default overflow-hidden flex-shrink-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={service.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImagePlaceholderIcon className="w-6 h-6 text-text-tertiary" />
          </div>
        )}
      </div>

      {/* Title & Category */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="text-sm font-semibold text-white truncate group-hover:text-[hsl(var(--brand-orange))] transition-colors">
            {service.title}
          </h3>
          <span className="inline-block px-2 py-0.5 text-[10px] font-medium rounded-full bg-border-default text-text-secondary shrink-0">
            {service.customServiceType || SERVICE_TYPE_LABELS[service.listingType] || service.listingType}
          </span>
        </div>
        {service.description && (
          <p className="text-xs text-text-tertiary truncate max-w-md">
            {service.description}
          </p>
        )}
      </div>

      {/* Provider - hidden on small screens */}
      <div className="hidden md:block w-32 shrink-0">
        <p className="text-sm text-text-secondary truncate">
          {service.provider?.name || "—"}
        </p>
      </div>

      {/* Location - hidden on small screens */}
      <div className="hidden lg:flex items-center gap-1 w-36 shrink-0">
        {location ? (
          <>
            <MapPinIcon className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
            <span className="text-sm text-text-secondary truncate">{location}</span>
          </>
        ) : (
          <span className="text-sm text-text-muted">—</span>
        )}
      </div>

      {/* Price */}
      <div className="w-28 text-right shrink-0">
        <span className="text-sm font-semibold text-[hsl(var(--brand-orange))]">
          {priceText}
        </span>
      </div>

      {/* Arrow indicator */}
      <div className="w-5 shrink-0 text-text-tertiary group-hover:text-white transition-colors">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

// =============================================================================
// Skeleton Components
// =============================================================================

function SkeletonCard() {
  return (
    <div className="flex flex-col min-h-[240px] rounded-xl border border-border-subtle bg-portal-card overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-border-default" />
      <div className="p-4 space-y-3">
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

function SkeletonListRow() {
  return (
    <div className="flex items-center gap-4 p-3 rounded-xl border border-border-subtle bg-portal-card animate-pulse">
      <div className="w-16 h-16 rounded-lg bg-border-default shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-4 bg-border-default rounded w-48" />
        <div className="h-3 bg-border-default rounded w-64" />
      </div>
      <div className="hidden md:block w-32 shrink-0">
        <div className="h-4 bg-border-default rounded w-24" />
      </div>
      <div className="hidden lg:block w-36 shrink-0">
        <div className="h-4 bg-border-default rounded w-28" />
      </div>
      <div className="w-28 shrink-0">
        <div className="h-4 bg-border-default rounded w-20 ml-auto" />
      </div>
      <div className="w-5 shrink-0">
        <div className="h-5 w-5 bg-border-default rounded" />
      </div>
    </div>
  );
}

// =============================================================================
// Pagination Component
// =============================================================================

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | "ellipsis")[] = [];

  pages.push(1);

  if (currentPage > 3) {
    pages.push("ellipsis");
  }

  for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
    if (!pages.includes(i)) {
      pages.push(i);
    }
  }

  if (currentPage < totalPages - 2) {
    pages.push("ellipsis");
  }

  if (totalPages > 1 && !pages.includes(totalPages)) {
    pages.push(totalPages);
  }

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-white hover:bg-portal-card disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Previous
      </button>

      {pages.map((page, idx) =>
        page === "ellipsis" ? (
          <span key={`ellipsis-${idx}`} className="px-2 text-text-tertiary">
            ...
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
              page === currentPage
                ? "bg-accent text-white"
                : "text-text-secondary hover:text-white hover:bg-portal-card"
            }`}
          >
            {page}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-white hover:bg-portal-card disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Next
      </button>
    </nav>
  );
}

// =============================================================================
// Mobile Filter Sheet
// =============================================================================

interface MobileFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: Filters;
  onFilterChange: (key: keyof Filters, value: string) => void;
  onClear: () => void;
  resultCount: number;
  loading: boolean;
}

function MobileFilterSheet({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onClear,
  resultCount,
  loading,
}: MobileFilterSheetProps) {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60 md:hidden"
        onClick={onClose}
      />
      <div className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-portal-elevated border-t border-border-subtle md:hidden">
        <div className="sticky top-0 bg-portal-elevated py-3 px-4 border-b border-border-subtle">
          <div className="w-12 h-1 rounded-full bg-border-default mx-auto" />
        </div>
        <FilterPanel
          filters={filters}
          onFilterChange={onFilterChange}
          onClear={onClear}
          resultCount={resultCount}
          loading={loading}
          isMobile
          onClose={onClose}
        />
      </div>
    </>
  );
}

// =============================================================================
// Empty State
// =============================================================================

function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-portal-card p-12 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-border-default flex items-center justify-center">
        <BriefcaseIcon className="w-8 h-8 text-text-muted" />
      </div>
      <h2 className="text-lg font-semibold text-white mb-2">
        {hasFilters ? "No services match your criteria" : "No services available yet"}
      </h2>
      <p className="text-sm text-text-secondary mb-6 max-w-md mx-auto">
        {hasFilters
          ? "Try adjusting your filters or browse all services to see available offerings."
          : "No services have been published yet. Check back later or browse breeders to see their programs."}
      </p>
      {hasFilters ? (
        <button
          type="button"
          onClick={onClear}
          className="px-5 py-2.5 rounded-lg bg-[hsl(var(--brand-orange))] text-white text-sm font-medium hover:bg-[hsl(var(--brand-orange))]/90 transition-colors"
        >
          Clear Filters
        </button>
      ) : (
        <Link
          to="/breeders"
          className="inline-block px-5 py-2.5 rounded-lg bg-[hsl(var(--brand-orange))] text-white text-sm font-medium hover:bg-[hsl(var(--brand-orange))]/90 transition-colors"
        >
          Browse Breeders
        </Link>
      )}
    </div>
  );
}

// =============================================================================
// Auth Required State
// =============================================================================

function AuthRequiredState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-[hsl(var(--brand-orange))]/10 flex items-center justify-center mb-4">
        <BriefcaseIcon className="w-8 h-8 text-[hsl(var(--brand-orange))]" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">
        Sign in to browse services
      </h3>
      <p className="text-text-tertiary max-w-sm mb-6">
        Create a free account or sign in to access breeder services including stud services, training, grooming, and more.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          to="/auth/login"
          className="px-5 py-2.5 text-sm bg-[hsl(var(--brand-orange))] text-white rounded-lg hover:bg-[hsl(var(--brand-orange))]/90 transition-colors font-medium"
        >
          Sign In
        </Link>
        <Link
          to="/breeders"
          className="px-5 py-2.5 text-sm bg-portal-card border border-border-subtle text-white rounded-lg hover:bg-portal-card-hover transition-colors font-medium"
        >
          Browse Breeders
        </Link>
      </div>
    </div>
  );
}

// =============================================================================
// Main Page Component
// =============================================================================

export function ServicesIndexPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isLightMode } = useMarketplaceTheme();

  // Parse URL params into filters state
  const [filters, setFilters] = React.useState<Filters>(() => ({
    search: searchParams.get("q") || "",
    category: searchParams.get("category") || "",
    species: searchParams.get("species") || "",
    breed: searchParams.get("breed") || "",
    location: searchParams.get("location") || "",
    priceMin: searchParams.get("priceMin") || "",
    priceMax: searchParams.get("priceMax") || "",
    sort: searchParams.get("sort") || "newest",
  }));

  const [currentPage, setCurrentPage] = React.useState(() => {
    const page = searchParams.get("page");
    return page ? parseInt(page, 10) : 1;
  });

  // Data state
  const [services, setServices] = React.useState<PublicServiceListing[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [authRequired, setAuthRequired] = React.useState(false);
  const [total, setTotal] = React.useState(0);

  // UI state
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);
  const [displayMode, setDisplayMode] = React.useState<DisplayMode>("grid");

  // SEO - Update meta tags based on current filters
  React.useEffect(() => {
    const categoryLabel = filters.category
      ? SERVICE_TYPE_LABELS[filters.category] || "Services"
      : "Services";

    const speciesLabel = filters.species
      ? SPECIES_OPTIONS.find((s) => s.value === filters.species)?.label
      : null;

    const titleParts = ["Browse"];
    if (categoryLabel !== "Services") titleParts.push(categoryLabel);
    if (speciesLabel) titleParts.push(`for ${speciesLabel}`);
    titleParts.push("– BreederHQ Marketplace");

    const descParts = [`Find ${categoryLabel.toLowerCase()}`];
    if (speciesLabel) descParts.push(`for ${speciesLabel.toLowerCase()}`);
    descParts.push("from verified providers. Professional breeding services and products.");

    const canonicalParams = new URLSearchParams();
    if (filters.category) canonicalParams.set("category", filters.category);
    if (filters.species) canonicalParams.set("species", filters.species);
    const canonicalQuery = canonicalParams.toString();

    updateSEO({
      title: titleParts.join(" "),
      description: descParts.join(" "),
      canonical: `https://marketplace.breederhq.com/services${canonicalQuery ? `?${canonicalQuery}` : ""}`,
      keywords: `${categoryLabel.toLowerCase()}, ${speciesLabel ? `${speciesLabel.toLowerCase()} services, ` : ""}breeding services, stud services, animal services`,
      noindex: false,
    });
  }, [filters.category, filters.species]);

  // Derived state
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasFilters = !!(filters.category || filters.species || filters.breed || filters.location || filters.priceMin || filters.priceMax);

  // Sync URL params when filters change
  React.useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set("q", filters.search);
    if (filters.category) params.set("category", filters.category);
    if (filters.species) params.set("species", filters.species);
    if (filters.breed) params.set("breed", filters.breed);
    if (filters.location) params.set("location", filters.location);
    if (filters.priceMin) params.set("priceMin", filters.priceMin);
    if (filters.priceMax) params.set("priceMax", filters.priceMax);
    if (filters.sort !== "newest") params.set("sort", filters.sort);
    if (currentPage > 1) params.set("page", String(currentPage));
    setSearchParams(params, { replace: true });
  }, [filters, currentPage, setSearchParams]);

  // Fetch services
  React.useEffect(() => {
    let dead = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setAuthRequired(false);

      try {
        const params: Record<string, string> = {};
        if (filters.category) params.type = filters.category;
        if (filters.location) params.location = filters.location;
        if (filters.search) params.q = filters.search;
        // Note: priceMin/priceMax and sort may need backend support

        const response = await getPublicServices(params);

        if (!dead) {
          let items = response.items;

          // Client-side price filtering (if backend doesn't support it)
          if (filters.priceMin || filters.priceMax) {
            const min = filters.priceMin ? parseFloat(filters.priceMin) * 100 : 0;
            const max = filters.priceMax ? parseFloat(filters.priceMax) * 100 : Infinity;
            items = items.filter((s) => {
              const price = s.priceCents ?? 0;
              return price >= min && price <= max;
            });
          }

          // Client-side search filtering
          if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            items = items.filter(
              (s) =>
                s.title.toLowerCase().includes(searchLower) ||
                s.description?.toLowerCase().includes(searchLower) ||
                s.provider?.name?.toLowerCase().includes(searchLower)
            );
          }

          // Client-side sorting
          if (filters.sort === "price-asc") {
            items.sort((a, b) => (a.priceCents ?? 0) - (b.priceCents ?? 0));
          } else if (filters.sort === "price-desc") {
            items.sort((a, b) => (b.priceCents ?? 0) - (a.priceCents ?? 0));
          } else if (filters.sort === "name-asc") {
            items.sort((a, b) => a.title.localeCompare(b.title));
          } else if (filters.sort === "name-desc") {
            items.sort((a, b) => b.title.localeCompare(a.title));
          } else if (filters.sort === "provider-asc") {
            items.sort((a, b) => (a.provider?.name ?? "").localeCompare(b.provider?.name ?? ""));
          } else if (filters.sort === "provider-desc") {
            items.sort((a, b) => (b.provider?.name ?? "").localeCompare(a.provider?.name ?? ""));
          } else if (filters.sort === "location-asc") {
            items.sort((a, b) => {
              const locA = [a.city, a.state].filter(Boolean).join(", ");
              const locB = [b.city, b.state].filter(Boolean).join(", ");
              return locA.localeCompare(locB);
            });
          } else if (filters.sort === "location-desc") {
            items.sort((a, b) => {
              const locA = [a.city, a.state].filter(Boolean).join(", ");
              const locB = [b.city, b.state].filter(Boolean).join(", ");
              return locB.localeCompare(locA);
            });
          }
          // "newest" is default from API

          setServices(items);
          setTotal(items.length);
        }
      } catch (err: unknown) {
        if (!dead) {
          if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
            setAuthRequired(true);
            setServices([]);
            setTotal(0);
          } else {
            const message = err instanceof Error ? err.message : "Failed to load services";
            setError(message);
            setServices([]);
            setTotal(0);
          }
        }
      } finally {
        if (!dead) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      dead = true;
    };
  }, [filters, currentPage]);

  // Handle filter changes
  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      category: "",
      species: "",
      breed: "",
      location: "",
      priceMin: "",
      priceMax: "",
      sort: "newest",
    });
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Debounced search
  const [searchInput, setSearchInput] = React.useState(filters.search);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        handleFilterChange("search", searchInput);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, filters.search]);

  // Paginate results
  const paginatedServices = services.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className={`pb-20 md:pb-8 ${isLightMode ? "marketplace-browse" : ""}`}>
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Services" },
        ]}
      />

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-[32px] font-bold text-white tracking-tight">
          Browse Services
        </h1>
        <p className="text-text-secondary mt-2">
          Stud services, training, grooming, and other breeder offerings
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-2xl">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by service name, provider, or description..."
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
            data-form-type="other"
            className="w-full h-12 pl-12 pr-4 rounded-xl bg-portal-card border border-border-subtle text-white placeholder-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
          />
        </div>
      </div>

      {/* Mobile Controls */}
      <div className="flex items-center gap-3 mb-4 md:hidden">
        <button
          type="button"
          onClick={() => setMobileFiltersOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-portal-card border border-border-subtle text-sm font-medium text-white"
        >
          <FilterIcon className="w-4 h-4" />
          Filters
          {hasFilters && (
            <span className="w-2 h-2 rounded-full bg-accent" />
          )}
        </button>

        <select
          value={filters.sort}
          onChange={(e) => handleFilterChange("sort", e.target.value)}
          className="flex-1 h-10 px-3 rounded-lg bg-portal-card border border-border-subtle text-sm text-white focus:outline-none focus:border-accent transition-colors"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              Sort: {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Auth Required State */}
      {authRequired && !loading && <AuthRequiredState />}

      {/* Main Content - only show if not auth required */}
      {!authRequired && (
        <div className="flex gap-8">
          {/* Desktop Filter Panel */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="rounded-xl border border-border-subtle bg-portal-card p-5">
              <FilterPanel
                filters={filters}
                onFilterChange={handleFilterChange}
                onClear={handleClearFilters}
                resultCount={total}
                loading={loading}
              />
            </div>
          </aside>

          {/* Listings Grid */}
          <main className="flex-1 min-w-0">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-text-secondary">
                {loading ? (
                  <span className="inline-block h-4 w-32 bg-border-default rounded animate-pulse" />
                ) : (
                  <>
                    <span className="font-semibold text-white">{total}</span>
                    {" "}
                    service{total === 1 ? "" : "s"}
                    {hasFilters && " found"}
                  </>
                )}
              </p>

              {/* Desktop Sort + View Toggle */}
              <div className="hidden md:flex items-center gap-3">
                {/* View Mode Toggle */}
                <div className="flex items-center rounded-lg border border-border-subtle bg-portal-card p-0.5">
                  <button
                    type="button"
                    onClick={() => setDisplayMode("grid")}
                    className={`p-1.5 rounded-md transition-colors ${
                      displayMode === "grid"
                        ? "bg-accent text-white"
                        : "text-text-tertiary hover:text-white"
                    }`}
                    aria-label="Grid view"
                    title="Grid view"
                  >
                    <GridIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisplayMode("list")}
                    className={`p-1.5 rounded-md transition-colors ${
                      displayMode === "list"
                        ? "bg-accent text-white"
                        : "text-text-tertiary hover:text-white"
                    }`}
                    aria-label="List view"
                    title="List view"
                  >
                    <ListIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Sort Dropdown */}
                <select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange("sort", e.target.value)}
                  className="h-9 px-3 rounded-lg bg-portal-card border border-border-subtle text-sm text-white focus:outline-none focus:border-accent transition-colors"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      Sort: {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results Grid/List */}
            {loading ? (
              <div className={displayMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                : "flex flex-col gap-3"
              }>
                {Array.from({ length: 6 }).map((_, i) => (
                  displayMode === "grid" ? <SkeletonCard key={i} /> : <SkeletonListRow key={i} />
                ))}
              </div>
            ) : error ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-8 text-center">
                <p className="text-red-400 mb-4">{error}</p>
                <button
                  type="button"
                  onClick={() => setFilters({ ...filters })}
                  className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : paginatedServices.length === 0 ? (
              <EmptyState hasFilters={hasFilters} onClear={handleClearFilters} />
            ) : (
              <>
                {/* List view table header */}
                {displayMode === "list" && (
                  <ServiceListTableHeader
                    sort={filters.sort}
                    onSortChange={(sort) => handleFilterChange("sort", sort)}
                  />
                )}

                <div className={displayMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  : "flex flex-col gap-3"
                }>
                  {paginatedServices.map((service) => (
                    displayMode === "grid"
                      ? <ServiceCard key={service.id} service={service} lightMode={isLightMode} />
                      : <ServiceListRow key={service.id} service={service} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      )}

      {/* Mobile Filter Sheet */}
      <MobileFilterSheet
        isOpen={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClear={handleClearFilters}
        resultCount={total}
        loading={loading}
      />
    </div>
  );
}

export default ServicesIndexPage;
