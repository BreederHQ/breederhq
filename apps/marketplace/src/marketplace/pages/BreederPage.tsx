// apps/marketplace/src/marketplace/pages/BreederPage.tsx
// Public breeder profile page - displays published marketplace profile
import * as React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { apiGet, submitWaitlistRequest } from "../../api/client";
import { getUserMessage } from "../../api/errors";
import { Breadcrumb } from "../components/Breadcrumb";
import { useStartConversation } from "../../messages/hooks";
import { useUserProfile } from "../../gate/MarketplaceGate";
import { ReportBreederButton } from "../components/ReportBreederModal";

/**
 * Shape of the public breeder profile API response.
 */
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
}

/**
 * Not found state with "How to publish" collapsible panel.
 */
function NotFoundState() {
  const [showHowTo, setShowHowTo] = React.useState(false);

  return (
    <div className="space-y-4 max-w-md mx-auto">
      <Breadcrumb
        items={[
          { label: "All breeders", href: "/breeders" },
          { label: "Not found" },
        ]}
      />
      <div className="rounded-portal border border-border-subtle bg-portal-card shadow-portal p-8 text-center">
        <h2 className="text-lg font-semibold text-white mb-2">Breeder not found</h2>
        <p className="text-text-secondary text-sm mb-4">
          This breeder profile does not exist, or it has not been published yet.
        </p>
        <div className="flex flex-col items-center gap-3">
          <Link
            to="/breeders"
            className="inline-block px-4 py-2 rounded-portal-xs bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
          >
            Browse breeders
          </Link>
          <button
            type="button"
            onClick={() => setShowHowTo(!showHowTo)}
            className="text-sm text-text-tertiary hover:text-text-secondary transition-colors flex items-center gap-1"
          >
            How to publish
            <svg
              className={`w-4 h-4 transition-transform ${showHowTo ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* How to publish panel */}
        {showHowTo && (
          <div className="mt-4 pt-4 border-t border-border-subtle text-left">
            <ol className="text-sm text-text-secondary space-y-2 list-decimal list-inside">
              <li>Go to Platform Settings → Marketplace</li>
              <li>Fill out your breeder profile</li>
              <li>Ensure at least one breed and one listed program</li>
              <li>Click Publish to Marketplace</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Build a display string for location based on mode.
 */
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

/**
 * Format time from HH:mm to 12-hour format
 */
function formatTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

/**
 * Get today's business hours summary
 */
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

/**
 * Business hours display component
 */
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

  // Default schedule if none set
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
    <div className="rounded-portal border border-border-subtle bg-portal-card p-4">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-text-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="text-sm text-text-secondary">{getTodaysHours(effectiveSchedule)}</span>
        </div>
        <svg
          className={`w-4 h-4 text-text-tertiary transition-transform ${expanded ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
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

/**
 * Breeder Header Component - includes name, badges, and report button
 */
function BreederHeader({
  profile,
  locationDisplay,
}: {
  profile: BreederProfileResponse;
  locationDisplay: string;
}) {
  const userProfile = useUserProfile();
  const isAuthenticated = !!userProfile;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-[28px] font-bold text-white tracking-tight leading-tight">
            {profile.businessName}
          </h1>
          {profile.quickResponderBadge && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-accent/20 text-accent border border-accent/30">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Quick Responder
            </span>
          )}
        </div>

        {/* Report button - only show when authenticated */}
        {isAuthenticated && (
          <ReportBreederButton
            breederTenantSlug={profile.tenantSlug}
            breederName={profile.businessName}
            variant="text"
          />
        )}
      </div>
      {locationDisplay && (
        <p className="text-text-secondary text-sm mt-1">{locationDisplay}</p>
      )}
    </div>
  );
}

/**
 * Public breeder profile page.
 */
export function BreederPage() {
  const { tenantSlug = "" } = useParams<{ tenantSlug: string }>();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [notPublished, setNotPublished] = React.useState(false);
  const [profile, setProfile] = React.useState<BreederProfileResponse | null>(null);

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

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <div className="h-4 bg-border-default rounded animate-pulse w-32" />
        <div className="h-8 bg-border-default rounded animate-pulse w-1/2" />
        <div className="h-4 bg-border-default rounded animate-pulse w-1/4" />
        <div className="rounded-portal border border-border-subtle bg-portal-card p-5 space-y-3">
          <div className="h-5 bg-border-default rounded animate-pulse w-2/3" />
          <div className="h-4 bg-border-default rounded animate-pulse w-full" />
          <div className="h-4 bg-border-default rounded animate-pulse w-1/2" />
        </div>
      </div>
    );
  }

  // Not published state
  if (notPublished) {
    return <NotFoundState />;
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-portal border border-border-subtle bg-portal-card shadow-portal p-8 text-center max-w-md mx-auto">
        <p className="text-text-secondary text-sm mb-4">{error}</p>
        <button
          type="button"
          onClick={fetchProfile}
          className="px-4 py-2 rounded-portal-xs bg-border-default border border-border-subtle text-sm font-medium text-white hover:bg-portal-card-hover transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  // No profile (shouldn't happen if no error/notPublished)
  if (!profile) {
    return null;
  }

  // Extract display data
  const locationDisplay = buildLocationDisplay(profile.location, profile.publicLocationMode);
  const hasLinks = profile.website || profile.socialLinks.instagram || profile.socialLinks.facebook;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "All breeders", href: "/breeders" },
          { label: profile.businessName },
        ]}
      />

      {/* Header */}
      <BreederHeader
        profile={profile}
        locationDisplay={locationDisplay}
      />

      {/* Business Hours */}
      <BusinessHoursDisplay schedule={profile.businessHours} timeZone={profile.timeZone} />

      {/* Bio */}
      {profile.bio && (
        <div className="rounded-portal border border-border-subtle bg-portal-card p-5">
          <p className="text-[15px] text-text-secondary leading-relaxed">{profile.bio}</p>
        </div>
      )}

      {/* Links - Website and Socials */}
      {hasLinks && (
        <div className="flex flex-wrap gap-4">
          {profile.website && (
            <a
              href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-accent hover:text-accent-hover transition-colors"
            >
              Website
            </a>
          )}
          {profile.socialLinks.instagram && (
            <a
              href={`https://instagram.com/${profile.socialLinks.instagram.replace(/^@/, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-accent hover:text-accent-hover transition-colors"
            >
              Instagram
            </a>
          )}
          {profile.socialLinks.facebook && (
            <a
              href={`https://facebook.com/${profile.socialLinks.facebook}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-accent hover:text-accent-hover transition-colors"
            >
              Facebook
            </a>
          )}
        </div>
      )}

      {/* Species & Breeds */}
      {profile.breeds.length > 0 && (
        <div className="space-y-2">
          {/* Extract unique species from breeds */}
          {(() => {
            const uniqueSpecies = [...new Set(profile.breeds.map((b) => b.species).filter(Boolean))] as string[];
            return uniqueSpecies.length > 0 && (
              <div className="mb-3">
                <h2 className="text-sm font-medium text-text-tertiary mb-2">Species</h2>
                <div className="flex flex-wrap gap-2">
                  {uniqueSpecies.map((species) => (
                    <span
                      key={species}
                      className="px-3 py-1.5 rounded-full text-sm font-medium bg-accent/20 text-accent border border-accent/30"
                    >
                      {species}
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}
          <h2 className="text-sm font-medium text-text-tertiary">Breeds</h2>
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

      {/* Programs */}
      {profile.programs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Our Current Breeding Programs</h2>
          <div className="grid grid-cols-1 gap-4">
            {profile.programs.map((program, idx) => (
              <ProgramCard
                key={`${program.name}-${idx}`}
                program={program}
                tenantSlug={profile.tenantSlug}
                businessName={profile.businessName}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty programs state */}
      {profile.programs.length === 0 && (
        <div className="rounded-portal border border-border-subtle bg-portal-card p-5 text-center">
          <p className="text-text-tertiary text-sm">No programs listed yet.</p>
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

// ============================================================================
// Waitlist Modal Component
// ============================================================================

/**
 * Modal for collecting user info and submitting waitlist request.
 */
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

  // Auto-populate from user profile
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

    // Basic validation
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
      });
      setSuccess(true);
    } catch (err) {
      setError(getUserMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="relative bg-portal-card border border-border-subtle rounded-portal shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Request Submitted!</h3>
            <p className="text-sm text-text-secondary mb-4">
              Your waitlist request for {programName} has been sent to {businessName}. They will be in touch soon!
            </p>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-portal-xs bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
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
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-portal-card border border-border-subtle rounded-portal shadow-xl max-w-md w-full p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-text-tertiary hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
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
              className="w-full px-3 py-2 bg-border-default border border-border-subtle rounded-portal-xs text-white placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
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
              className="w-full px-3 py-2 bg-border-default border border-border-subtle rounded-portal-xs text-white placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
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
              className="w-full px-3 py-2 bg-border-default border border-border-subtle rounded-portal-xs text-white placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
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
              className="w-full px-3 py-2 bg-border-default border border-border-subtle rounded-portal-xs text-white placeholder-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent resize-none"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-portal-xs">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-portal-xs bg-border-default border border-border-subtle text-white text-sm font-medium hover:bg-portal-card-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 rounded-portal-xs bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// Program Card Component
// ============================================================================

type ProgramData = BreederProfileResponse["programs"][number];

/**
 * Program Details Modal - shows full program info with action buttons
 */
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

  // Handle message breeder button
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

  // If waitlist modal is open, show that instead
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
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-portal-card border border-border-subtle rounded-portal shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-text-tertiary hover:text-white transition-colors z-10"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start gap-3 pr-8">
            <h3 className="text-xl font-semibold text-white">{program.name}</h3>
            {program.comingSoon && (
              <span className="text-[12px] text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 px-2 py-0.5 rounded-full whitespace-nowrap">
                Coming Soon
              </span>
            )}
          </div>

          {/* Breeder name */}
          <p className="text-sm text-text-secondary mt-1">{businessName}</p>

          {/* Description */}
          {program.description && (
            <div className="mt-4 pt-4 border-t border-border-subtle">
              <p className="text-sm text-text-secondary leading-relaxed">
                {program.description}
              </p>
            </div>
          )}

          {/* Action buttons */}
          {hasActionButtons && (
            <div className="flex flex-col gap-3 mt-6 pt-4 border-t border-border-subtle">
              {showMessageButton && (
                <button
                  type="button"
                  onClick={handleMessage}
                  disabled={startingConversation}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-portal-xs bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  {startingConversation ? "Opening..." : "Message Breeder"}
                </button>
              )}
              {showWaitlistButton && (
                <button
                  type="button"
                  onClick={() => setShowWaitlistModal(true)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-portal-xs bg-border-default border border-border-subtle text-white text-sm font-medium hover:bg-portal-card-hover transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Join Waitlist
                </button>
              )}
            </div>
          )}

          {/* No actions available message */}
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

/**
 * Program card - clickable to open details modal
 */
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
        className="rounded-portal border border-border-subtle bg-portal-card p-5 text-left w-full hover:border-accent/50 hover:bg-portal-card-hover transition-colors group"
      >
        {/* Header with name and badges */}
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
            {/* Chevron indicator */}
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

        {/* Description preview */}
        {program.description && (
          <p className="text-sm text-text-tertiary mt-2 leading-relaxed line-clamp-2">
            {program.description}
          </p>
        )}

        {/* Status indicators */}
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

      {/* Details Modal */}
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

// ============================================================================
// Standards & Credentials Section
// ============================================================================

/**
 * Renders a single credential group with items and optional note.
 */
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
              <svg
                className="w-4 h-4 text-accent flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
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

/**
 * Standards & Credentials section.
 */
function StandardsAndCredentialsSection({ data }: { data: StandardsAndCredentials }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Standards & Credentials</h2>
      <div className="rounded-portal border border-border-subtle bg-portal-card p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CredentialGroup
            title="Registrations"
            items={data.registrations}
            note={data.registrationsNote}
          />
          <CredentialGroup
            title="Health Practices"
            items={data.healthPractices}
            note={data.healthNote}
          />
          <CredentialGroup
            title="Breeding Practices"
            items={data.breedingPractices}
            note={data.breedingNote}
          />
          <CredentialGroup
            title="Care Practices"
            items={data.carePractices}
            note={data.careNote}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Placement Policies Section
// ============================================================================

const POLICY_LABELS: Record<string, string> = {
  requireApplication: "Application Required",
  requireInterview: "Interview Required",
  requireContract: "Contract Required",
  hasReturnPolicy: "Return Policy",
  offersSupport: "Ongoing Support",
};

/**
 * Placement Policies section.
 */
function PlacementPoliciesSection({ data }: { data: PlacementPolicies }) {
  const enabledPolicies = Object.entries(POLICY_LABELS).filter(
    ([key]) => data[key as keyof PlacementPolicies] === true
  );

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Placement Policies</h2>
      <div className="rounded-portal border border-border-subtle bg-portal-card p-5 space-y-4">
        {enabledPolicies.length > 0 && (
          <ul className="space-y-2">
            {enabledPolicies.map(([key, label]) => (
              <li key={key} className="flex items-center gap-2 text-sm text-text-secondary">
                <svg
                  className="w-4 h-4 text-accent flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{label}</span>
              </li>
            ))}
          </ul>
        )}
        {data.note && (
          <div className="pt-2 border-t border-border-subtle">
            <p className="text-sm text-text-tertiary">{data.note}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default BreederPage;
