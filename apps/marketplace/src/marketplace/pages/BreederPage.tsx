// apps/marketplace/src/marketplace/pages/BreederPage.tsx
// Public breeder profile page - displays published marketplace profile
// Enhanced with hero banner, tabs navigation, and floating CTA

import * as React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { apiGet, submitWaitlistRequest } from "../../api/client";
import { getUserMessage } from "../../api/errors";
import { Breadcrumb } from "../components/Breadcrumb";
import { useStartConversation } from "../../messages/hooks";
import { useUserProfile } from "../../gate/MarketplaceGate";
import { ReportBreederButton } from "../components/ReportBreederModal";
import { getOriginData, setOriginProgramSlug } from "../../utils/origin-tracking";

// =============================================================================
// Types
// =============================================================================

interface StandardsAndCredentials {
  registrations: string[];
  healthPractices: string[];
  breedingPractices: string[];
  carePractices: string[];
  registrationsNote: string | null;
  healthNote: string | null;
  breedingNote: string | null;
  careNote: string | null;
}

interface PlacementPolicies {
  requireApplication: boolean;
  requireInterview: boolean;
  requireContract: boolean;
  hasReturnPolicy: boolean;
  offersSupport: boolean;
  note: string | null;
}

interface DaySchedule {
  enabled: boolean;
  open: string;
  close: string;
}

interface BusinessHoursSchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

interface BreederProfileResponse {
  tenantSlug: string;
  businessName: string;
  bio: string | null;
  logoAssetId: string | null;
  coverImageUrl?: string | null;
  publicLocationMode: string | null;
  location: {
    city: string | null;
    state: string | null;
    zip: string | null;
    country: string | null;
  } | null;
  website: string | null;
  socialLinks: {
    instagram: string | null;
    facebook: string | null;
  };
  breeds: Array<{ name: string; species: string | null }>;
  programs: Array<{
    name: string;
    description: string | null;
    acceptInquiries: boolean;
    openWaitlist: boolean;
    comingSoon: boolean;
  }>;
  standardsAndCredentials: StandardsAndCredentials | null;
  placementPolicies: PlacementPolicies | null;
  publishedAt: string | null;
  businessHours: BusinessHoursSchedule | null;
  timeZone: string | null;
  quickResponderBadge: boolean;
  verified?: boolean;
  rating?: number;
  reviewCount?: number;
  establishedYear?: number;
}

type TabType = "about" | "programs" | "reviews";

// =============================================================================
// Icons
// =============================================================================

