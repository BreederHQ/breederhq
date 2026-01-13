// apps/marketplace/src/marketplace/pages/AnimalsIndexPage.tsx
// Browse Animals page - listing-centric view with filters, grid layout, pagination
// Supports both offspring group listings and program animal listings

import * as React from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { formatCents } from "../../utils/format";
import {
  getAnimalListings,
  getPublicOffspringGroups,
  type PublicOffspringGroupListing,
} from "../../api/client";
import type { PublicAnimalListingDTO } from "../../api/types";
import { Breadcrumb } from "../components/Breadcrumb";
import { useSaveButton } from "../../hooks/useSavedListings";

// =============================================================================
// Icons
// =============================================================================

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

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
        stroke="currentColor"
        strokeWidth="2"
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
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeartIcon({ className, filled }: { className?: string; filled?: boolean }) {
  if (filled) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M19 9l-7 7-7-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
        stroke="currentColor"
        strokeWidth="2"
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
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// =============================================================================
// Types and Constants
// =============================================================================

type ViewType = "all" | "offspring" | "animals";
type SortType = "newest" | "price_low" | "price_high" | "location";

interface Filters {
  search: string;
  species: string;
  breed: string;
  location: string;
  priceMin: string;
  priceMax: string;
  view: ViewType;
  sort: SortType;
}

// Supported species per database schema: DOG, CAT, HORSE, GOAT, RABBIT, SHEEP
const SPECIES_OPTIONS = [
  { value: "", label: "All Species" },
  { value: "dog", label: "Dogs" },
  { value: "cat", label: "Cats" },
  { value: "horse", label: "Horses" },
  { value: "rabbit", label: "Rabbits" },
  { value: "goat", label: "Goats" },
  { value: "sheep", label: "Sheep" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "location", label: "Distance" },
];

const ITEMS_PER_PAGE = 24;

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
  const hasFilters =
    filters.species || filters.breed || filters.location || filters.priceMin || filters.priceMax;

  return (
    <div
      className={`${isMobile ? "p-4" : "sticky top-4"} space-y-6`}
    >
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

      {/* Species */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary">Category</label>
        <select
          value={filters.species}
          onChange={(e) => onFilterChange("species", e.target.value)}
          className="w-full h-10 px-3 rounded-lg bg-portal-card border border-border-subtle text-sm text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
        >
          {SPECIES_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Location */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary">Location</label>
        <div className="relative">
          <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="City or ZIP"
            value={filters.location}
            onChange={(e) => onFilterChange("location", e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-lg bg-portal-card border border-border-subtle text-sm text-white placeholder-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
          />
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary">Price Range</label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.priceMin}
            onChange={(e) => onFilterChange("priceMin", e.target.value)}
            className="flex-1 h-10 px-3 rounded-lg bg-portal-card border border-border-subtle text-sm text-white placeholder-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
          />
          <span className="flex items-center text-text-tertiary">-</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.priceMax}
            onChange={(e) => onFilterChange("priceMax", e.target.value)}
            className="flex-1 h-10 px-3 rounded-lg bg-portal-card border border-border-subtle text-sm text-white placeholder-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
          />
        </div>
      </div>

      {/* Listing Type */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary">Listing Type</label>
        <div className="space-y-2">
          {[
            { value: "all", label: "All Listings" },
            { value: "animals", label: "Individual Animals" },
            { value: "offspring", label: "Offspring Groups" },
          ].map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="radio"
                name="listingType"
                value={opt.value}
                checked={filters.view === opt.value}
                onChange={(e) => onFilterChange("view", e.target.value)}
                className="sr-only"
              />
              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                  filters.view === opt.value
                    ? "border-accent bg-accent"
                    : "border-border-default bg-transparent"
                }`}
              >
                {filters.view === opt.value && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </div>
              <span className="text-sm text-text-secondary">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Result Count (Mobile) */}
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
// Animal Card Component
// =============================================================================

interface AnimalCardProps {
  id: string;
  title: string;
  imageUrl: string | null;
  price: number | null;
  priceType: "fixed" | "range" | "inquire";
  priceMin?: number | null;
  priceMax?: number | null;
  location: string | null;
  isVerified?: boolean;
  breed: string | null;
  species: string | null;
  breederName: string | null;
  href: string;
  listingType: "animal" | "offspring";
}

function AnimalCard({
  id,
  title,
  imageUrl,
  price,
  priceType,
  priceMin,
  priceMax,
  location,
  isVerified,
  breed,
  breederName,
  href,
  listingType,
}: AnimalCardProps) {
  // Use the save hook - map listingType to savedListingType
  const savedListingType = listingType === "offspring" ? "offspring_group" : "animal";
  const { isSaved, toggleSave } = useSaveButton(savedListingType, id);

  // Format price display
  let priceDisplay: string | null = null;
  if (priceType === "fixed" && price != null) {
    priceDisplay = formatCents(price);
  } else if (priceType === "range" && priceMin != null) {
    if (priceMax != null && priceMax !== priceMin) {
      priceDisplay = `${formatCents(priceMin)} - ${formatCents(priceMax)}`;
    } else {
      priceDisplay = formatCents(priceMin);
    }
  } else if (priceType === "inquire") {
    priceDisplay = "Contact for pricing";
  }

  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSave();
  };

  return (
    <Link to={href} className="group block">
      <div className="rounded-xl border border-border-subtle bg-portal-card overflow-hidden transition-all hover:border-border-default hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5">
        {/* Image */}
        <div className="relative aspect-[4/3] bg-border-default">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-12 h-12 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* Badges overlay */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
            {isVerified && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/90 text-white">
                <CheckIcon className="w-3 h-3" />
                Verified
              </span>
            )}
            {listingType === "offspring" && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/90 text-white">
                Litter
              </span>
            )}
          </div>

          {/* Save button */}
          <button
            type="button"
            onClick={handleSaveClick}
            className={`absolute top-2 right-2 p-1.5 rounded-full transition-colors ${
              isSaved
                ? "bg-red-500/90 text-white"
                : "bg-black/50 text-white/80 hover:text-red-400 hover:bg-black/70"
            }`}
            aria-label={isSaved ? "Remove from saved" : "Save listing"}
          >
            <HeartIcon className="w-4 h-4" filled={isSaved} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-[15px] font-semibold text-white mb-1 line-clamp-1 group-hover:text-accent transition-colors">
            {title}
          </h3>

          {breed && (
            <p className="text-sm text-text-secondary mb-1">{breed}</p>
          )}

          {breederName && (
            <p className="text-[13px] text-text-tertiary mb-2">{breederName}</p>
          )}

          <div className="flex items-center justify-between">
            {priceDisplay && (
              <span className="text-[15px] font-semibold text-accent">{priceDisplay}</span>
            )}
            {location && (
              <span className="text-[12px] text-text-tertiary">{location}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// =============================================================================
// Skeleton Card
// =============================================================================

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border-subtle bg-portal-card overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-border-default" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-border-default rounded w-3/4" />
        <div className="h-3 bg-border-default rounded w-1/2" />
        <div className="h-3 bg-border-default rounded w-1/3" />
        <div className="flex justify-between">
          <div className="h-4 bg-border-default rounded w-20" />
          <div className="h-3 bg-border-default rounded w-16" />
        </div>
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

  // Always show first page
  pages.push(1);

  // Show ellipsis if needed before current range
  if (currentPage > 3) {
    pages.push("ellipsis");
  }

  // Show pages around current
  for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
    if (!pages.includes(i)) {
      pages.push(i);
    }
  }

  // Show ellipsis if needed after current range
  if (currentPage < totalPages - 2) {
    pages.push("ellipsis");
  }

  // Always show last page
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
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 md:hidden"
        onClick={onClose}
      />
      {/* Sheet */}
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
// Main Page Component
// =============================================================================

export function AnimalsIndexPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse URL params into filters state
  const [filters, setFilters] = React.useState<Filters>(() => ({
    search: searchParams.get("q") || "",
    species: searchParams.get("species") || "",
    breed: searchParams.get("breed") || "",
    location: searchParams.get("location") || "",
    priceMin: searchParams.get("priceMin") || "",
    priceMax: searchParams.get("priceMax") || "",
    view: (searchParams.get("view") as ViewType) || "all",
    sort: (searchParams.get("sort") as SortType) || "newest",
  }));

  const [currentPage, setCurrentPage] = React.useState(() => {
    const page = searchParams.get("page");
    return page ? parseInt(page, 10) : 1;
  });

  // Data state
  const [offspringGroupListings, setOffspringGroupListings] = React.useState<
    PublicOffspringGroupListing[]
  >([]);
  const [animalListings, setAnimalListings] = React.useState<PublicAnimalListingDTO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [totalCount, setTotalCount] = React.useState(0);

  // UI state
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);

  // Sync URL params when filters change
  React.useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set("q", filters.search);
    if (filters.species) params.set("species", filters.species);
    if (filters.breed) params.set("breed", filters.breed);
    if (filters.location) params.set("location", filters.location);
    if (filters.priceMin) params.set("priceMin", filters.priceMin);
    if (filters.priceMax) params.set("priceMax", filters.priceMax);
    if (filters.view !== "all") params.set("view", filters.view);
    if (filters.sort !== "newest") params.set("sort", filters.sort);
    if (currentPage > 1) params.set("page", String(currentPage));
    setSearchParams(params, { replace: true });
  }, [filters, currentPage, setSearchParams]);

  // Fetch listings when filters change
  React.useEffect(() => {
    let dead = false;

    const fetchData = async () => {
      setLoading(true);

      const offset = (currentPage - 1) * ITEMS_PER_PAGE;

      // Determine which APIs to call based on view filter
      const fetchOffspring = filters.view !== "animals";
      const fetchAnimals = filters.view !== "offspring";

      const promises: Promise<any>[] = [];

      if (fetchOffspring) {
        promises.push(
          getPublicOffspringGroups({
            search: filters.search || undefined,
            species: filters.species || undefined,
            breed: filters.breed || undefined,
            location: filters.location || undefined,
            limit: ITEMS_PER_PAGE,
            page: currentPage,
          })
        );
      } else {
        promises.push(Promise.resolve({ items: [], total: 0 }));
      }

      if (fetchAnimals) {
        promises.push(
          getAnimalListings({
            search: filters.search || undefined,
            species: filters.species || undefined,
            breed: filters.breed || undefined,
            location: filters.location || undefined,
            limit: ITEMS_PER_PAGE,
            offset,
          })
        );
      } else {
        promises.push(Promise.resolve({ items: [], total: 0 }));
      }

      const [offspringResult, animalResult] = await Promise.allSettled(promises);

      if (!dead) {
        // Handle offspring groups
        if (offspringResult.status === "fulfilled") {
          setOffspringGroupListings(offspringResult.value.items || []);
        } else {
          console.error("Failed to fetch offspring groups:", offspringResult.reason);
          setOffspringGroupListings([]);
        }

        // Handle animal listings
        if (animalResult.status === "fulfilled") {
          setAnimalListings(animalResult.value?.items || []);
        } else {
          console.error("Failed to fetch animal listings:", animalResult.reason);
          setAnimalListings([]);
        }

        // Calculate total count (for pagination)
        const offspringTotal =
          offspringResult.status === "fulfilled" ? offspringResult.value.total || 0 : 0;
        const animalTotal =
          animalResult.status === "fulfilled" ? animalResult.value?.total || 0 : 0;
        setTotalCount(offspringTotal + animalTotal);

        setLoading(false);
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
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      species: "",
      breed: "",
      location: "",
      priceMin: "",
      priceMax: "",
      view: "all",
      sort: "newest",
    });
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Combine and filter listings
  const filteredOffspring = filters.view === "animals" ? [] : offspringGroupListings;
  const filteredAnimals = filters.view === "offspring" ? [] : animalListings;

  // Apply client-side price filtering if set
  const applyPriceFilter = <T extends { priceCents?: number | null; priceMinCents?: number | null }>(
    items: T[]
  ): T[] => {
    if (!filters.priceMin && !filters.priceMax) return items;
    const min = filters.priceMin ? parseFloat(filters.priceMin) * 100 : 0;
    const max = filters.priceMax ? parseFloat(filters.priceMax) * 100 : Infinity;

    return items.filter((item) => {
      const price = item.priceCents ?? item.priceMinCents ?? 0;
      return price >= min && price <= max;
    });
  };

  const displayedOffspring = applyPriceFilter(filteredOffspring);
  const displayedAnimals = applyPriceFilter(filteredAnimals);

  const totalDisplayed = displayedOffspring.length + displayedAnimals.length;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Animals" },
        ]}
      />

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-[28px] font-bold text-white tracking-tight">
          Browse Animals
        </h1>
        <p className="text-text-secondary mt-1">
          Find your perfect companion from verified breeders
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-2xl">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            placeholder="Search by breed, name, or location..."
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
          {(filters.species || filters.location || filters.priceMin || filters.priceMax) && (
            <span className="w-2 h-2 rounded-full bg-accent" />
          )}
        </button>

        <select
          value={filters.sort}
          onChange={(e) => handleFilterChange("sort", e.target.value as SortType)}
          className="flex-1 h-10 px-3 rounded-lg bg-portal-card border border-border-subtle text-sm text-white focus:outline-none focus:border-accent transition-colors"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Main Content */}
      <div className="flex gap-8">
        {/* Desktop Filter Panel */}
        <aside className="hidden md:block w-64 flex-shrink-0">
          <div className="rounded-xl border border-border-subtle bg-portal-card p-5">
            <FilterPanel
              filters={filters}
              onFilterChange={handleFilterChange}
              onClear={handleClearFilters}
              resultCount={totalDisplayed}
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
                <span className="inline-block h-4 w-24 bg-border-default rounded animate-pulse" />
              ) : (
                `${totalDisplayed} result${totalDisplayed === 1 ? "" : "s"}`
              )}
            </p>

            {/* Desktop Sort */}
            <div className="hidden md:flex items-center gap-3">
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange("sort", e.target.value as SortType)}
                className="h-9 px-3 rounded-lg bg-portal-card border border-border-subtle text-sm text-white focus:outline-none focus:border-accent transition-colors"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : totalDisplayed === 0 ? (
            /* Empty State */
            <div className="rounded-xl border border-border-subtle bg-portal-card p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-border-default flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-text-muted"
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
              <h2 className="text-lg font-semibold text-white mb-2">
                {filters.search || filters.species || filters.location
                  ? "No animals match your criteria"
                  : "No animals available yet"}
              </h2>
              <p className="text-sm text-text-secondary mb-6 max-w-md mx-auto">
                {filters.search || filters.species || filters.location
                  ? "Try adjusting your filters or browse all breeders to see their programs."
                  : "Browse our breeders to see their programs and upcoming litters."}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {(filters.search || filters.species || filters.location) && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="px-5 py-2.5 rounded-lg border border-border-subtle text-white text-sm font-medium hover:bg-portal-card-hover transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
                <Link
                  to="/breeders"
                  className="px-5 py-2.5 rounded-lg bg-[hsl(var(--brand-orange))] text-white text-sm font-medium hover:bg-[hsl(var(--brand-orange))]/90 transition-colors"
                >
                  Browse Breeders
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Individual Animal Listings */}
                {displayedAnimals.map((listing) => {
                  const locationParts = [
                    listing.locationCity,
                    listing.locationRegion,
                  ].filter(Boolean);

                  return (
                    <AnimalCard
                      key={`animal-${listing.id}`}
                      id={String(listing.id)}
                      title={listing.title || listing.animalName}
                      imageUrl={listing.primaryPhotoUrl}
                      price={listing.priceCents}
                      priceType={listing.priceModel || "fixed"}
                      priceMin={listing.priceMinCents}
                      priceMax={listing.priceMaxCents}
                      location={locationParts.length > 0 ? locationParts.join(", ") : null}
                      breed={listing.animalBreed}
                      species={listing.animalSpecies}
                      breederName={listing.programName}
                      href={`/programs/${listing.programSlug}/animals/${listing.urlSlug}`}
                      listingType="animal"
                    />
                  );
                })}

                {/* Offspring Group Listings */}
                {displayedOffspring.map((listing) => {
                  const breederSlug = listing.breeder?.slug;
                  const href =
                    breederSlug && listing.listingSlug
                      ? `/programs/${breederSlug}/offspring-groups/${listing.listingSlug}`
                      : "#";

                  return (
                    <AnimalCard
                      key={`offspring-${listing.id}`}
                      id={String(listing.id)}
                      title={listing.title || `${listing.breed || listing.species} Offspring`}
                      imageUrl={listing.coverImageUrl}
                      price={null}
                      priceType="range"
                      priceMin={listing.priceMinCents}
                      priceMax={listing.priceMaxCents}
                      location={listing.breeder?.location || null}
                      breed={listing.breed}
                      species={listing.species}
                      breederName={listing.breeder?.name || null}
                      href={href}
                      listingType="offspring"
                    />
                  );
                })}
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

      {/* Mobile Filter Sheet */}
      <MobileFilterSheet
        isOpen={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClear={handleClearFilters}
        resultCount={totalDisplayed}
        loading={loading}
      />
    </div>
  );
}

export default AnimalsIndexPage;
