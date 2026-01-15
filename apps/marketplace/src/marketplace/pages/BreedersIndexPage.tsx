// apps/marketplace/src/marketplace/pages/BreedersIndexPage.tsx
// Breeders index page - lists published breeders with search, filters, and grid display
// Updated to match AnimalsIndexPage layout with sidebar filter panel

import * as React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Tooltip } from "@bhq/ui";
import { apiGet } from "../../api/client";
import { VerificationBadge } from "../components/VerificationBadge";
import { Breadcrumb } from "../components/Breadcrumb";
import { DefaultCoverImage } from "../../shared/DefaultCoverImage";
import { updateSEO } from "../../utils/seo";
import { useMarketplaceTheme } from "../../context/MarketplaceThemeContext";

// =============================================================================
// Types
// =============================================================================

interface AvailabilityStatus {
  acceptingInquiries: boolean;
  waitlistOpen: boolean;
  availableNowCount: number;
  upcomingLittersCount: number;
}

interface TrustBadges {
  quickResponder: boolean;
  healthTesting: boolean;
  experiencedBreeder: boolean;
}

interface ReviewSummary {
  hasReviews: boolean;
  averageRating: number | null;
  reviewCount: number;
}

interface BreederSummary {
  tenantSlug: string;
  businessName: string;
  location: string | null;
  publicLocationMode: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  breeds: Array<{ name: string; species: string | null }>;
  logoAssetId: string | null;
  isVerified?: boolean;
  verificationLevel?: "basic" | "verified" | "premium";

  // Enhanced fields from API
  yearsInBusiness: number | null;
  placementCount: number;
  availabilityStatus: AvailabilityStatus;
  badges: TrustBadges;
  averageResponseTimeHours: number | null;
  reviewSummary: ReviewSummary | null;
  primarySpecies: string | null;
}

interface BreedersListResponse {
  items: BreederSummary[];
  total: number;
  page?: number;
  pageSize?: number;
}

interface Filters {
  search: string;
  species: string;
  breed: string;
  location: string;
  sort: string;
  // Offspring Availability (most important for buyers!)
  hasAvailableNow: boolean;
  hasUpcomingLitters: boolean;
  hasWaitlistSpots: boolean;
  // Visit & Meeting Options
  allowsFacilityVisits: boolean;
  offersVideoCalls: boolean;
  canMeetParents: boolean;
  // Trust Badges (computed/earned)
  verified: boolean;
  quickResponder: boolean;
  healthTestingBadge: boolean;
  experiencedBreeder: boolean; // 5+ placements badge
  // Availability
  acceptingInquiries: boolean;
  waitlistOpen: boolean;
  // Placement Policies
  requiresApplication: boolean;
  requiresInterview: boolean;
  requiresContract: boolean;
  hasReturnPolicy: boolean;
  offersSupport: boolean;
  // Health & Guarantees
  healthTested: boolean;
  offersHealthGuarantee: boolean;
  // Standards & Credentials
  registeredBreeder: boolean;
  akc: boolean;
  cfa: boolean;
  // Experience & Trust
  establishedBreeders: boolean; // 5+ years in business
  hasReviews: boolean;
  // Delivery Options
  offersShipping: boolean;
  offersDelivery: boolean;
  pickupOnly: boolean;
  // Payment Options
  acceptsDeposits: boolean;
  offersPaymentPlans: boolean;
  // Online Presence
  hasWebsite: boolean;
  hasSocialMedia: boolean;
}

type DisplayMode = "grid" | "list";

// =============================================================================
// Constants
// =============================================================================

const MAX_VISIBLE_BREEDS = 3;
const PAGE_SIZE = 24;

// Supported species per database schema
const SPECIES_OPTIONS = [
  { value: "", label: "All Species" },
  { value: "dog", label: "Dogs" },
  { value: "cat", label: "Cats" },
  { value: "horse", label: "Horses" },
  { value: "rabbit", label: "Rabbits" },
  { value: "goat", label: "Goats" },
  { value: "sheep", label: "Sheep" },
];

// Popular breeds by species
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
    { value: "australian-shepherd", label: "Australian Shepherd" },
    { value: "siberian-husky", label: "Siberian Husky" },
    { value: "doberman", label: "Doberman Pinscher" },
    { value: "great-dane", label: "Great Dane" },
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
    { value: "bengal", label: "Bengal" },
    { value: "sphynx", label: "Sphynx" },
    { value: "other", label: "Other" },
  ],
  horse: [
    { value: "", label: "All Breeds" },
    { value: "quarter-horse", label: "Quarter Horse" },
    { value: "thoroughbred", label: "Thoroughbred" },
    { value: "arabian", label: "Arabian" },
    { value: "warmblood", label: "Warmblood" },
    { value: "other", label: "Other" },
  ],
  rabbit: [
    { value: "", label: "All Breeds" },
    { value: "holland-lop", label: "Holland Lop" },
    { value: "netherland-dwarf", label: "Netherland Dwarf" },
    { value: "mini-rex", label: "Mini Rex" },
    { value: "lionhead", label: "Lionhead" },
    { value: "other", label: "Other" },
  ],
  goat: [
    { value: "", label: "All Breeds" },
    { value: "nigerian-dwarf", label: "Nigerian Dwarf" },
    { value: "boer", label: "Boer" },
    { value: "nubian", label: "Nubian" },
    { value: "pygmy", label: "Pygmy" },
    { value: "other", label: "Other" },
  ],
  sheep: [
    { value: "", label: "All Breeds" },
    { value: "dorper", label: "Dorper" },
    { value: "suffolk", label: "Suffolk" },
    { value: "merino", label: "Merino" },
    { value: "other", label: "Other" },
  ],
};