function MessageIcon({ className }: { className?: string }) {
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

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function StarIcon({ className, filled }: { className?: string; filled?: boolean }) {
  if (filled) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ZapIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

// =============================================================================
// Helper Functions
// =============================================================================

function buildLocationDisplay(
  location: BreederProfileResponse["location"],
  mode: string | null
): string {
  if (!location || mode === "hidden") return "";

  const { city, state, zip } = location;

  switch (mode) {
    case "city_state":
      return city && state ? `${city}, ${state}` : city || state || "";
    case "zip_only":
      return zip || "";
    case "full":
      if (city && state && zip) return `${city}, ${state} ${zip}`;
      if (city && state) return `${city}, ${state}`;
      return zip || city || state || "";
    default:
      return "";
  }
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function getTodaysHours(schedule: BusinessHoursSchedule | null): string {
  if (!schedule) return "Hours not set";

  const days: (keyof BusinessHoursSchedule)[] = [
    "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"
  ];
  const today = days[new Date().getDay()];
  const daySchedule = schedule[today];

  if (!daySchedule.enabled) {
    return "Closed today";
  }

  return `Open today ${formatTime(daySchedule.open)} - ${formatTime(daySchedule.close)}`;
}

// =============================================================================
// Not Found State
// =============================================================================

function NotFoundState() {
  const [showHowTo, setShowHowTo] = React.useState(false);

  const shouldShowHelp = React.useMemo(() => {
    try {
      const isStandalone = typeof window !== "undefined" &&
        window.location.hostname.startsWith("marketplace.");
      if (isStandalone) return false;
      const w: any = typeof window !== "undefined" ? window : {};
      return !!(w.__BHQ_TENANT_ID__ || localStorage.getItem("BHQ_TENANT_ID"));
    } catch {
      return false;
    }
  }, []);

  return (
    <div className="space-y-4 max-w-md mx-auto">
      <Breadcrumb
        items={[
          { label: "All breeders", href: "/breeders" },
          { label: "Not found" },
        ]}
      />
      <div className="rounded-xl border border-border-subtle bg-portal-card p-8 text-center">
        <h2 className="text-lg font-semibold text-white mb-2">Breeder not found</h2>
        <p className="text-text-secondary text-sm mb-4">
          This breeder profile does not exist, or it has not been published yet.
        </p>
        <div className="flex flex-col items-center gap-3">
          <Link
            to="/breeders"
            className="inline-block px-4 py-2 rounded-lg bg-[hsl(var(--brand-orange))] text-white text-sm font-medium hover:bg-[hsl(var(--brand-orange))]/90 transition-colors"
          >
            Browse breeders
          </Link>

          {shouldShowHelp && (
            <button
              type="button"
              onClick={() => setShowHowTo(!showHowTo)}
              className="text-sm text-text-tertiary hover:text-text-secondary transition-colors flex items-center gap-1"
            >
              How to publish
              <ChevronDownIcon className={`w-4 h-4 transition-transform ${showHowTo ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>

        {shouldShowHelp && showHowTo && (
          <div className="mt-4 pt-4 border-t border-border-subtle text-left">
            <ol className="text-sm text-text-secondary space-y-2 list-decimal list-inside">
              <li>Go to Marketplace (in navigation) and click "Manage My Listing"</li>
              <li>Fill out your business identity, location, and contact info</li>
              <li>Add breeds and create at least one listed program</li>
              <li>Click "Publish to Marketplace"</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Hero Section
// =============================================================================

interface HeroSectionProps {
  profile: BreederProfileResponse;
  locationDisplay: string;
}

function HeroSection({ profile, locationDisplay }: HeroSectionProps) {
  return (
    <div className="relative">
      {/* Cover Image */}
      <div className="h-32 md:h-48 bg-gradient-to-r from-portal-card to-border-default rounded-xl overflow-hidden">
        {profile.coverImageUrl && (
          <img
            src={profile.coverImageUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Profile Info Overlay */}
      <div className="relative -mt-12 md:-mt-16 px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          {/* Avatar */}
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl border-4 border-portal-bg bg-portal-card overflow-hidden flex-shrink-0">
            {profile.logoAssetId ? (
              <img
                src={`/api/v1/assets/${profile.logoAssetId}`}
                alt={profile.businessName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[hsl(var(--brand-orange))] to-[hsl(var(--brand-orange))]/70 text-white text-3xl md:text-4xl font-bold">
                {profile.businessName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Name and Info */}
          <div className="flex-1 pb-2">
            <div className="flex items-center flex-wrap gap-2 mb-1">
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                {profile.businessName}
              </h1>
              {profile.verified && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                  <CheckIcon className="w-3 h-3" />
                  Verified
                </span>
              )}
              {profile.quickResponderBadge && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-accent/20 text-accent border border-accent/30">
                  <ZapIcon className="w-3 h-3" />
                  Quick Responder
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-secondary">
              {locationDisplay && (
                <span className="flex items-center gap-1">
                  <MapPinIcon className="w-4 h-4" />
                  {locationDisplay}
                </span>
              )}
              {profile.rating && profile.reviewCount && profile.reviewCount > 0 && (
                <span className="flex items-center gap-1">
                  <StarIcon className="w-4 h-4 text-yellow-400" filled />
                  {profile.rating.toFixed(1)} ({profile.reviewCount} reviews)
                </span>
              )}
              {profile.establishedYear && (
                <span>Est. {profile.establishedYear}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Tabs Navigation
// =============================================================================

interface TabsNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  programCount: number;
  reviewCount?: number;
}

function TabsNav({ activeTab, onTabChange, programCount, reviewCount = 0 }: TabsNavProps) {
  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: "about", label: "About" },
    { id: "programs", label: "Programs", count: programCount },
    { id: "reviews", label: "Reviews", count: reviewCount },
  ];

  return (
    <div className="border-b border-border-subtle">
      <nav className="flex gap-1 overflow-x-auto" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "border-accent text-white"
                : "border-transparent text-text-secondary hover:text-white"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[11px] ${
                activeTab === tab.id
                  ? "bg-accent/20 text-accent"
                  : "bg-border-default text-text-tertiary"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}

// =============================================================================
// Business Hours Display
// =============================================================================

function BusinessHoursDisplay({ schedule, timeZone }: { schedule: BusinessHoursSchedule | null; timeZone: string | null }) {
  const [expanded, setExpanded] = React.useState(false);

  const days: { key: keyof BusinessHoursSchedule; label: string }[] = [
    { key: "monday", label: "Mon" },
    { key: "tuesday", label: "Tue" },
    { key: "wednesday", label: "Wed" },
    { key: "thursday", label: "Thu" },
    { key: "friday", label: "Fri" },
    { key: "saturday", label: "Sat" },
    { key: "sunday", label: "Sun" },
  ];

  const effectiveSchedule = schedule ?? {
    monday: { enabled: true, open: "09:00", close: "17:00" },
    tuesday: { enabled: true, open: "09:00", close: "17:00" },
    wednesday: { enabled: true, open: "09:00", close: "17:00" },
    thursday: { enabled: true, open: "09:00", close: "17:00" },
    friday: { enabled: true, open: "09:00", close: "17:00" },
    saturday: { enabled: false, open: "09:00", close: "17:00" },
    sunday: { enabled: false, open: "09:00", close: "17:00" },
  };

  const tzLabel = timeZone
    ? timeZone.replace("America/", "").replace(/_/g, " ")
    : "Eastern";

  return (
    <div className="rounded-xl border border-border-subtle bg-portal-card p-4">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <ClockIcon className="w-4 h-4 text-text-tertiary" />
          <span className="text-sm text-text-secondary">{getTodaysHours(effectiveSchedule)}</span>
        </div>
        <ChevronDownIcon className={`w-4 h-4 text-text-tertiary transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-border-subtle">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {days.map((day) => {
              const daySchedule = effectiveSchedule[day.key];
              return (
                <div key={day.key} className="flex items-center justify-between text-xs">
                  <span className="text-text-tertiary">{day.label}</span>
                  <span className={daySchedule.enabled ? "text-text-secondary" : "text-text-tertiary"}>
                    {daySchedule.enabled
                      ? `${formatTime(daySchedule.open)} - ${formatTime(daySchedule.close)}`
                      : "Closed"}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-[10px] text-text-tertiary">All times in {tzLabel} time</p>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// About Tab Content
// =============================================================================

interface AboutTabProps {
  profile: BreederProfileResponse;
}

function AboutTab({ profile }: AboutTabProps) {
  const hasLinks = profile.website || profile.socialLinks.instagram || profile.socialLinks.facebook;

  return (
    <div className="space-y-6">
      {/* Bio */}
      {profile.bio && (
        <div className="rounded-xl border border-border-subtle bg-portal-card p-5">
          <h3 className="text-sm font-semibold text-white mb-3">About Us</h3>
          <p className="text-[15px] text-text-secondary leading-relaxed">{profile.bio}</p>
        </div>
      )}

      {/* Business Hours */}
      <BusinessHoursDisplay schedule={profile.businessHours} timeZone={profile.timeZone} />

      {/* Links */}
      {hasLinks && (
        <div className="rounded-xl border border-border-subtle bg-portal-card p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Links</h3>
          <div className="flex flex-wrap gap-3">
            {profile.website && (
              <a
                href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-border-default text-sm text-text-secondary hover:text-white transition-colors"
              >
                <GlobeIcon className="w-4 h-4" />
                Website
              </a>
            )}
            {profile.socialLinks.instagram && (
              <a
                href={`https://instagram.com/${profile.socialLinks.instagram.replace(/^@/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-border-default text-sm text-text-secondary hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
                Instagram
              </a>
            )}
            {profile.socialLinks.facebook && (
              <a
                href={`https://facebook.com/${profile.socialLinks.facebook}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-border-default text-sm text-text-secondary hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </a>
            )}
          </div>
        </div>
      )}

      {/* Species & Breeds */}
      {profile.breeds.length > 0 && (
        <div className="rounded-xl border border-border-subtle bg-portal-card p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Breeds We Work With</h3>
          <div className="flex flex-wrap gap-2">
            {profile.breeds.map((breed) => (
              <span
                key={breed.name}
                className="px-3 py-1.5 rounded-full text-sm font-medium bg-border-default text-text-secondary border border-border-subtle"
              >
                {breed.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Standards & Credentials */}
      {profile.standardsAndCredentials && (
        <StandardsAndCredentialsSection data={profile.standardsAndCredentials} />
      )}

      {/* Placement Policies */}
      {profile.placementPolicies && (
        <PlacementPoliciesSection data={profile.placementPolicies} />
      )}
    </div>
  );
}

// =============================================================================
// Programs Tab Content
// =============================================================================

interface ProgramsTabProps {
  profile: BreederProfileResponse;
}

function ProgramsTab({ profile }: ProgramsTabProps) {
  if (profile.programs.length === 0) {
    return (
      <div className="rounded-xl border border-border-subtle bg-portal-card p-8 text-center">
        <p className="text-text-tertiary">No programs listed yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {profile.programs.map((program, idx) => (
        <ProgramCard
          key={`${program.name}-${idx}`}
          program={program}
          tenantSlug={profile.tenantSlug}
          businessName={profile.businessName}
        />
      ))}
    </div>
  );
}

// =============================================================================
// Reviews Tab Content
// =============================================================================

function ReviewsTab() {
  return (
    <div className="rounded-xl border border-border-subtle bg-portal-card p-8 text-center">
      <StarIcon className="w-12 h-12 mx-auto mb-4 text-text-tertiary" />
      <h3 className="text-lg font-semibold text-white mb-2">Reviews Coming Soon</h3>
      <p className="text-sm text-text-secondary max-w-md mx-auto">
        We're working on adding reviews to help you make informed decisions.
      </p>
    </div>
  );
}

// =============================================================================
// Floating CTA
// =============================================================================

interface FloatingCTAProps {
  profile: BreederProfileResponse;
}

function FloatingCTA({ profile }: FloatingCTAProps) {
  const navigate = useNavigate();
  const { startConversation, loading } = useStartConversation();

  const canContact = profile.programs.some(p => p.acceptInquiries);

  const handleContact = async () => {
    if (loading || !canContact) return;

    const result = await startConversation({
      context: {
        type: "general_inquiry",
        breederSlug: profile.tenantSlug,
      },
      participant: {
        name: profile.businessName,
        type: "breeder",
        slug: profile.tenantSlug,
      },
    });

    if (result) {
      navigate(`/inquiries?c=${result.conversation.id}`);
    }
  };

  if (!canContact) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-0 right-0 z-30 px-4 md:hidden">
      <button
        type="button"
        onClick={handleContact}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-[hsl(var(--brand-orange))] text-white font-medium shadow-lg shadow-black/30 hover:bg-[hsl(var(--brand-orange))]/90 transition-colors disabled:opacity-50"
      >
        <MessageIcon className="w-5 h-5" />
        {loading ? "Starting conversation..." : "Contact Breeder"}
      </button>
    </div>
  );
}

// =============================================================================
// Desktop Contact Card
// =============================================================================

interface ContactCardProps {
  profile: BreederProfileResponse;
}

function ContactCard({ profile }: ContactCardProps) {
  const navigate = useNavigate();
  const userProfile = useUserProfile();
  const { startConversation, loading } = useStartConversation();

  const canContact = profile.programs.some(p => p.acceptInquiries);
  const isAuthenticated = !!userProfile;

  const handleContact = async () => {
    if (loading || !canContact) return;

    const result = await startConversation({
      context: {
        type: "general_inquiry",
        breederSlug: profile.tenantSlug,
      },
      participant: {
        name: profile.businessName,
        type: "breeder",
        slug: profile.tenantSlug,
      },
    });

    if (result) {
      navigate(`/inquiries?c=${result.conversation.id}`);
    }
  };

  return (
    <div className="rounded-xl border border-border-subtle bg-portal-card p-5 sticky top-4 space-y-4">
      <h3 className="font-semibold text-white">Get in Touch</h3>

      {canContact ? (
        <button
          type="button"
          onClick={handleContact}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-[hsl(var(--brand-orange))] text-white font-medium hover:bg-[hsl(var(--brand-orange))]/90 transition-colors disabled:opacity-50"
        >
          <MessageIcon className="w-5 h-5" />
          {loading ? "Opening..." : "Contact Breeder"}
        </button>
      ) : (
        <p className="text-sm text-text-tertiary text-center py-2">
          Not currently accepting inquiries
        </p>
      )}

      {/* Report button */}
      {isAuthenticated && (
        <div className="pt-4 border-t border-border-subtle">
          <ReportBreederButton
            breederTenantSlug={profile.tenantSlug}
            breederName={profile.businessName}
            variant="text"
          />
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Main Page Component
// =============================================================================

export function BreederPage() {
  const { tenantSlug = "" } = useParams<{ tenantSlug: string }>();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [notPublished, setNotPublished] = React.useState(false);
  const [profile, setProfile] = React.useState<BreederProfileResponse | null>(null);
  const [activeTab, setActiveTab] = React.useState<TabType>("about");

  const fetchProfile = React.useCallback(async () => {
    if (!tenantSlug) {
      setError("Invalid breeder URL");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setNotPublished(false);

    try {
      const { data } = await apiGet<BreederProfileResponse>(
        `/api/v1/marketplace/breeders/${encodeURIComponent(tenantSlug)}`
      );
      setProfile(data);
    } catch (err: any) {
      if (err?.status === 404) {
        setNotPublished(true);
      } else {
        setError(getUserMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  React.useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  React.useEffect(() => {
    if (tenantSlug) {
      setOriginProgramSlug(tenantSlug);
    }
  }, [tenantSlug]);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
        <div className="h-32 md:h-48 bg-border-default rounded-xl" />
        <div className="flex gap-4 px-4">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl bg-border-default -mt-12 md:-mt-16" />
          <div className="flex-1 space-y-2 pt-4">
            <div className="h-8 bg-border-default rounded w-1/2" />
            <div className="h-4 bg-border-default rounded w-1/3" />
          </div>
        </div>
        <div className="h-12 bg-border-default rounded-lg" />
        <div className="h-48 bg-border-default rounded-xl" />
      </div>
    );
  }

  if (notPublished) {
    return <NotFoundState />;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-border-subtle bg-portal-card p-8 text-center max-w-md mx-auto">
        <p className="text-text-secondary text-sm mb-4">{error}</p>
        <button
          type="button"
          onClick={fetchProfile}
          className="px-4 py-2 rounded-lg bg-border-default border border-border-subtle text-sm font-medium text-white hover:bg-portal-card-hover transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const locationDisplay = buildLocationDisplay(profile.location, profile.publicLocationMode);

  return (
    <div className="pb-32 md:pb-8">
      {/* Breadcrumb */}
      <div className="mb-4">
        <Breadcrumb
          items={[
            { label: "All breeders", href: "/breeders" },
            { label: profile.businessName },
          ]}
        />
      </div>

      {/* Main Layout */}
      <div className="flex gap-8">
        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Hero */}
          <HeroSection profile={profile} locationDisplay={locationDisplay} />

          {/* Tabs */}
          <TabsNav
            activeTab={activeTab}
            onTabChange={setActiveTab}
            programCount={profile.programs.length}
            reviewCount={profile.reviewCount}
          />

          {/* Tab Content */}
          <div className="min-h-[300px]">
            {activeTab === "about" && <AboutTab profile={profile} />}
            {activeTab === "programs" && <ProgramsTab profile={profile} />}
            {activeTab === "reviews" && <ReviewsTab />}
          </div>
        </div>

        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-72 flex-shrink-0">
          <ContactCard profile={profile} />
        </aside>
      </div>

      {/* Mobile Floating CTA */}
      <FloatingCTA profile={profile} />
    </div>
  );
}

// =============================================================================
// Waitlist Modal Component
// =============================================================================

function WaitlistModal({
  programName,
  businessName,
  tenantSlug,
  onClose,
}: {
  programName: string;
  businessName: string;
  tenantSlug: string;
  onClose: () => void;
}) {
  const userProfile = useUserProfile();

  const defaultName = userProfile
    ? [userProfile.firstName, userProfile.lastName].filter(Boolean).join(" ") || userProfile.name || ""
    : "";
  const defaultEmail = userProfile?.email || "";
  const defaultPhone = userProfile?.phone || "";

  const [name, setName] = React.useState(defaultName);
  const [email, setEmail] = React.useState(defaultEmail);
  const [phone, setPhone] = React.useState(defaultPhone);
  const [message, setMessage] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await submitWaitlistRequest(tenantSlug, {
        programName,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        message: message.trim() || undefined,
        origin: getOriginData(),
      });
      setSuccess(true);
    } catch (err) {
      setError(getUserMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-portal-card border border-border-subtle rounded-xl shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckIcon className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Request Submitted!</h3>
            <p className="text-sm text-text-secondary mb-4">
              Your waitlist request for {programName} has been sent to {businessName}. They will be in touch soon!
            </p>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[hsl(var(--brand-orange))] text-white text-sm font-medium hover:bg-[hsl(var(--brand-orange))]/90 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-portal-card border border-border-subtle rounded-xl shadow-xl max-w-md w-full p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-text-tertiary hover:text-white transition-colors"
        >
          <XIcon className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-semibold text-white mb-1">Join Waitlist</h3>
        <p className="text-sm text-text-secondary mb-4">
          Request a spot on the waitlist for {programName} at {businessName}.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Your Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="w-full px-3 py-2 bg-border-default border border-border-subtle rounded-lg text-white placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Email <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-3 py-2 bg-border-default border border-border-subtle rounded-lg text-white placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Phone (optional)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 555-5555"
              className="w-full px-3 py-2 bg-border-default border border-border-subtle rounded-lg text-white placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Message (optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell the breeder a bit about yourself and what you're looking for..."
              rows={3}
              className="w-full px-3 py-2 bg-border-default border border-border-subtle rounded-lg text-white placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent resize-none"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg bg-border-default border border-border-subtle text-white text-sm font-medium hover:bg-portal-card-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 rounded-lg bg-[hsl(var(--brand-orange))] text-white text-sm font-medium hover:bg-[hsl(var(--brand-orange))]/90 transition-colors disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =============================================================================
// Program Card Component
// =============================================================================

type ProgramData = BreederProfileResponse["programs"][number];

function ProgramDetailsModal({
  program,
  tenantSlug,
  businessName,
  onClose,
}: {
  program: ProgramData;
  tenantSlug: string;
  businessName: string;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const { startConversation, loading: startingConversation } = useStartConversation();
  const [showWaitlistModal, setShowWaitlistModal] = React.useState(false);

  const handleMessage = async () => {
    if (startingConversation) return;

    const result = await startConversation({
      context: {
        type: "program_inquiry",
        programName: program.name,
        breederSlug: tenantSlug,
      },
      participant: {
        name: businessName,
        type: "breeder",
        slug: tenantSlug,
      },
    });

    if (result) {
      navigate(`/inquiries?c=${result.conversation.id}`);
    }
  };

  const showMessageButton = program.acceptInquiries;
  const showWaitlistButton = program.openWaitlist;
  const hasActionButtons = showMessageButton || showWaitlistButton;

  if (showWaitlistModal) {
    return (
      <WaitlistModal
        programName={program.name}
        businessName={businessName}
        tenantSlug={tenantSlug}
        onClose={() => setShowWaitlistModal(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-portal-card border border-border-subtle rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-text-tertiary hover:text-white transition-colors z-10"
        >
          <XIcon className="w-5 h-5" />
        </button>

        <div className="p-6">
          <div className="flex items-start gap-3 pr-8">
            <h3 className="text-xl font-semibold text-white">{program.name}</h3>
            {program.comingSoon && (
              <span className="text-[12px] text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 px-2 py-0.5 rounded-full whitespace-nowrap">
                Coming Soon
              </span>
            )}
          </div>

          <p className="text-sm text-text-secondary mt-1">{businessName}</p>

          {program.description && (
            <div className="mt-4 pt-4 border-t border-border-subtle">
              <p className="text-sm text-text-secondary leading-relaxed">{program.description}</p>
            </div>
          )}

          {hasActionButtons && (
            <div className="flex flex-col gap-3 mt-6 pt-4 border-t border-border-subtle">
              {showMessageButton && (
                <button
                  type="button"
                  onClick={handleMessage}
                  disabled={startingConversation}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[hsl(var(--brand-orange))] text-white text-sm font-medium hover:bg-[hsl(var(--brand-orange))]/90 transition-colors disabled:opacity-50"
                >
                  <MessageIcon className="w-5 h-5" />
                  {startingConversation ? "Opening..." : "Message Breeder"}
                </button>
              )}
              {showWaitlistButton && (
                <button
                  type="button"
                  onClick={() => setShowWaitlistModal(true)}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-border-default border border-border-subtle text-white text-sm font-medium hover:bg-portal-card-hover transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Join Waitlist
                </button>
              )}
            </div>
          )}

          {!hasActionButtons && (
            <div className="mt-6 pt-4 border-t border-border-subtle">
              <p className="text-sm text-text-tertiary text-center">
                This program is not currently accepting inquiries or waitlist requests.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProgramCard({
  program,
  tenantSlug,
  businessName,
}: {
  program: ProgramData;
  tenantSlug: string;
  businessName: string;
}) {
  const [showDetails, setShowDetails] = React.useState(false);

  const hasActions = program.acceptInquiries || program.openWaitlist;

  return (
    <>
      <button
        type="button"
        onClick={() => setShowDetails(true)}
        className="rounded-xl border border-border-subtle bg-portal-card p-5 text-left w-full hover:border-accent/50 hover:bg-portal-card-hover transition-colors group"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-white group-hover:text-accent transition-colors">
            {program.name}
          </h3>
          <div className="flex items-center gap-2">
            {program.comingSoon && (
              <span className="text-[12px] text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 px-2 py-0.5 rounded-full whitespace-nowrap">
                Coming Soon
              </span>
            )}
            <svg
              className="w-4 h-4 text-text-tertiary group-hover:text-accent transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        {program.description && (
          <p className="text-sm text-text-tertiary mt-2 leading-relaxed line-clamp-2">
            {program.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mt-3">
          {program.acceptInquiries && (
            <span className="text-[11px] text-accent bg-accent/10 px-2 py-0.5 rounded-full">
              Accepting Inquiries
            </span>
          )}
          {program.openWaitlist && (
            <span className="text-[11px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
              Waitlist Open
            </span>
          )}
          {!hasActions && !program.comingSoon && (
            <span className="text-[11px] text-text-tertiary bg-border-default px-2 py-0.5 rounded-full">
              Not Accepting
            </span>
          )}
        </div>
      </button>

      {showDetails && (
        <ProgramDetailsModal
          program={program}
          tenantSlug={tenantSlug}
          businessName={businessName}
          onClose={() => setShowDetails(false)}
        />
      )}
    </>
  );
}

// =============================================================================
// Standards & Credentials Section
// =============================================================================

function CredentialGroup({
  title,
  items,
  note,
}: {
  title: string;
  items: string[];
  note: string | null;
}) {
  if (items.length === 0 && !note) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-white uppercase tracking-wide border-b border-border-subtle pb-2">
        {title}
      </h3>
      {items.length > 0 && (
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-text-secondary">
              <CheckIcon className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
      {note && (
        <p className="text-sm text-text-tertiary italic mt-2">{note}</p>
      )}
    </div>
  );
}

function StandardsAndCredentialsSection({ data }: { data: StandardsAndCredentials }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-portal-card p-5">
      <h3 className="text-sm font-semibold text-white mb-4">Standards & Credentials</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CredentialGroup title="Registrations" items={data.registrations} note={data.registrationsNote} />
        <CredentialGroup title="Health Practices" items={data.healthPractices} note={data.healthNote} />
        <CredentialGroup title="Breeding Practices" items={data.breedingPractices} note={data.breedingNote} />
        <CredentialGroup title="Care Practices" items={data.carePractices} note={data.careNote} />
      </div>
    </div>
  );
}

// =============================================================================
// Placement Policies Section
// =============================================================================

const POLICY_LABELS: Record<string, string> = {
  requireApplication: "Application Required",
  requireInterview: "Interview Required",
  requireContract: "Contract Required",
  hasReturnPolicy: "Return Policy",
  offersSupport: "Ongoing Support",
};

function PlacementPoliciesSection({ data }: { data: PlacementPolicies }) {
  const enabledPolicies = Object.entries(POLICY_LABELS).filter(
    ([key]) => data[key as keyof PlacementPolicies] === true
  );

  return (
    <div className="rounded-xl border border-border-subtle bg-portal-card p-5">
      <h3 className="text-sm font-semibold text-white mb-4">Placement Policies</h3>
      {enabledPolicies.length > 0 && (
        <ul className="space-y-2">
          {enabledPolicies.map(([key, label]) => (
            <li key={key} className="flex items-center gap-2 text-sm text-text-secondary">
              <CheckIcon className="w-4 h-4 text-accent flex-shrink-0" />
              <span>{label}</span>
            </li>
          ))}
        </ul>
      )}
      {data.note && (
        <div className="pt-4 mt-4 border-t border-border-subtle">
          <p className="text-sm text-text-tertiary">{data.note}</p>
        </div>
      )}
    </div>
  );
}

export default BreederPage;