const SORT_OPTIONS = [
  { value: "name-asc", label: "Name: A-Z" },
  { value: "name-desc", label: "Name: Z-A" },
  { value: "location-asc", label: "Location: A-Z" },
  { value: "location-desc", label: "Location: Z-A" },
  { value: "newest", label: "Newest" },
  { value: "breeds", label: "Most Breeds" },
];

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

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M19 9l-7 7-7-7"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
// Collapsible Filter Section Component
// =============================================================================

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  activeCount?: number;
}

function CollapsibleSection({ title, children, defaultOpen = false, activeCount = 0 }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className="border-b border-border-subtle pb-4">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-2 text-left group"
      >
        <div className="flex items-center gap-2">
          <ChevronDownIcon
            className={`w-4 h-4 text-text-tertiary group-hover:text-white transition-all duration-200 ${
              isOpen ? "rotate-180" : "-rotate-90"
            }`}
          />
          <span className="text-sm font-medium text-text-secondary uppercase tracking-wide group-hover:text-white transition-colors">
            {title}
          </span>
        </div>
        {activeCount > 0 && (
          <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-semibold rounded-full bg-accent text-white">
            {activeCount}
          </span>
        )}
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? "max-h-[500px] opacity-100 mt-2" : "max-h-0 opacity-0"
        }`}
      >
        <div className="space-y-2 pl-6">
          {children}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Helpers
// =============================================================================

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

// =============================================================================
// Filter Panel Component
// =============================================================================

interface FilterPanelProps {
  filters: Filters;
  onFilterChange: (key: keyof Filters, value: string | boolean) => void;
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
  const hasFilters = filters.species || filters.breed || filters.location ||
    // Offspring Availability
    filters.hasAvailableNow || filters.hasUpcomingLitters || filters.hasWaitlistSpots ||
    // Visit & Meeting
    filters.allowsFacilityVisits || filters.offersVideoCalls || filters.canMeetParents ||
    // Trust Badges
    filters.verified || filters.quickResponder || filters.healthTestingBadge || filters.experiencedBreeder ||
    // Availability
    filters.acceptingInquiries || filters.waitlistOpen ||
    // Placement Policies
    filters.requiresApplication || filters.requiresInterview || filters.requiresContract ||
    filters.hasReturnPolicy || filters.offersSupport ||
    // Health & Guarantees
    filters.healthTested || filters.offersHealthGuarantee ||
    // Standards & Credentials
    filters.registeredBreeder || filters.akc || filters.cfa ||
    // Experience & Trust
    filters.establishedBreeders || filters.hasReviews ||
    // Delivery Options
    filters.offersShipping || filters.offersDelivery || filters.pickupOnly ||
    // Payment Options
    filters.acceptsDeposits || filters.offersPaymentPlans ||
    // Online Presence
    filters.hasWebsite || filters.hasSocialMedia;

  // Count active filters per section
  const offspringCount = [filters.hasAvailableNow, filters.hasUpcomingLitters, filters.hasWaitlistSpots].filter(Boolean).length;
  const visitCount = [filters.allowsFacilityVisits, filters.offersVideoCalls, filters.canMeetParents].filter(Boolean).length;
  const availabilityCount = [filters.acceptingInquiries, filters.waitlistOpen].filter(Boolean).length;
  const placementCount = [filters.requiresApplication, filters.requiresInterview, filters.requiresContract, filters.hasReturnPolicy, filters.offersSupport].filter(Boolean).length;
  const healthCount = [filters.healthTested, filters.offersHealthGuarantee].filter(Boolean).length;
  const registrationCount = [filters.registeredBreeder, filters.akc, filters.cfa].filter(Boolean).length;
  const trustCount = [filters.verified, filters.healthTestingBadge, filters.experiencedBreeder, filters.quickResponder, filters.establishedBreeders, filters.hasReviews].filter(Boolean).length;
  const deliveryCount = [filters.offersShipping, filters.offersDelivery, filters.pickupOnly].filter(Boolean).length;
  const paymentCount = [filters.acceptsDeposits, filters.offersPaymentPlans].filter(Boolean).length;
  const onlineCount = [filters.hasWebsite, filters.hasSocialMedia].filter(Boolean).length;

  // Checkbox component for consistent styling
  const FilterCheckbox = ({ checked, filterKey, label }: { checked: boolean; filterKey: keyof Filters; label: string }) => (
    <label className="flex items-center gap-3 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onFilterChange(filterKey, e.target.checked ? "true" : "")}
        className="w-4 h-4 rounded border-border-subtle bg-border-default text-accent focus:ring-accent/30 focus:ring-offset-0 cursor-pointer"
      />
      <span className="text-sm text-text-secondary group-hover:text-white transition-colors">
        {label}
      </span>
    </label>
  );

  return (
    <div className={`${isMobile ? "p-4" : "sticky top-4"} space-y-4`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
        <h2 className="text-lg font-semibold text-white">Filters</h2>
        <div className="flex items-center gap-2">
          {hasFilters && (
            <button
              type="button"
              onClick={onClear}
              className="text-sm text-accent hover:text-accent/80 transition-colors"
            >
              Clear All
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

      {/* Species - Always visible, not collapsible */}
      <div className="space-y-2 pb-4 border-b border-border-subtle">
        <label className="text-sm font-medium text-text-secondary uppercase tracking-wide">Species</label>
        <select
          value={filters.species}
          onChange={(e) => {
            onFilterChange("species", e.target.value);
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

      {/* Breed - Only shown when species selected */}
      {filters.species && BREED_OPTIONS[filters.species] && (
        <div className="space-y-2 pb-4 border-b border-border-subtle">
          <label className="text-sm font-medium text-text-secondary uppercase tracking-wide">Breed</label>
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

      {/* Location - Always visible */}
      <div className="space-y-2 pb-4 border-b border-border-subtle">
        <label className="text-sm font-medium text-text-secondary uppercase tracking-wide">Location</label>
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

      {/* Offspring Availability - Default open (most important!) */}
      <CollapsibleSection title="Offspring Availability" defaultOpen={true} activeCount={offspringCount}>
        <FilterCheckbox checked={filters.hasAvailableNow} filterKey="hasAvailableNow" label="Available Now" />
        <FilterCheckbox checked={filters.hasUpcomingLitters} filterKey="hasUpcomingLitters" label="Upcoming Litters" />
        <FilterCheckbox checked={filters.hasWaitlistSpots} filterKey="hasWaitlistSpots" label="Waitlist Spots Open" />
      </CollapsibleSection>

      {/* Visit & Meeting */}
      <CollapsibleSection title="Visit & Meeting" activeCount={visitCount}>
        <FilterCheckbox checked={filters.allowsFacilityVisits} filterKey="allowsFacilityVisits" label="Allows Facility Visits" />
        <FilterCheckbox checked={filters.offersVideoCalls} filterKey="offersVideoCalls" label="Offers Video Calls" />
        <FilterCheckbox checked={filters.canMeetParents} filterKey="canMeetParents" label="Can Meet Parents" />
      </CollapsibleSection>

      {/* Availability */}
      <CollapsibleSection title="Availability" activeCount={availabilityCount}>
        <FilterCheckbox checked={filters.acceptingInquiries} filterKey="acceptingInquiries" label="Accepting Inquiries" />
        <FilterCheckbox checked={filters.waitlistOpen} filterKey="waitlistOpen" label="Open Waitlist" />
      </CollapsibleSection>

      {/* Health & Guarantees */}
      <CollapsibleSection title="Health & Guarantees" activeCount={healthCount}>
        <FilterCheckbox checked={filters.healthTested} filterKey="healthTested" label="Health Tested Animals" />
        <FilterCheckbox checked={filters.offersHealthGuarantee} filterKey="offersHealthGuarantee" label="Offers Health Guarantee" />
      </CollapsibleSection>

      {/* Registration */}
      <CollapsibleSection title="Registration" activeCount={registrationCount}>
        <FilterCheckbox checked={filters.registeredBreeder} filterKey="registeredBreeder" label="Registered Breeder" />
        <FilterCheckbox checked={filters.akc} filterKey="akc" label="AKC Registered" />
        <FilterCheckbox checked={filters.cfa} filterKey="cfa" label="CFA Registered" />
      </CollapsibleSection>

      {/* Placement Policies */}
      <CollapsibleSection title="Placement Policies" activeCount={placementCount}>
        <FilterCheckbox checked={filters.requiresApplication} filterKey="requiresApplication" label="Requires Application" />
        <FilterCheckbox checked={filters.requiresInterview} filterKey="requiresInterview" label="Requires Interview" />
        <FilterCheckbox checked={filters.requiresContract} filterKey="requiresContract" label="Requires Contract" />
        <FilterCheckbox checked={filters.hasReturnPolicy} filterKey="hasReturnPolicy" label="Has Return Policy" />
        <FilterCheckbox checked={filters.offersSupport} filterKey="offersSupport" label="Offers Ongoing Support" />
      </CollapsibleSection>

      {/* Experience & Trust */}
      <CollapsibleSection title="Experience & Trust" activeCount={trustCount}>
        <FilterCheckbox checked={filters.verified} filterKey="verified" label="Verified Identity Badge" />
        <FilterCheckbox checked={filters.healthTestingBadge} filterKey="healthTestingBadge" label="Health Testing Badge" />
        <FilterCheckbox checked={filters.experiencedBreeder} filterKey="experiencedBreeder" label="5+ Placements Badge" />
        <FilterCheckbox checked={filters.quickResponder} filterKey="quickResponder" label="Quick Responder Badge" />
        <FilterCheckbox checked={filters.establishedBreeders} filterKey="establishedBreeders" label="Established (5+ Years)" />
        <FilterCheckbox checked={filters.hasReviews} filterKey="hasReviews" label="Has Reviews" />
      </CollapsibleSection>

      {/* Delivery Options */}
      <CollapsibleSection title="Delivery Options" activeCount={deliveryCount}>
        <FilterCheckbox checked={filters.offersShipping} filterKey="offersShipping" label="Offers Shipping" />
        <FilterCheckbox checked={filters.offersDelivery} filterKey="offersDelivery" label="Offers Delivery" />
        <FilterCheckbox checked={filters.pickupOnly} filterKey="pickupOnly" label="Pickup Only" />
      </CollapsibleSection>

      {/* Payment Options */}
      <CollapsibleSection title="Payment Options" activeCount={paymentCount}>
        <FilterCheckbox checked={filters.acceptsDeposits} filterKey="acceptsDeposits" label="Accepts Deposits" />
        <FilterCheckbox checked={filters.offersPaymentPlans} filterKey="offersPaymentPlans" label="Offers Payment Plans" />
      </CollapsibleSection>

      {/* Online Presence */}
      <CollapsibleSection title="Online Presence" activeCount={onlineCount}>
        <FilterCheckbox checked={filters.hasWebsite} filterKey="hasWebsite" label="Has Website" />
        <FilterCheckbox checked={filters.hasSocialMedia} filterKey="hasSocialMedia" label="Has Social Media" />
      </CollapsibleSection>

      {/* Mobile Result Count & Apply Button */}
      {isMobile && (
        <div className="pt-4 mt-4 border-t border-border-subtle">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-lg bg-[hsl(var(--brand-orange))] text-white font-medium hover:bg-[hsl(var(--brand-orange))]/90 transition-colors"
          >
            {loading ? "Loading..." : `Show ${resultCount} Results`}
          </button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Breeder Card Component
// =============================================================================

function BreederCard({ breeder, lightMode = false }: { breeder: BreederSummary; lightMode?: boolean }) {
  const visibleBreeds = (breeder.breeds ?? []).slice(0, MAX_VISIBLE_BREEDS);
  const extraCount = (breeder.breeds?.length ?? 0) - MAX_VISIBLE_BREEDS;
  const showLocation = breeder.publicLocationMode !== "hidden" && breeder.location;
  const hasValidSlug = breeder.tenantSlug && breeder.tenantSlug.trim() !== "";

  if (!hasValidSlug) {
    return (
      <div className="rounded-xl border border-border-subtle bg-portal-card overflow-hidden opacity-50 cursor-not-allowed">
        <div className="relative aspect-[4/3] bg-border-default flex items-center justify-center">
          <div className="h-20 w-20 rounded-full bg-[hsl(var(--brand-orange))]/10 flex items-center justify-center">
            <span className="text-2xl font-bold text-[hsl(var(--brand-orange))]">
              {getInitials(breeder.businessName)}
            </span>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-white truncate">{breeder.businessName}</h3>
          <p className="text-sm text-red-400 mt-0.5">Profile unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <Link to={`/breeders/${breeder.tenantSlug}`} className="block group">
      <div className="rounded-xl border border-border-subtle bg-portal-card overflow-hidden h-full flex flex-col transition-all hover:bg-portal-card-hover hover:border-border-default hover:-translate-y-0.5 hover:shadow-lg">
        {/* Image area - using logo or default */}
        <div className="relative aspect-[4/3] bg-border-default overflow-hidden">
          {breeder.logoAssetId ? (
            <img
              src={`/api/assets/${breeder.logoAssetId}`}
              alt={breeder.businessName}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <DefaultCoverImage lightMode={lightMode} />
          )}

          {/* Verification badge overlay - top right */}
          {(breeder.isVerified || breeder.verificationLevel) && (
            <div className="absolute top-2 right-2">
              <VerificationBadge
                level={breeder.verificationLevel || "verified"}
                size="sm"
                showLabel={false}
              />
            </div>
          )}
        </div>

        {/* Content area */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Breeder name */}
          <h3 className="text-[15px] font-semibold text-white mb-1 group-hover:text-[hsl(var(--brand-orange))] transition-colors line-clamp-1">
            {breeder.businessName}
          </h3>

          {/* Location */}
          {showLocation && (
            <p className="text-[13px] text-text-tertiary mb-3">{breeder.location}</p>
          )}

          {/* Breeds */}
          {visibleBreeds.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-auto">
              {visibleBreeds.map((breed, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 text-xs rounded-full bg-border-default text-text-secondary"
                >
                  {breed.name}
                </span>
              ))}
              {extraCount > 0 && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-border-default text-text-tertiary">
                  +{extraCount} more
                </span>
              )}
            </div>
          )}

          {/* Footer - availability or CTA */}
          <div className="pt-3 border-t border-border-subtle flex items-center justify-between mt-auto">
            {breeder.availabilityStatus?.availableNowCount > 0 ? (
              <span className="text-[13px] text-green-400 font-medium">
                {breeder.availabilityStatus.availableNowCount} Available
              </span>
            ) : breeder.availabilityStatus?.upcomingLittersCount > 0 ? (
              <span className="text-[13px] text-blue-400 font-medium">
                {breeder.availabilityStatus.upcomingLittersCount} Upcoming
              </span>
            ) : (
              <span className="text-[13px] text-text-muted">View Profile</span>
            )}
            <span className="text-[13px] text-text-secondary group-hover:text-white transition-colors">
              View details →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// =============================================================================
// List View Table Header Component
// =============================================================================

interface BreederListTableHeaderProps {
  sort: string;
  onSortChange: (sort: string) => void;
}

function BreederListTableHeader({ sort, onSortChange }: BreederListTableHeaderProps) {
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

  // Check if location is sorted
  const getLocationSortDirection = (): "asc" | "desc" | null => {
    if (sort === "location-asc") return "asc";
    if (sort === "location-desc") return "desc";
    return null;
  };

  const toggleLocationSort = () => {
    const current = getLocationSortDirection();
    if (current === null || current === "desc") {
      onSortChange("location-asc");
    } else {
      onSortChange("location-desc");
    }
  };

  // Check if breeds count is sorted
  const getBreedsSortDirection = (): "asc" | "desc" | null => {
    if (sort === "breeds") return "desc";
    return null;
  };

  return (
    <div className="hidden md:flex items-center gap-4 px-4 py-2 mb-2 text-xs font-medium text-text-tertiary uppercase tracking-wide border-b border-border-subtle">
      {/* Avatar spacer */}
      <div className="w-10 shrink-0" />

      {/* Name - sortable */}
      <button
        type="button"
        onClick={() => toggleSort("name")}
        className="flex items-center gap-1 w-[180px] shrink-0 hover:text-white transition-colors"
      >
        Name
        <SortIcon className="w-4 h-4" direction={getSortDirection("name")} />
      </button>

      {/* Species */}
      <div className="hidden lg:block w-[60px] shrink-0">Species</div>

      {/* # Breeds count */}
      <div className="hidden xl:flex w-[40px] shrink-0 justify-center">#</div>

      {/* Breeds */}
      <div className="flex-1 min-w-0">Breeds</div>

      {/* Availability */}
      <div className="hidden xl:block w-[180px] shrink-0">Availability</div>

      {/* Trust badges */}
      <div className="hidden lg:block w-[80px] shrink-0">Badges</div>

      {/* Location - sortable */}
      <button
        type="button"
        onClick={toggleLocationSort}
        className="hidden sm:flex items-center gap-1 w-[100px] shrink-0 hover:text-white transition-colors"
      >
        Location
        <SortIcon className="w-4 h-4" direction={getLocationSortDirection()} />
      </button>

      {/* Arrow spacer */}
      <div className="w-4 shrink-0" />
    </div>
  );
}

// =============================================================================
// Breeder List Row Component (for list view)
// =============================================================================

function BreederListRow({ breeder }: { breeder: BreederSummary }) {
  const allBreeds = breeder.breeds ?? [];
  const showLocation = breeder.publicLocationMode !== "hidden" && breeder.location;
  const hasValidSlug = breeder.tenantSlug && breeder.tenantSlug.trim() !== "";

  // Derive unique species from breeds
  const uniqueSpecies = [...new Set(allBreeds.map(b => b.species).filter(Boolean))] as string[];

  if (!hasValidSlug) {
    return (
      <div className="rounded-lg border border-border-subtle bg-portal-card px-4 py-3 opacity-50 cursor-not-allowed">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-[hsl(var(--brand-orange))]/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-[hsl(var(--brand-orange))]">
              {getInitials(breeder.businessName)}
            </span>
          </div>
          <span className="font-medium text-white">{breeder.businessName}</span>
          <span className="text-sm text-red-400">Profile unavailable</span>
        </div>
      </div>
    );
  }

  return (
    <Link to={`/breeders/${breeder.tenantSlug}`} className="block group">
      <div className="rounded-lg border border-border-subtle bg-portal-card px-4 py-3 transition-all hover:bg-portal-card-hover hover:border-border-default">
        <div className="flex items-center gap-4">
          {/* Avatar - smaller for list view */}
          <div className="h-10 w-10 rounded-full bg-[hsl(var(--brand-orange))]/10 flex items-center justify-center shrink-0">
            {breeder.logoAssetId ? (
              <img
                src={`/api/assets/${breeder.logoAssetId}`}
                alt={breeder.businessName}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-sm font-bold text-[hsl(var(--brand-orange))]">
                {getInitials(breeder.businessName)}
              </span>
            )}
          </div>

          {/* Name & Verification */}
          <div className="flex items-center gap-2 w-[180px] shrink-0">
            <h3 className="font-medium text-white group-hover:text-[hsl(var(--brand-orange))] transition-colors truncate">
              {breeder.businessName}
            </h3>
            {(breeder.isVerified || breeder.verificationLevel) && (
              <VerificationBadge
                level={breeder.verificationLevel || "verified"}
                size="sm"
                showLabel={false}
              />
            )}
          </div>

          {/* Species - show unique species with tooltip if multiple */}
          <div className="hidden lg:block w-[60px] shrink-0">
            {uniqueSpecies.length > 1 ? (
              <Tooltip
                content={
                  <div>
                    <p className="text-xs text-text-tertiary uppercase tracking-wide mb-1">Species</p>
                    <div className="flex flex-wrap gap-1">
                      {uniqueSpecies.map((species, i) => (
                        <span key={i} className="text-sm capitalize">{species}</span>
                      ))}
                    </div>
                  </div>
                }
                side="top"
              >
                <span className="text-xs text-accent cursor-help">
                  {uniqueSpecies.length} species
                </span>
              </Tooltip>
            ) : uniqueSpecies.length === 1 ? (
              <span className="text-xs text-text-tertiary capitalize">{uniqueSpecies[0]}</span>
            ) : (
              <span className="text-xs text-text-muted">—</span>
            )}
          </div>

          {/* Breed count (#) */}
          <div className="hidden xl:flex w-[40px] shrink-0 justify-center">
            <span className="px-2 py-0.5 text-xs rounded-full bg-border-default text-text-secondary">
              {allBreeds.length}
            </span>
          </div>

          {/* Breeds - show 2 pills + tooltip for overflow */}
          <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-hidden">
            {allBreeds.length > 0 ? (
              <>
                {allBreeds.slice(0, 2).map((breed, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 text-xs rounded-full bg-border-default text-text-secondary whitespace-nowrap"
                  >
                    {breed.name}
                  </span>
                ))}
                {allBreeds.length > 2 && (
                  <Tooltip
                    content={
                      <div className="max-w-xs">
                        <p className="text-xs text-text-tertiary uppercase tracking-wide mb-2">All Breeds ({allBreeds.length})</p>
                        <div className="flex flex-wrap gap-1.5">
                          {allBreeds.map((breed, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 text-xs rounded-full bg-border-default text-text-secondary whitespace-nowrap"
                            >
                              {breed.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    }
                    side="top"
                    align="start"
                  >
                    <span className="px-2 py-0.5 text-xs rounded-full bg-accent/20 text-accent whitespace-nowrap shrink-0 cursor-help hover:bg-accent/30 transition-colors">
                      +{allBreeds.length - 2} more
                    </span>
                  </Tooltip>
                )}
              </>
            ) : (
              <span className="text-xs text-text-muted">No breeds listed</span>
            )}
          </div>

          {/* Availability status */}
          <div className="hidden xl:flex items-center gap-2 w-[180px] shrink-0">
            {breeder.availabilityStatus?.availableNowCount > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-green-500/20 text-green-400 whitespace-nowrap">
                {breeder.availabilityStatus.availableNowCount} Available
              </span>
            )}
            {breeder.availabilityStatus?.upcomingLittersCount > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-blue-500/20 text-blue-400 whitespace-nowrap">
                {breeder.availabilityStatus.upcomingLittersCount} Upcoming
              </span>
            )}
            {breeder.availabilityStatus?.waitlistOpen && (
              <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-purple-500/20 text-purple-400 whitespace-nowrap">
                Waitlist Open
              </span>
            )}
          </div>

          {/* Trust badges */}
          <div className="hidden lg:flex items-center gap-1.5 w-[80px] shrink-0">
            {breeder.badges?.quickResponder && (
              <Tooltip content="Responds within 24 hours" side="top">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 cursor-help">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </span>
              </Tooltip>
            )}
            {breeder.badges?.healthTesting && (
              <Tooltip content="Health testing practices documented" side="top">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20 text-green-400 cursor-help">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </span>
              </Tooltip>
            )}
            {breeder.badges?.experiencedBreeder && (
              <Tooltip content="5+ successful placements" side="top">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 cursor-help">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </span>
              </Tooltip>
            )}
          </div>

          {/* Location */}
          <div className="hidden sm:flex items-center gap-1.5 w-[100px] shrink-0 text-sm text-text-tertiary">
            {showLocation ? (
              <>
                <MapPinIcon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{breeder.location}</span>
              </>
            ) : (
              <span className="text-text-muted">—</span>
            )}
          </div>

          {/* Arrow indicator */}
          <div className="w-4 shrink-0 text-text-tertiary group-hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}

// =============================================================================
// Skeleton Components
// =============================================================================

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border-subtle bg-portal-card p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 rounded-full bg-border-default flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-border-default rounded w-3/4" />
          <div className="h-3 bg-border-default rounded w-1/2" />
          <div className="flex gap-1.5 mt-2">
            <div className="h-5 w-16 bg-border-default rounded-full" />
            <div className="h-5 w-20 bg-border-default rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonListRow() {
  return (
    <div className="rounded-lg border border-border-subtle bg-portal-card px-4 py-3 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-border-default flex-shrink-0" />
        <div className="h-4 bg-border-default rounded w-32" />
        <div className="hidden sm:block h-3 bg-border-default rounded w-24" />
        <div className="hidden md:flex flex-1 gap-1.5">
          <div className="h-5 w-20 bg-border-default rounded-full" />
          <div className="h-5 w-16 bg-border-default rounded-full" />
        </div>
        <div className="h-4 w-4 bg-border-default rounded" />
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
  onFilterChange: (key: keyof Filters, value: string | boolean) => void;
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
// Empty State
// =============================================================================

function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
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
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-white mb-2">
        {hasFilters ? "No breeders match your criteria" : "No breeders available yet"}
      </h2>
      <p className="text-sm text-text-secondary mb-6 max-w-md mx-auto">
        {hasFilters
          ? "Try adjusting your filters or browse all breeders to see available programs."
          : "There are no published breeder profiles at this time. Check back soon!"}
      </p>
      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className="px-5 py-2.5 rounded-lg bg-[hsl(var(--brand-orange))] text-white text-sm font-medium hover:bg-[hsl(var(--brand-orange))]/90 transition-colors"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}

// =============================================================================
// Main Page Component
// =============================================================================

export function BreedersIndexPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isLightMode } = useMarketplaceTheme();

  // Parse URL params into filters state
  const [filters, setFilters] = React.useState<Filters>(() => ({
    search: searchParams.get("q") || "",
    species: searchParams.get("species") || "",
    breed: searchParams.get("breed") || "",
    location: searchParams.get("location") || "",
    sort: searchParams.get("sort") || "name-asc",
    // Offspring Availability (most important for buyers!)
    hasAvailableNow: searchParams.get("hasAvailableNow") === "true",
    hasUpcomingLitters: searchParams.get("hasUpcomingLitters") === "true",
    hasWaitlistSpots: searchParams.get("hasWaitlistSpots") === "true",
    // Visit & Meeting Options
    allowsFacilityVisits: searchParams.get("allowsFacilityVisits") === "true",
    offersVideoCalls: searchParams.get("offersVideoCalls") === "true",
    canMeetParents: searchParams.get("canMeetParents") === "true",
    // Trust Badges (computed/earned)
    verified: searchParams.get("verified") === "true",
    quickResponder: searchParams.get("quickResponder") === "true",
    healthTestingBadge: searchParams.get("healthTestingBadge") === "true",
    experiencedBreeder: searchParams.get("experiencedBreeder") === "true",
    // Availability
    acceptingInquiries: searchParams.get("acceptingInquiries") === "true",
    waitlistOpen: searchParams.get("waitlistOpen") === "true",
    // Placement Policies
    requiresApplication: searchParams.get("requiresApplication") === "true",
    requiresInterview: searchParams.get("requiresInterview") === "true",
    requiresContract: searchParams.get("requiresContract") === "true",
    hasReturnPolicy: searchParams.get("hasReturnPolicy") === "true",
    offersSupport: searchParams.get("offersSupport") === "true",
    // Health & Guarantees
    healthTested: searchParams.get("healthTested") === "true",
    offersHealthGuarantee: searchParams.get("offersHealthGuarantee") === "true",
    // Standards & Credentials
    registeredBreeder: searchParams.get("registeredBreeder") === "true",
    akc: searchParams.get("akc") === "true",
    cfa: searchParams.get("cfa") === "true",
    // Experience & Trust
    establishedBreeders: searchParams.get("establishedBreeders") === "true",
    hasReviews: searchParams.get("hasReviews") === "true",
    // Delivery Options
    offersShipping: searchParams.get("offersShipping") === "true",
    offersDelivery: searchParams.get("offersDelivery") === "true",
    pickupOnly: searchParams.get("pickupOnly") === "true",
    // Payment Options
    acceptsDeposits: searchParams.get("acceptsDeposits") === "true",
    offersPaymentPlans: searchParams.get("offersPaymentPlans") === "true",
    // Online Presence
    hasWebsite: searchParams.get("hasWebsite") === "true",
    hasSocialMedia: searchParams.get("hasSocialMedia") === "true",
  }));

  const [currentPage, setCurrentPage] = React.useState(() => {
    const page = searchParams.get("page");
    return page ? parseInt(page, 10) : 1;
  });

  // Data state
  const [breeders, setBreeders] = React.useState<BreederSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [total, setTotal] = React.useState(0);

  // UI state
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);
  const [displayMode, setDisplayMode] = React.useState<DisplayMode>("grid");

  // SEO - Update meta tags based on current filters
  React.useEffect(() => {
    const speciesLabel = filters.species
      ? SPECIES_OPTIONS.find((s) => s.value === filters.species)?.label
      : null;

    const titleParts = ["Find Verified"];
    if (speciesLabel) titleParts.push(speciesLabel);
    titleParts.push("Breeders – BreederHQ Marketplace");

    const descParts = ["Browse verified breeders"];
    if (speciesLabel) descParts.push(`specializing in ${speciesLabel.toLowerCase()}`);
    descParts.push("and their programs. Direct connection with trusted breeding programs.");

    const canonicalParams = new URLSearchParams();
    if (filters.species) canonicalParams.set("species", filters.species);
    if (filters.location) canonicalParams.set("location", filters.location);
    const canonicalQuery = canonicalParams.toString();

    updateSEO({
      title: titleParts.join(" "),
      description: descParts.join(" "),
      canonical: `https://marketplace.breederhq.com/breeders${canonicalQuery ? `?${canonicalQuery}` : ""}`,
      keywords: `${speciesLabel ? `${speciesLabel.toLowerCase()} breeders, ` : ""}animal breeders, verified breeders, breeding programs, professional breeders`,
      noindex: false,
    });
  }, [filters.species, filters.location]);

  // Derived state
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasFilters = !!(
    filters.species || filters.breed || filters.location ||
    // Offspring Availability
    filters.hasAvailableNow || filters.hasUpcomingLitters || filters.hasWaitlistSpots ||
    // Visit & Meeting
    filters.allowsFacilityVisits || filters.offersVideoCalls || filters.canMeetParents ||
    // Trust Badges
    filters.verified || filters.quickResponder || filters.healthTestingBadge || filters.experiencedBreeder ||
    // Availability
    filters.acceptingInquiries || filters.waitlistOpen ||
    // Placement Policies
    filters.requiresApplication || filters.requiresInterview || filters.requiresContract ||
    filters.hasReturnPolicy || filters.offersSupport ||
    // Health & Guarantees
    filters.healthTested || filters.offersHealthGuarantee ||
    // Standards & Credentials
    filters.registeredBreeder || filters.akc || filters.cfa ||
    // Experience & Trust
    filters.establishedBreeders || filters.hasReviews ||
    // Delivery Options
    filters.offersShipping || filters.offersDelivery || filters.pickupOnly ||
    // Payment Options
    filters.acceptsDeposits || filters.offersPaymentPlans ||
    // Online Presence
    filters.hasWebsite || filters.hasSocialMedia
  );

  // Sync URL params when filters change
  React.useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set("q", filters.search);
    if (filters.species) params.set("species", filters.species);
    if (filters.breed) params.set("breed", filters.breed);
    if (filters.location) params.set("location", filters.location);
    if (filters.sort !== "name-asc") params.set("sort", filters.sort);
    // Offspring Availability
    if (filters.hasAvailableNow) params.set("hasAvailableNow", "true");
    if (filters.hasUpcomingLitters) params.set("hasUpcomingLitters", "true");
    if (filters.hasWaitlistSpots) params.set("hasWaitlistSpots", "true");
    // Visit & Meeting
    if (filters.allowsFacilityVisits) params.set("allowsFacilityVisits", "true");
    if (filters.offersVideoCalls) params.set("offersVideoCalls", "true");
    if (filters.canMeetParents) params.set("canMeetParents", "true");
    // Trust Badges
    if (filters.verified) params.set("verified", "true");
    if (filters.quickResponder) params.set("quickResponder", "true");
    if (filters.healthTestingBadge) params.set("healthTestingBadge", "true");
    if (filters.experiencedBreeder) params.set("experiencedBreeder", "true");
    // Availability
    if (filters.acceptingInquiries) params.set("acceptingInquiries", "true");
    if (filters.waitlistOpen) params.set("waitlistOpen", "true");
    // Placement Policies
    if (filters.requiresApplication) params.set("requiresApplication", "true");
    if (filters.requiresInterview) params.set("requiresInterview", "true");
    if (filters.requiresContract) params.set("requiresContract", "true");
    if (filters.hasReturnPolicy) params.set("hasReturnPolicy", "true");
    if (filters.offersSupport) params.set("offersSupport", "true");
    // Health & Guarantees
    if (filters.healthTested) params.set("healthTested", "true");
    if (filters.offersHealthGuarantee) params.set("offersHealthGuarantee", "true");
    // Standards & Credentials
    if (filters.registeredBreeder) params.set("registeredBreeder", "true");
    if (filters.akc) params.set("akc", "true");
    if (filters.cfa) params.set("cfa", "true");
    // Experience & Trust
    if (filters.establishedBreeders) params.set("establishedBreeders", "true");
    if (filters.hasReviews) params.set("hasReviews", "true");
    // Delivery Options
    if (filters.offersShipping) params.set("offersShipping", "true");
    if (filters.offersDelivery) params.set("offersDelivery", "true");
    if (filters.pickupOnly) params.set("pickupOnly", "true");
    // Payment Options
    if (filters.acceptsDeposits) params.set("acceptsDeposits", "true");
    if (filters.offersPaymentPlans) params.set("offersPaymentPlans", "true");
    // Online Presence
    if (filters.hasWebsite) params.set("hasWebsite", "true");
    if (filters.hasSocialMedia) params.set("hasSocialMedia", "true");
    // Pagination
    if (currentPage > 1) params.set("page", String(currentPage));
    setSearchParams(params, { replace: true });
  }, [filters, currentPage, setSearchParams]);

  // Fetch breeders
  React.useEffect(() => {
    let dead = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (filters.search) params.set("q", filters.search);
        if (filters.species) params.set("species", filters.species);
        if (filters.breed) params.set("breed", filters.breed);
        if (filters.location) params.set("location", filters.location);
        if (filters.sort) params.set("sort", filters.sort);
        params.set("page", String(currentPage));
        params.set("pageSize", String(PAGE_SIZE));

        const queryString = params.toString();
        const url = `/api/v1/marketplace/breeders${queryString ? `?${queryString}` : ""}`;

        const { data } = await apiGet<BreedersListResponse>(url);

        if (!dead) {
          setBreeders(data?.items ?? []);
          setTotal(data?.total ?? 0);
        }
      } catch (err) {
        if (!dead) {
          const message = err instanceof Error ? err.message : "Failed to load breeders";
          setError(message);
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

  // All boolean filter keys for type checking
  const booleanFilterKeys: (keyof Filters)[] = [
    // Offspring Availability
    "hasAvailableNow", "hasUpcomingLitters", "hasWaitlistSpots",
    // Visit & Meeting
    "allowsFacilityVisits", "offersVideoCalls", "canMeetParents",
    // Trust Badges
    "verified", "quickResponder", "healthTestingBadge", "experiencedBreeder",
    // Availability
    "acceptingInquiries", "waitlistOpen",
    // Placement Policies
    "requiresApplication", "requiresInterview", "requiresContract",
    "hasReturnPolicy", "offersSupport",
    // Health & Guarantees
    "healthTested", "offersHealthGuarantee",
    // Standards & Credentials
    "registeredBreeder", "akc", "cfa",
    // Experience & Trust
    "establishedBreeders", "hasReviews",
    // Delivery Options
    "offersShipping", "offersDelivery", "pickupOnly",
    // Payment Options
    "acceptsDeposits", "offersPaymentPlans",
    // Online Presence
    "hasWebsite", "hasSocialMedia"
  ];

  // Handle filter changes
  const handleFilterChange = (key: keyof Filters, value: string | boolean) => {
    setFilters((prev) => {
      // Handle boolean filters - convert empty string to false
      if (typeof value === "string" && booleanFilterKeys.includes(key)) {
        return { ...prev, [key]: value === "true" };
      }
      return { ...prev, [key]: value };
    });
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      species: "",
      breed: "",
      location: "",
      sort: "name-asc",
      // Offspring Availability
      hasAvailableNow: false,
      hasUpcomingLitters: false,
      hasWaitlistSpots: false,
      // Visit & Meeting
      allowsFacilityVisits: false,
      offersVideoCalls: false,
      canMeetParents: false,
      // Trust Badges
      verified: false,
      quickResponder: false,
      healthTestingBadge: false,
      experiencedBreeder: false,
      // Availability
      acceptingInquiries: false,
      waitlistOpen: false,
      // Placement Policies
      requiresApplication: false,
      requiresInterview: false,
      requiresContract: false,
      hasReturnPolicy: false,
      offersSupport: false,
      // Health & Guarantees
      healthTested: false,
      offersHealthGuarantee: false,
      // Standards & Credentials
      registeredBreeder: false,
      akc: false,
      cfa: false,
      // Experience & Trust
      establishedBreeders: false,
      hasReviews: false,
      // Delivery Options
      offersShipping: false,
      offersDelivery: false,
      pickupOnly: false,
      // Payment Options
      acceptsDeposits: false,
      offersPaymentPlans: false,
      // Online Presence
      hasWebsite: false,
      hasSocialMedia: false,
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
  }, [searchInput]);

  return (
    <div className={`pb-20 md:pb-8 ${isLightMode ? "marketplace-browse" : ""}`}>
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Breeders" },
        ]}
      />

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-[32px] font-bold text-white tracking-tight">
          Browse Breeders
        </h1>
        <p className="text-text-secondary mt-2">
          Find verified breeders and their programs
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
            placeholder="Search by breeder name, breed, or location..."
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

      {/* Main Content */}
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
                  breeder{total === 1 ? "" : "s"}
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
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              : "flex flex-col gap-2"
            }>
              {Array.from({ length: 12 }).map((_, i) => (
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
          ) : breeders.length === 0 ? (
            <EmptyState hasFilters={hasFilters} onClear={handleClearFilters} />
          ) : (
            <>
              {/* List view table header */}
              {displayMode === "list" && (
                <BreederListTableHeader
                  sort={filters.sort}
                  onSortChange={(sort) => handleFilterChange("sort", sort)}
                />
              )}

              <div className={displayMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                : "flex flex-col gap-2"
              }>
                {breeders.map((breeder) => (
                  displayMode === "grid"
                    ? <BreederCard key={breeder.tenantSlug} breeder={breeder} lightMode={isLightMode} />
                    : <BreederListRow key={breeder.tenantSlug} breeder={breeder} />
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

export default BreedersIndexPage;
