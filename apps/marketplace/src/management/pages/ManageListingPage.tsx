// apps/marketplace/src/management/pages/ManageListingPage.tsx
import React from "react";
import { Button, SectionCard, Badge } from "@bhq/ui";
import { confirmDialog } from "@bhq/ui/utils";

/* ─────────────────────────────────────────────────────────────────────────────
   ManageListingPage - Breeder Marketplace Profile Management

   Draft-to-publish flow with localStorage persistence (keyed by tenantId).
   Preview uses DRAFT state. Publish copies draft -> published snapshot.
───────────────────────────────────────────────────────────────────────────── */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type ManageListingPageProps = {
  // No props needed - self-contained page
};

type PublicLocationMode = "city_state" | "zip_only" | "full" | "hidden";

// Pricing tier for a program
type ProgramPricingTier = {
  tier: string;             // "Pet", "Show/Breeding", etc.
  priceRange: string;       // "$2,000 - $2,500"
  description?: string;     // What's included at this tier
};

type ProgramData = {
  id: string;
  name: string;
  description: string;
  status: boolean;
  // Availability toggles (can be combined)
  acceptInquiries: boolean;
  openWaitlist: boolean;
  comingSoon: boolean;
  breeds?: string[];

  // === Program-specific enhanced fields ===
  // (Health testing, registrations, policies are at breeder profile level)

  // Pricing & What's Included (program-specific)
  pricingTiers?: ProgramPricingTier[];
  whatsIncluded?: string;             // 1000 char - vaccinations, microchip, etc.
  typicalWaitTime?: string;           // "3-6 months" - waitlist timing
};

type MarketplaceProfileDraft = {
  businessName: string;
  logoAssetId: string | null;
  bio: string;
  showBusinessIdentity: boolean;
  websiteUrl: string;
  showWebsite: boolean;
  instagram: string;
  showInstagram: boolean;
  facebook: string;
  showFacebook: boolean;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  publicLocationMode: PublicLocationMode;
  searchParticipation: {
    distanceSearch: boolean;
    citySearch: boolean;
    zipRadius: boolean;
  };
  // Breeds selected for marketplace listing (by name)
  listedBreeds: string[];
  // Programs created by the user
  programs: ProgramData[];
  standardsAndCredentials: {
    registrations: string[];
    registrationsNote: string;
    healthPractices: string[];
    healthNote: string;
    breedingPractices: string[];
    breedingNote: string;
    carePractices: string[];
    careNote: string;
  };
  placementPolicies: {
    requireApplication: boolean;
    requireInterview: boolean;
    requireContract: boolean;
    hasReturnPolicy: boolean;
    offersSupport: boolean;
    note: string;
  };
  updatedAt: string | null;
};

type MarketplacePublishedSnapshot = MarketplaceProfileDraft & {
  publishedAt: string;
};

// ═══════════════════════════════════════════════════════════════════════════
// HANDLE TYPE (for SettingsPanel ref integration)
// ═══════════════════════════════════════════════════════════════════════════

export type MarketplaceHandle = {
  save: () => Promise<void>;
};

// ═══════════════════════════════════════════════════════════════════════════
// API HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function readCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
  if (meta?.content) return meta.content;
  // Check for XSRF-TOKEN cookie (standard name used by API)
  const m = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);
  return m ? decodeURIComponent(m[1]) : null;
}

async function fetchMarketplaceProfile(tenantId: string): Promise<{
  draft: MarketplaceProfileDraft | null;
  draftUpdatedAt: string | null;
  published: MarketplacePublishedSnapshot | null;
  publishedAt: string | null;
}> {
  const res = await fetch("/api/v1/marketplace/profile", {
    credentials: "include",
    headers: {
      Accept: "application/json",
      "X-Tenant-Id": tenantId,
    },
  });
  if (!res.ok) {
    console.error("Failed to fetch marketplace profile:", res.status);
    return { draft: null, draftUpdatedAt: null, published: null, publishedAt: null };
  }
  return res.json();
}

async function saveMarketplaceDraft(tenantId: string, draftData: MarketplaceProfileDraft): Promise<{ ok: boolean; draftUpdatedAt?: string }> {
  const csrf = readCsrfToken();
  const res = await fetch("/api/v1/marketplace/profile/draft", {
    method: "PUT",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Tenant-Id": tenantId,
      ...(csrf ? { "X-CSRF-Token": csrf } : {}),
    },
    body: JSON.stringify(draftData),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function publishMarketplaceProfile(
  tenantId: string,
  payload: Record<string, unknown>
): Promise<{ ok: boolean; publishedAt?: string; tenantSlug?: string; errors?: string[] }> {
  const csrf = readCsrfToken();
  const res = await fetch("/api/v1/marketplace/profile/publish", {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Tenant-Id": tenantId,
      ...(csrf ? { "X-CSRF-Token": csrf } : {}),
    },
    body: JSON.stringify(payload),
  });
  const body = await res.json();
  if (!res.ok) {
    return { ok: false, errors: body.errors || [`API error: ${res.status}`] };
  }
  return body;
}

// Business Hours types
interface DaySchedule {
  enabled: boolean;
  open: string;  // "HH:mm" format, e.g. "09:00"
  close: string; // "HH:mm" format, e.g. "17:00"
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

interface BusinessHoursConfig {
  schedule: BusinessHoursSchedule;
  timeZone: string;
}

const DEFAULT_BUSINESS_HOURS: BusinessHoursSchedule = {
  monday: { enabled: true, open: "09:00", close: "17:00" },
  tuesday: { enabled: true, open: "09:00", close: "17:00" },
  wednesday: { enabled: true, open: "09:00", close: "17:00" },
  thursday: { enabled: true, open: "09:00", close: "17:00" },
  friday: { enabled: true, open: "09:00", close: "17:00" },
  saturday: { enabled: false, open: "09:00", close: "17:00" },
  sunday: { enabled: false, open: "09:00", close: "17:00" },
};

async function fetchBusinessHours(tenantId: string): Promise<BusinessHoursConfig | null> {
  const res = await fetch("/api/v1/business-hours", {
    credentials: "include",
    headers: {
      Accept: "application/json",
      "X-Tenant-Id": tenantId,
    },
  });
  if (!res.ok) {
    console.error("Failed to fetch business hours:", res.status);
    return null;
  }
  return res.json();
}

async function saveBusinessHours(tenantId: string, config: BusinessHoursConfig): Promise<{ ok: boolean }> {
  const csrf = readCsrfToken();
  const res = await fetch("/api/v1/business-hours", {
    method: "PUT",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Tenant-Id": tenantId,
      ...(csrf ? { "X-CSRF-Token": csrf } : {}),
    },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function unpublishMarketplaceProfile(
  tenantId: string
): Promise<{ ok: boolean; error?: string }> {
  const csrf = readCsrfToken();
  const res = await fetch("/api/v1/marketplace/profile/unpublish", {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Tenant-Id": tenantId,
      ...(csrf ? { "X-CSRF-Token": csrf } : {}),
    },
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { ok: false, error: body.message || body.error || `API error: ${res.status}` };
  }
  return { ok: true };
}
// ═══════════════════════════════════════════════════════════════════════════
// PERSISTENCE HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function getTenantId(): string {
  try {
    const w: any = typeof window !== "undefined" ? window : {};
    return w.__BHQ_TENANT_ID__ || localStorage.getItem("BHQ_TENANT_ID") || "default";
  } catch { return "default"; }
}

function getStorageKey(suffix: string): string {
  return `bhq_marketplace_${suffix}_${getTenantId()}`;
}

function createEmptyDraft(): MarketplaceProfileDraft {
  return {
    businessName: "",
    logoAssetId: null,
    bio: "",
    showBusinessIdentity: true,
    websiteUrl: "",
    showWebsite: false,
    instagram: "",
    showInstagram: false,
    facebook: "",
    showFacebook: false,
    address: {
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "",
    },
    publicLocationMode: "city_state",
    searchParticipation: {
      distanceSearch: true,
      citySearch: true,
      zipRadius: true,
    },
    listedBreeds: [],
    programs: [],
    standardsAndCredentials: {
      registrations: [],
      registrationsNote: "",
      healthPractices: [],
      healthNote: "",
      breedingPractices: [],
      breedingNote: "",
      carePractices: [],
      careNote: "",
    },
    placementPolicies: {
      requireApplication: false,
      requireInterview: false,
      requireContract: false,
      hasReturnPolicy: false,
      offersSupport: false,
      note: "",
    },
    updatedAt: null,
  };
}

// Note: localStorage functions removed - API persistence only

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC PAYLOAD BUILDER
// ═══════════════════════════════════════════════════════════════════════════

type MarketplacePublicProfile = {
  businessName: string;
  logoAssetId: string | null;
  bio: string;
  websiteUrl: string | null;
  instagram: string | null;
  facebook: string | null;
  locationDisplay: string;
  searchParticipation: {
    distanceSearch: boolean;
    citySearch: boolean;
    zipRadius: boolean;
  };
  breeds: string[];
  listedPrograms: { name: string; description: string; acceptInquiries: boolean; openWaitlist: boolean; comingSoon: boolean }[];
  standardsAndCredentials: {
    registrations: string[];
    healthPractices: string[];
    breedingPractices: string[];
    carePractices: string[];
  };
  placementPolicies: {
    requireApplication: boolean;
    requireInterview: boolean;
    requireContract: boolean;
    hasReturnPolicy: boolean;
    offersSupport: boolean;
  };
  publishedAt: string | null;
};

function buildLocationDisplay(
  address: MarketplaceProfileDraft["address"],
  mode: PublicLocationMode
): string {
  switch (mode) {
    case "city_state":
      return address.city && address.state ? `${address.city}, ${address.state}` : "";
    case "zip_only":
      return address.zip || "";
    case "full":
      return address.city && address.state && address.zip
        ? `${address.city}, ${address.state} ${address.zip}`
        : "";
    case "hidden":
    default:
      return "";
  }
}

function buildMarketplacePublicProfile(
  published: MarketplacePublishedSnapshot | null,
  programsState: { name: string; description: string; status: boolean; acceptInquiries: boolean; openWaitlist: boolean; comingSoon: boolean }[]
): MarketplacePublicProfile | null {
  if (!published) return null;

  return {
    businessName: published.businessName,
    logoAssetId: published.logoAssetId,
    bio: published.bio,
    // Only include if toggle is ON
    websiteUrl: published.showWebsite && published.websiteUrl ? published.websiteUrl : null,
    instagram: published.showInstagram && published.instagram ? published.instagram : null,
    facebook: published.showFacebook && published.facebook ? published.facebook : null,
    // Never include street address - only computed display
    locationDisplay: buildLocationDisplay(published.address, published.publicLocationMode),
    searchParticipation: published.searchParticipation,
    // Only include breeds that were toggled ON for marketplace
    breeds: published.listedBreeds,
    listedPrograms: programsState
      .filter((p) => p.status)
      .map((p) => ({ name: p.name, description: p.description, acceptInquiries: p.acceptInquiries, openWaitlist: p.openWaitlist, comingSoon: p.comingSoon })),
    standardsAndCredentials: {
      registrations: published.standardsAndCredentials.registrations,
      healthPractices: published.standardsAndCredentials.healthPractices,
      breedingPractices: published.standardsAndCredentials.breedingPractices,
      carePractices: published.standardsAndCredentials.carePractices,
    },
    placementPolicies: {
      requireApplication: published.placementPolicies.requireApplication,
      requireInterview: published.placementPolicies.requireInterview,
      requireContract: published.placementPolicies.requireContract,
      hasReturnPolicy: published.placementPolicies.hasReturnPolicy,
      offersSupport: published.placementPolicies.offersSupport,
    },
    publishedAt: published.publishedAt,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

const INPUT_CLS = "w-full bg-card border border-hairline rounded-md px-3 h-10 text-sm placeholder:text-secondary outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))]";
const TEXTAREA_CLS = "w-full bg-card border border-hairline rounded-md px-3 py-2 text-sm placeholder:text-secondary outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))] resize-none";
const LABEL_CLS = "block text-sm font-medium text-primary mb-1";
const SUBLABEL_CLS = "text-xs text-secondary mb-2";

function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean }) {
  return (
    <label className={["inline-flex items-center gap-2", disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"].join(" ")}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={[
          "relative w-10 h-5 rounded-full transition-colors",
          checked ? "bg-[hsl(var(--brand-orange))]" : "bg-surface-strong border border-hairline",
          disabled ? "cursor-not-allowed" : "",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-0",
          ].join(" ")}
        />
      </button>
      {label && <span className="text-sm text-secondary">{label}</span>}
    </label>
  );
}

function Checkbox({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <label className={["flex items-center gap-2", disabled ? "cursor-not-allowed" : "cursor-pointer"].join(" ")}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => !disabled && onChange(e.target.checked)}
        disabled={disabled}
        className={[
          "w-4 h-4 rounded border-hairline bg-card accent-[hsl(var(--brand-orange))]",
          disabled && checked ? "opacity-100" : disabled ? "opacity-40" : ""
        ].filter(Boolean).join(" ")}
      />
      <span className={["text-sm", disabled ? "text-secondary" : "text-primary"].join(" ")}>{label}</span>
    </label>
  );
}

function RadioGroup({ value, onChange, options, name }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; name: string }) {
  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={(e) => onChange(e.target.value)}
            className="w-4 h-4 border-hairline bg-card accent-[hsl(var(--brand-orange))]"
          />
          <span className="text-sm text-primary">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}

function SpeciesChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "px-3 py-1.5 rounded-full text-sm font-medium transition-colors border",
        selected
          ? "bg-[hsl(var(--brand-orange))] text-white border-transparent"
          : "bg-surface-strong text-secondary border-hairline hover:border-[hsl(var(--brand-orange))]/50",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

// Visibility toggle pill button (for showing/hiding sections on marketplace)
function VisibilityToggle({ isPublic, onChange, disabled }: { isPublic: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!isPublic)}
      disabled={disabled}
      className={`
        inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-medium transition-all
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${isPublic
          ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
          : "bg-zinc-500/15 text-zinc-400 hover:bg-zinc-500/25"
        }
      `}
    >
      {isPublic ? (
        <>
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
          </svg>
          Public
        </>
      ) : (
        <>
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
            <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
          </svg>
          Unlisted
        </>
      )}
    </button>
  );
}

// Static badge for always-private fields
function PrivateBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-zinc-500/15 text-zinc-400 font-medium">
      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
      </svg>
      Private
    </span>
  );
}

function ProgramCard({
  name,
  description,
  status,
  acceptInquiries,
  openWaitlist,
  comingSoon,
  onToggle,
  onEdit,
  onDelete,
  isExample,
  onUseTemplate,
  onHideExample,
  disabled = false,
}: {
  name: string;
  description: string;
  status: boolean;
  acceptInquiries?: boolean;
  openWaitlist?: boolean;
  comingSoon?: boolean;
  onToggle: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isExample?: boolean;
  onUseTemplate?: () => void;
  onHideExample?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className={`rounded-lg border border-hairline bg-card p-4 space-y-3 ${disabled ? "opacity-70" : ""}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-primary">{name}</h4>
            {isExample && (
              <Badge variant="neutral" className="text-[10px]">Example</Badge>
            )}
          </div>
          <p className="text-sm text-secondary mt-1 line-clamp-2">{description}</p>
        </div>
        {!isExample && (
          <Toggle checked={status} onChange={onToggle} label="Show in Marketplace" disabled={disabled} />
        )}
      </div>
      <div className="flex items-center flex-wrap gap-2 text-xs">
        <Badge variant={status ? "green" : "neutral"}>
          {status ? "Listed" : "Hidden"}
        </Badge>
        {acceptInquiries && <Badge variant="neutral">Inquiries</Badge>}
        {openWaitlist && <Badge variant="neutral">Waitlist Open</Badge>}
        {comingSoon && <Badge variant="amber">Coming Soon</Badge>}
        {!acceptInquiries && !openWaitlist && !comingSoon && !isExample && (
          <Badge variant="neutral">No Actions Enabled</Badge>
        )}
      </div>
      {isExample ? (
        <div className={`flex items-center gap-3 ${disabled ? "pointer-events-none" : ""}`}>
          <button
            type="button"
            onClick={onUseTemplate}
            disabled={disabled}
            className={`text-xs text-[hsl(var(--brand-orange))] hover:underline ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
          >
            Use this template
          </button>
          <button
            type="button"
            onClick={onHideExample}
            disabled={disabled}
            className={`text-xs text-secondary hover:text-primary ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
          >
            Hide example
          </button>
        </div>
      ) : (
        <div className={`flex items-center gap-3 ${disabled ? "pointer-events-none" : ""}`}>
          <button
            type="button"
            onClick={onEdit}
            disabled={disabled}
            className={`text-xs text-[hsl(var(--brand-orange))] hover:underline ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
          >
            Edit program
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={disabled}
            className={`text-xs text-secondary hover:text-red-400 ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function CredentialsChecklist({
  title,
  items,
  selected,
  onToggle,
  noteValue,
  onNoteChange,
  noteMaxLength = 200,
  disabled = false,
}: {
  title: string;
  items: string[];
  selected: string[];
  onToggle: (item: string) => void;
  noteValue: string;
  onNoteChange: (v: string) => void;
  noteMaxLength?: number;
  disabled?: boolean;
}) {
  return (
    <div className={`space-y-3 ${disabled ? "pointer-events-none" : ""}`}>
      <h4 className="text-sm font-medium text-primary">{title}</h4>
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <Checkbox
            key={item}
            checked={selected.includes(item)}
            onChange={() => onToggle(item)}
            label={item}
            disabled={disabled}
          />
        ))}
      </div>
      <div>
        <textarea
          value={noteValue}
          onChange={(e) => onNoteChange(e.target.value.slice(0, noteMaxLength))}
          placeholder="Optional notes..."
          rows={2}
          disabled={disabled}
          className={`${TEXTAREA_CLS} ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
        />
        <div className="text-xs text-secondary text-right mt-1">
          {noteValue.length}/{noteMaxLength}
        </div>
      </div>
    </div>
  );
}

function MarketplacePreviewCard({
  businessName,
  locationDisplay,
  breeds,
}: {
  businessName: string;
  locationDisplay: string;
  breeds: string[];
}) {
  return (
    <div className="rounded-xl border-2 border-dashed border-hairline bg-surface-strong/50 p-4 max-w-sm">
      <div className="text-xs text-secondary uppercase tracking-wide mb-3">Preview (Draft)</div>
      <div className="flex gap-4">
        <div className="w-16 h-16 rounded-lg bg-card border border-hairline flex items-center justify-center text-2xl text-secondary shrink-0">
          🐾
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-primary truncate">{businessName || "Your Business Name"}</h4>
          <p className="text-sm text-secondary">{locationDisplay || "Location not set"}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {breeds.length > 0 ? (
              breeds.slice(0, 3).map((b) => (
                <span key={b} className="text-xs bg-surface-strong px-2 py-0.5 rounded-full border border-hairline">
                  {b}
                </span>
              ))
            ) : (
              <span className="text-xs text-secondary italic">No breeds selected</span>
            )}
            {breeds.length > 3 && (
              <span className="text-xs text-secondary">+{breeds.length - 3} more</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type ProgramFormData = {
  name: string;
  description: string;
  breeds: string[];
  listed: boolean;
  acceptInquiries: boolean;
  openWaitlist: boolean;
  comingSoon: boolean;

  // === Program-specific enhanced fields ===
  pricingTiers?: ProgramPricingTier[];
  whatsIncluded?: string;
  typicalWaitTime?: string;
};

function CreateProgramModal({
  open,
  onClose,
  onCreate,
  availableBreeds,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: ProgramFormData) => void;
  availableBreeds: string[];
}) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [selectedBreeds, setSelectedBreeds] = React.useState<string[]>([]);
  const [listed, setListed] = React.useState(false);
  const [acceptInquiries, setAcceptInquiries] = React.useState(true);
  const [openWaitlist, setOpenWaitlist] = React.useState(false);
  const [comingSoon, setComingSoon] = React.useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({
      name: name.trim(),
      description: description.trim(),
      breeds: selectedBreeds,
      listed,
      acceptInquiries,
      openWaitlist,
      comingSoon,
    });
    setName("");
    setDescription("");
    setSelectedBreeds([]);
    setListed(false);
    setAcceptInquiries(true);
    setOpenWaitlist(false);
    setComingSoon(false);
    onClose();
  }

  function toggleBreed(breed: string) {
    setSelectedBreeds((prev) =>
      prev.includes(breed) ? prev.filter((b) => b !== breed) : [...prev, breed]
    );
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-surface-strong border border-hairline rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-auto">
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-primary">Create Program</h3>
              <button
                type="button"
                onClick={onClose}
                className="text-secondary hover:text-primary text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div>
              <label className={LABEL_CLS}>
                Program Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Golden Retriever Program"
                className={INPUT_CLS}
                required
              />
            </div>

            <div>
              <label className={LABEL_CLS}>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 300))}
                placeholder="Describe your breeding program..."
                rows={3}
                className={TEXTAREA_CLS}
              />
              <div className="text-xs text-secondary text-right mt-1">
                {description.length}/300
              </div>
            </div>

            <div>
              <label className={LABEL_CLS}>Associated Breeds</label>
              <p className={SUBLABEL_CLS}>Select breeds included in this program.</p>
              {availableBreeds.length === 0 ? (
                <p className="text-sm text-secondary italic">No breeds available.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableBreeds.map((breed) => (
                    <button
                      key={breed}
                      type="button"
                      onClick={() => toggleBreed(breed)}
                      className={[
                        "px-3 py-1.5 rounded-full text-sm font-medium transition-colors border",
                        selectedBreeds.includes(breed)
                          ? "bg-[hsl(var(--brand-orange))] text-white border-transparent"
                          : "bg-surface-strong text-secondary border-hairline hover:border-[hsl(var(--brand-orange))]/50",
                      ].join(" ")}
                    >
                      {breed}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className={LABEL_CLS}>Availability Options</label>
              <p className={SUBLABEL_CLS}>Control how visitors can interact with this program listing.</p>
              <div className="space-y-3 mt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-primary">Accept Inquiries</label>
                    <p className="text-xs text-secondary">Allow visitors to send you messages about this program.</p>
                  </div>
                  <Toggle checked={acceptInquiries} onChange={setAcceptInquiries} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-primary">Open Waitlist</label>
                    <p className="text-xs text-secondary">Allow visitors to request a spot on your waitlist.</p>
                  </div>
                  <Toggle checked={openWaitlist} onChange={setOpenWaitlist} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-primary">Coming Soon</label>
                    <p className="text-xs text-secondary">Show a "Coming Soon" badge on this program.</p>
                  </div>
                  <Toggle checked={comingSoon} onChange={setComingSoon} />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-t border-hairline mt-2 pt-4">
              <div>
                <label className="text-sm font-medium text-primary">List in Marketplace</label>
                <p className="text-xs text-secondary">Make this program visible to buyers.</p>
              </div>
              <Toggle checked={listed} onChange={setListed} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-hairline bg-card/50">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Create Program
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Collapsible section component for EditProgramModal
function CollapsibleSection({
  title,
  expanded,
  onToggle,
  children,
  badge,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  badge?: string;
}) {
  return (
    <div className="border border-hairline rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface-strong hover:bg-surface-subtle transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-primary">{title}</span>
          {badge && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[hsl(var(--brand-orange))]/20 text-[hsl(var(--brand-orange))]">
              {badge}
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-secondary transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && <div className="px-4 py-4 space-y-4 border-t border-hairline">{children}</div>}
    </div>
  );
}

function EditProgramModal({
  open,
  program,
  onClose,
  onSave,
  onDelete,
  availableBreeds,
}: {
  open: boolean;
  program: ProgramData | null;
  onClose: () => void;
  onSave: (id: string, data: ProgramFormData) => void;
  onDelete: (id: string) => void;
  availableBreeds: string[];
}) {
  // Basic fields
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [selectedBreeds, setSelectedBreeds] = React.useState<string[]>([]);
  const [listed, setListed] = React.useState(false);
  const [acceptInquiries, setAcceptInquiries] = React.useState(true);
  const [openWaitlist, setOpenWaitlist] = React.useState(false);
  const [comingSoon, setComingSoon] = React.useState(false);

  // Program-specific enhanced fields
  const [pricingTiers, setPricingTiers] = React.useState<ProgramPricingTier[]>([]);
  const [whatsIncluded, setWhatsIncluded] = React.useState("");
  const [typicalWaitTime, setTypicalWaitTime] = React.useState("");

  // Section expansion state
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({
    pricing: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Sync state when program changes
  React.useEffect(() => {
    if (program) {
      setName(program.name);
      setDescription(program.description);
      setSelectedBreeds(program.breeds || []);
      setListed(program.status);
      setAcceptInquiries(program.acceptInquiries ?? true);
      setOpenWaitlist(program.openWaitlist ?? false);
      setComingSoon(program.comingSoon ?? false);
      setPricingTiers(program.pricingTiers || []);
      setWhatsIncluded(program.whatsIncluded || "");
      setTypicalWaitTime(program.typicalWaitTime || "");
    }
  }, [program]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !program) return;
    onSave(program.id, {
      name: name.trim(),
      description: description.trim(),
      breeds: selectedBreeds,
      listed,
      acceptInquiries,
      openWaitlist,
      comingSoon,
      pricingTiers: pricingTiers.length > 0 ? pricingTiers : undefined,
      whatsIncluded: whatsIncluded.trim() || undefined,
      typicalWaitTime: typicalWaitTime.trim() || undefined,
    });
    onClose();
  }

  function handleDelete() {
    if (!program) return;
    onClose();
    onDelete(program.id);
  }

  function toggleBreed(breed: string) {
    setSelectedBreeds((prev) =>
      prev.includes(breed) ? prev.filter((b) => b !== breed) : [...prev, breed]
    );
  }

  // Pricing tier helpers
  function addPricingTier() {
    setPricingTiers([...pricingTiers, { tier: "", priceRange: "" }]);
  }

  function updatePricingTier(index: number, field: keyof ProgramPricingTier, value: string) {
    setPricingTiers((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [field]: value } : t))
    );
  }

  function removePricingTier(index: number) {
    setPricingTiers((prev) => prev.filter((_, i) => i !== index));
  }

  if (!open || !program) return null;

  // Count filled enhanced fields for badge
  const pricingCount = [pricingTiers.length > 0, whatsIncluded, typicalWaitTime].filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-surface-strong border border-hairline rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
          {/* Fixed header */}
          <div className="flex-shrink-0 bg-surface-strong border-b border-hairline px-6 py-4 flex items-center justify-between rounded-t-xl">
            <h3 className="text-lg font-semibold text-primary">Edit Program</h3>
            <button
              type="button"
              onClick={onClose}
              className="text-secondary hover:text-primary text-xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-4">
            {/* Program Name - always visible */}
            <div>
              <label className={LABEL_CLS}>
                Program Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Golden Retriever Program"
                className={INPUT_CLS}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className={LABEL_CLS}>Description</label>
              <p className={SUBLABEL_CLS}>Brief overview of your program.</p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                placeholder="Describe your breeding program..."
                rows={3}
                className={TEXTAREA_CLS}
              />
              <div className="text-xs text-secondary text-right mt-1">{description.length}/500</div>
            </div>

            {/* Pricing & What's Included Section */}
            <CollapsibleSection
              title="Pricing & What's Included"
              expanded={expandedSections.pricing}
              onToggle={() => toggleSection("pricing")}
              badge={pricingCount > 0 ? `${pricingCount} filled` : undefined}
            >
              <div>
                <label className={LABEL_CLS}>Pricing Tiers</label>
                <p className={SUBLABEL_CLS}>Add different pricing options (e.g., Pet, Show/Breeding).</p>
                <div className="space-y-3">
                  {pricingTiers.map((tier, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-surface-subtle rounded-lg">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={tier.tier}
                          onChange={(e) => updatePricingTier(index, "tier", e.target.value)}
                          placeholder="Tier name (e.g., Pet)"
                          className={INPUT_CLS}
                        />
                        <input
                          type="text"
                          value={tier.priceRange}
                          onChange={(e) => updatePricingTier(index, "priceRange", e.target.value)}
                          placeholder="Price (e.g., $2,500)"
                          className={INPUT_CLS}
                        />
                        <input
                          type="text"
                          value={tier.description || ""}
                          onChange={(e) => updatePricingTier(index, "description", e.target.value)}
                          placeholder="What's included at this tier"
                          className={`${INPUT_CLS} col-span-2`}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removePricingTier(index)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addPricingTier}
                    className="text-sm text-[hsl(var(--brand-orange))] hover:underline"
                  >
                    + Add pricing tier
                  </button>
                </div>
              </div>

              <div>
                <label className={LABEL_CLS}>What's Included</label>
                <p className={SUBLABEL_CLS}>What comes with each puppy/animal?</p>
                <textarea
                  value={whatsIncluded}
                  onChange={(e) => setWhatsIncluded(e.target.value.slice(0, 1000))}
                  placeholder="First vaccinations, microchip, health certificate, starter kit with food, blanket with littermates' scent, lifetime breeder support..."
                  rows={4}
                  className={TEXTAREA_CLS}
                />
                <div className="text-xs text-secondary text-right mt-1">{whatsIncluded.length}/1000</div>
              </div>

              <div>
                <label className={LABEL_CLS}>Typical Wait Time</label>
                <p className={SUBLABEL_CLS}>How long do buyers typically wait?</p>
                <input
                  type="text"
                  value={typicalWaitTime}
                  onChange={(e) => setTypicalWaitTime(e.target.value)}
                  placeholder="3-6 months"
                  className={INPUT_CLS}
                />
              </div>
            </CollapsibleSection>

            {/* Associated Breeds - always visible */}
            <div>
              <label className={LABEL_CLS}>Associated Breeds</label>
              <p className={SUBLABEL_CLS}>Select breeds included in this program.</p>
              {availableBreeds.length === 0 ? (
                <p className="text-sm text-secondary italic">No breeds available.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableBreeds.map((breed) => (
                    <button
                      key={breed}
                      type="button"
                      onClick={() => toggleBreed(breed)}
                      className={[
                        "px-3 py-1.5 rounded-full text-sm font-medium transition-colors border",
                        selectedBreeds.includes(breed)
                          ? "bg-[hsl(var(--brand-orange))] text-white border-transparent"
                          : "bg-surface-strong text-secondary border-hairline hover:border-[hsl(var(--brand-orange))]/50",
                      ].join(" ")}
                    >
                      {breed}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Availability Options - always visible */}
            <div>
              <label className={LABEL_CLS}>Availability Options</label>
              <p className={SUBLABEL_CLS}>Control how visitors can interact with this program listing.</p>
              <div className="space-y-3 mt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-primary">Accept Inquiries</label>
                    <p className="text-xs text-secondary">Allow visitors to send you messages about this program.</p>
                  </div>
                  <Toggle checked={acceptInquiries} onChange={setAcceptInquiries} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-primary">Open Waitlist</label>
                    <p className="text-xs text-secondary">Allow visitors to request a spot on your waitlist.</p>
                  </div>
                  <Toggle checked={openWaitlist} onChange={setOpenWaitlist} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-primary">Coming Soon</label>
                    <p className="text-xs text-secondary">Show a "Coming Soon" badge on this program.</p>
                  </div>
                  <Toggle checked={comingSoon} onChange={setComingSoon} />
                </div>
              </div>
            </div>

            {/* List in Marketplace toggle - always visible */}
            <div className="flex items-center justify-between py-2 border-t border-hairline mt-2 pt-4">
              <div>
                <label className="text-sm font-medium text-primary">List in Marketplace</label>
                <p className="text-xs text-secondary">Make this program visible to buyers.</p>
              </div>
              <Toggle checked={listed} onChange={setListed} />
            </div>
          </div>

          {/* Fixed footer */}
          <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-t border-hairline bg-surface-strong rounded-b-xl">
            <button
              type="button"
              onClick={handleDelete}
              className="text-sm text-red-400 hover:text-red-300"
            >
              Delete program
            </button>
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={!name.trim()}>
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function PublishErrorBanner({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;
  return (
    <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 mb-4">
      <h4 className="text-sm font-medium text-red-400 mb-2">Cannot publish - missing required items:</h4>
      <ul className="list-disc list-inside text-sm text-red-300 space-y-1">
        {errors.map((err) => (
          <li key={err}>{err}</li>
        ))}
      </ul>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function ManageListingPage() {
  // ─── State ────────────────────────────────────────────────────────────────
  const [draft, setDraft] = React.useState<MarketplaceProfileDraft>(createEmptyDraft);
  const [published, setPublished] = React.useState<MarketplacePublishedSnapshot | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);
  const [unpublishing, setUnpublishing] = React.useState(false);
  const [publishErrors, setPublishErrors] = React.useState<string[]>([]);
  const [showDebugPanel, setShowDebugPanel] = React.useState(false);
  const [apiLoading, setApiLoading] = React.useState(true);
  const [apiError, setApiError] = React.useState<string | null>(null);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  // Business hours state
  const [businessHours, setBusinessHours] = React.useState<BusinessHoursSchedule>(DEFAULT_BUSINESS_HOURS);
  const [businessHoursTimezone, setBusinessHoursTimezone] = React.useState<string>("America/New_York");

  // Track initial draft for dirty comparison
  const initialDraftRef = React.useRef<string>(JSON.stringify(createEmptyDraft()));
  const tenantId = getTenantId();

  // ─── Load from API on mount ───────────────────────────────────────────────
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setApiError(null);
        const profile = await fetchMarketplaceProfile(tenantId);
        if (!alive) return;
        if (profile.draft) {
          const loadedDraft = { ...createEmptyDraft(), ...profile.draft };
          setDraft(loadedDraft);
          initialDraftRef.current = JSON.stringify(loadedDraft);
        }
        if (profile.published) {
          setPublished({ ...createEmptyDraft(), ...profile.published, publishedAt: profile.publishedAt || "" } as MarketplacePublishedSnapshot);
        }
      } catch (e: any) {
        console.error("Failed to load marketplace profile from API:", e);
        if (alive) {
          setApiError(e.message || "Failed to load marketplace profile. Please try again.");
        }
      } finally {
        if (alive) setApiLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [tenantId]);

  // ─── Load business hours from API ─────────────────────────────────────────
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const hoursConfig = await fetchBusinessHours(tenantId);
        if (!alive) return;
        if (hoursConfig) {
          setBusinessHours(hoursConfig.schedule);
          setBusinessHoursTimezone(hoursConfig.timeZone);
        }
      } catch (e: any) {
        console.error("Failed to load business hours:", e);
        // Non-fatal - just use defaults
      }
    })();
    return () => { alive = false; };
  }, [tenantId]);

  // ─── Species and breeds (DO NOT MODIFY - read only for gating) ───────────
  const [selectedSpecies, setSelectedSpecies] = React.useState<string[]>([]);
  const speciesOptions = ["Dog", "Cat", "Horse", "Goat", "Sheep", "Rabbit"];

  // Programs are now stored in draft.programs for persistence
  const programs = draft.programs;
  const setPrograms = (updater: ProgramData[] | ((prev: ProgramData[]) => ProgramData[])) => {
    setDraft((prev) => ({
      ...prev,
      programs: typeof updater === "function" ? updater(prev.programs) : updater,
    }));
  };

  // Example programs (static, can be hidden)
  const examplePrograms: ProgramData[] = [
    { id: "example-1", name: "Golden Retriever Program", description: "AKC registered Goldens with OFA clearances. Family-raised with early neurological stimulation.", status: true, acceptInquiries: true, openWaitlist: true, comingSoon: false },
    { id: "example-2", name: "Labrador Program", description: "English Labs bred for temperament and conformation.", status: false, acceptInquiries: false, openWaitlist: true, comingSoon: true },
  ];

  // Hidden examples persistence
  const hiddenExamplesKey = `bhq_hidden_program_examples_${getTenantId()}`;
  const [hiddenExamples, setHiddenExamples] = React.useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(hiddenExamplesKey);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem(hiddenExamplesKey, JSON.stringify(hiddenExamples));
    } catch {}
  }, [hiddenExamples, hiddenExamplesKey]);

  // Real tenant breeds from API
  const [tenantBreeds, setTenantBreeds] = React.useState<{ name: string; species: string; source: string }[]>([]);
  const [breedsLoading, setBreedsLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/v1/breeds/program", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to load breeds");
        const json = await res.json();
        const data = json?.data || [];
        if (alive) {
          setTenantBreeds(data.map((b: any) => ({
            name: b.name,
            species: b.species,
            source: b.source || "canonical",
          })));
        }
      } catch (e: any) {
        console.error("Failed to load program breeds:", e);
        if (alive) setTenantBreeds([]);
      } finally {
        if (alive) setBreedsLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const visibleExamples = examplePrograms.filter((p) => !hiddenExamples.includes(p.id));
  const realBreedNames = tenantBreeds.map((b) => b.name);
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [editingProgram, setEditingProgram] = React.useState<ProgramData | null>(null);

  // ─── Dirty tracking ──────────────────────────────────────────────────────
  // (No longer needed - page manages its own state)

  // ─── Draft field updaters ────────────────────────────────────────────────
  function updateDraft<K extends keyof MarketplaceProfileDraft>(
    key: K,
    value: MarketplaceProfileDraft[K]
  ) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function updateAddress<K extends keyof MarketplaceProfileDraft["address"]>(
    key: K,
    value: string
  ) {
    setDraft((prev) => ({
      ...prev,
      address: { ...prev.address, [key]: value },
    }));
  }

  function updateSearchParticipation<K extends keyof MarketplaceProfileDraft["searchParticipation"]>(
    key: K,
    value: boolean
  ) {
    setDraft((prev) => ({
      ...prev,
      searchParticipation: { ...prev.searchParticipation, [key]: value },
    }));
  }

  function updateCredentials<K extends keyof MarketplaceProfileDraft["standardsAndCredentials"]>(
    key: K,
    value: MarketplaceProfileDraft["standardsAndCredentials"][K]
  ) {
    setDraft((prev) => ({
      ...prev,
      standardsAndCredentials: { ...prev.standardsAndCredentials, [key]: value },
    }));
  }

  function toggleCredentialItem(
    key: "registrations" | "healthPractices" | "breedingPractices" | "carePractices",
    item: string
  ) {
    setDraft((prev) => {
      const list = prev.standardsAndCredentials[key];
      const newList = list.includes(item)
        ? list.filter((i) => i !== item)
        : [...list, item];
      return {
        ...prev,
        standardsAndCredentials: { ...prev.standardsAndCredentials, [key]: newList },
      };
    });
  }

  function updatePlacement<K extends keyof MarketplaceProfileDraft["placementPolicies"]>(
    key: K,
    value: MarketplaceProfileDraft["placementPolicies"][K]
  ) {
    setDraft((prev) => ({
      ...prev,
      placementPolicies: { ...prev.placementPolicies, [key]: value },
    }));
  }

  // ─── Breed listing toggle ────────────────────────────────────────────────
  function toggleBreedListing(breedName: string) {
    setDraft((prev) => {
      const isListed = prev.listedBreeds.includes(breedName);
      return {
        ...prev,
        listedBreeds: isListed
          ? prev.listedBreeds.filter((b) => b !== breedName)
          : [...prev.listedBreeds, breedName],
      };
    });
  }

  // Helper to map listed breeds to include species for publish payload
  function getBreedsWithSpecies(listedBreedNames: string[]) {
    return listedBreedNames.map((name) => {
      const breed = tenantBreeds.find((b) => b.name === name);
      return { name, species: breed?.species || null };
    });
  }

  // ─── Programs helpers (DO NOT MODIFY LOGIC) ──────────────────────────────
  function toggleSpecies(species: string) {
    setSelectedSpecies((prev) =>
      prev.includes(species) ? prev.filter((s) => s !== species) : [...prev, species]
    );
  }

  async function toggleProgram(id: string) {
    const program = programs.find((p) => p.id === id);
    if (!program) return;

    const newStatus = !program.status;

    // If published, always prompt for immediate update (both ON and OFF)
    if (published) {
      // Check if this is the last listed program being hidden
      const currentlyListedCount = programs.filter((p) => p.status).length;
      const isLastProgram = !newStatus && currentlyListedCount === 1;

      const confirmed = await confirmDialog({
        title: "Update Public Listing",
        message: isLastProgram
          ? "Your marketplace listing is live. Unlisting this program will hide all programs from your marketplace profile. Your business profile will remain visible, but buyers won't see any breeding programs. Continue?"
          : `Your marketplace listing is live. ${newStatus ? "Listing" : "Unlisting"} this program will update your public listing immediately.`,
        confirmText: "Save & Update",
        cancelText: "Cancel",
      });
      if (!confirmed) return;

      // Update state and auto-save
      const updatedPrograms = programs.map((p) => (p.id === id ? { ...p, status: newStatus } : p));
      setPrograms(updatedPrograms);

      const updatedDraft = { ...draft, programs: updatedPrograms };
      const updatedListedPrograms = updatedPrograms.filter((p) => p.status).map((p) => ({
        name: p.name,
        description: p.description,
        acceptInquiries: p.acceptInquiries,
        openWaitlist: p.openWaitlist,
        comingSoon: p.comingSoon,
      }));

      setSaving(true);
      try {
        await saveMarketplaceDraft(tenantId, updatedDraft);
        const publishPayload = {
          ...updatedDraft,
          breeds: getBreedsWithSpecies(updatedDraft.listedBreeds),
          listedPrograms: updatedListedPrograms,
        };
        const pubResult = await publishMarketplaceProfile(tenantId, publishPayload);
        if (pubResult.ok && pubResult.publishedAt) {
          const snapshot: MarketplacePublishedSnapshot = {
            ...updatedDraft,
            updatedAt: pubResult.publishedAt,
            publishedAt: pubResult.publishedAt,
          };
          setPublished(snapshot);
          setDraft((prev) => ({ ...prev, programs: updatedPrograms, updatedAt: pubResult.publishedAt! }));
          initialDraftRef.current = JSON.stringify({ ...updatedDraft, updatedAt: pubResult.publishedAt });


        }
      } catch (e) {
        console.error("Failed to update program visibility:", e);
        setSaveError("Failed to update listing. Please try again.");
      } finally {
        setSaving(false);
      }
    } else {
      // Not published - inform user when toggling ON
      if (!published && newStatus) {
        await confirmDialog({
          title: "Profile Not Published",
          message: "This program is now marked as 'Listed', but it won't be visible to buyers until you publish your marketplace profile. Scroll down to 'Preview and Validation' to publish your profile.",
          confirmText: "Got it",
          cancelText: undefined,
        });
      }

      // Update local state
      const updatedPrograms = programs.map((p) => (p.id === id ? { ...p, status: newStatus } : p));
      setPrograms(updatedPrograms);

      // Auto-save the draft to prevent dirty state blocking close button
      const updatedDraft = { ...draft, programs: updatedPrograms };
      setSaving(true);
      try {
        await saveMarketplaceDraft(tenantId, updatedDraft);
        const now = new Date().toISOString();
        initialDraftRef.current = JSON.stringify({ ...updatedDraft, updatedAt: now });
        setDraft((prev) => ({ ...prev, programs: updatedPrograms, updatedAt: now }));

      } catch (e) {
        console.error("Failed to save program toggle:", e);
        setSaveError("Failed to save changes. Please try again.");
      } finally {
        setSaving(false);
      }
    }
  }

  // ─── Business Hours Handlers ──────────────────────────────────────────────
  async function handleBusinessHoursChange(day: keyof BusinessHoursSchedule, field: keyof DaySchedule, value: boolean | string) {
    const updated = {
      ...businessHours,
      [day]: {
        ...businessHours[day],
        [field]: value,
      },
    };
    setBusinessHours(updated);

    // Auto-save to API
    try {
      await saveBusinessHours(tenantId, {
        schedule: updated,
        timeZone: businessHoursTimezone,
      });
    } catch (e) {
      console.error("Failed to save business hours:", e);
      setSaveError("Failed to save business hours. Please try again.");
    }
  }

  async function handleTimezoneChange(newTimezone: string) {
    setBusinessHoursTimezone(newTimezone);

    // Auto-save to API
    try {
      await saveBusinessHours(tenantId, {
        schedule: businessHours,
        timeZone: newTimezone,
      });
    } catch (e) {
      console.error("Failed to save timezone:", e);
      setSaveError("Failed to save timezone. Please try again.");
    }
  }

  function handleCreateProgram(data: ProgramFormData) {
    const newProgram: ProgramData = {
      id: `program-${Date.now()}`,
      name: data.name,
      description: data.description,
      status: data.listed,
      acceptInquiries: data.acceptInquiries,
      openWaitlist: data.openWaitlist,
      comingSoon: data.comingSoon,
      breeds: data.breeds,
      // Program-specific enhanced fields
      pricingTiers: data.pricingTiers,
      whatsIncluded: data.whatsIncluded,
      typicalWaitTime: data.typicalWaitTime,
    };
    setPrograms((prev) => [...prev, newProgram]);
  }

  function handleUseTemplate(exampleId: string) {
    const example = examplePrograms.find((p) => p.id === exampleId);
    if (!example) return;
    const newProgram: ProgramData = {
      id: `program-${Date.now()}`,
      name: example.name,
      description: example.description,
      status: example.status,
      acceptInquiries: example.acceptInquiries,
      openWaitlist: example.openWaitlist,
      comingSoon: example.comingSoon,
      breeds: [] as string[],
    };
    setPrograms((prev) => [...prev, newProgram]);
    setHiddenExamples((prev) => [...prev, exampleId]);
  }

  function handleHideExample(exampleId: string) {
    setHiddenExamples((prev) => [...prev, exampleId]);
  }

  function handleEditProgram(id: string, data: ProgramFormData) {
    // Update local state - dirty tracking will mark the form as dirty
    // User must click Save to persist changes (consistent with other fields)
    setPrograms((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              name: data.name,
              description: data.description,
              breeds: data.breeds,
              status: data.listed,
              acceptInquiries: data.acceptInquiries,
              openWaitlist: data.openWaitlist,
              comingSoon: data.comingSoon,
              // Program-specific enhanced fields
              pricingTiers: data.pricingTiers,
              whatsIncluded: data.whatsIncluded,
              typicalWaitTime: data.typicalWaitTime,
            }
          : p
      )
    );
  }

  async function handleDeleteProgram(id: string) {
    const program = programs.find((p) => p.id === id);
    if (!program) return;

    const confirmed = await confirmDialog({
      title: "Delete Program",
      message: `Are you sure you want to delete "${program.name}"? This cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
    });
    if (!confirmed) return;

    setPrograms((prev) => prev.filter((p) => p.id !== id));
  }

  const listedProgramsCount = programs.filter((p) => p.status).length;
  const listedPrograms = programs.filter((p) => p.status).map((p) => ({
    name: p.name,
    description: p.description,
    acceptInquiries: p.acceptInquiries,
    openWaitlist: p.openWaitlist,
    comingSoon: p.comingSoon,
  }));

  // ─── Save Draft (API-based) ────────────────────────────────────────────────
  // When already published, saving also republishes to update the public listing
  async function handleSaveDraft(): Promise<void> {
    // If already published, confirm before updating public listing
    if (published) {
      const confirmed = await confirmDialog({
        title: "Update Public Listing",
        message: "Your marketplace listing is live. Saving will update your public listing immediately.",
        confirmText: "Save & Update",
        cancelText: "Cancel",
      });
      if (!confirmed) return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      // Always save the draft first
      const result = await saveMarketplaceDraft(tenantId, draft);
      if (!result.ok) {
        throw new Error("Failed to save draft");
      }

      // If already published, also republish to update the public listing
      if (published) {
        const publishPayload = {
          ...draft,
          breeds: getBreedsWithSpecies(draft.listedBreeds),
          listedPrograms,
        };
        const pubResult = await publishMarketplaceProfile(tenantId, publishPayload);
        if (pubResult.ok && pubResult.publishedAt) {
          const snapshot: MarketplacePublishedSnapshot = {
            ...draft,
            updatedAt: pubResult.publishedAt,
            publishedAt: pubResult.publishedAt,
          };
          setPublished(snapshot);
          setDraft((prev) => ({ ...prev, updatedAt: pubResult.publishedAt! }));
          initialDraftRef.current = JSON.stringify({ ...draft, updatedAt: pubResult.publishedAt });
          
        } else if (pubResult.errors) {
          setPublishErrors(pubResult.errors);
        }
      } else {
        // Not published yet - just update draft state
        const now = result.draftUpdatedAt || new Date().toISOString();
        initialDraftRef.current = JSON.stringify({ ...draft, updatedAt: now });
        setDraft((prev) => ({ ...prev, updatedAt: now }));
        
      }
    } catch (e: any) {
      console.error("Failed to save:", e);
      setSaveError(e?.message || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // Auto-save is now handled inline - no imperative handle needed

  // ─── Discard Changes ─────────────────────────────────────────────────────
  async function handleDiscardChanges(): Promise<void> {
    const confirmed = await confirmDialog({
      title: "Discard Changes",
      message: "Are you sure you want to discard your unsaved changes? This cannot be undone.",
      confirmText: "Discard",
      cancelText: "Keep Editing",
      variant: "danger",
    });
    if (!confirmed) return;

    // Reset draft to initial state (what was last saved/loaded)
    try {
      const initialDraft = JSON.parse(initialDraftRef.current);
      setDraft(initialDraft);
      
    } catch {
      // Fallback: reload from API would be ideal, but for now just reset dirty state
      
    }
  }

  // ─── Publish validation and action ───────────────────────────────────────
  function validateForPublish(): string[] {
    const errors: string[] = [];
    if (!draft.businessName.trim()) {
      errors.push("Business name is required");
    }
    if (draft.listedBreeds.length === 0) {
      errors.push("At least one breed must be selected for listing");
    }
    if (!programs.some((p) => p.status)) {
      errors.push("At least one program must be listed");
    }
    return errors;
  }

  async function handlePublish() {
    const errors = validateForPublish();
    setPublishErrors(errors);
    if (errors.length > 0) return;

    setPublishing(true);
    try {
      // Build the publish payload with required fields
      const publishPayload = {
        ...draft,
        breeds: getBreedsWithSpecies(draft.listedBreeds),
        listedPrograms,
      };
      const result = await publishMarketplaceProfile(tenantId, publishPayload);
      if (result.ok && result.publishedAt) {
        const snapshot: MarketplacePublishedSnapshot = {
          ...draft,
          updatedAt: result.publishedAt,
          publishedAt: result.publishedAt,
        };
        setPublished(snapshot);
        setDraft((prev) => ({ ...prev, updatedAt: result.publishedAt! }));
        initialDraftRef.current = JSON.stringify({ ...draft, updatedAt: result.publishedAt });
        
      } else if (result.errors) {
        setPublishErrors(result.errors);
      }
    } catch (e: any) {
      console.error("Failed to publish:", e);
      setPublishErrors([e.message || "Failed to publish"]);
    } finally {
      setPublishing(false);
    }
  }

  async function handleUnpublish() {
    setUnpublishing(true);
    setPublishErrors([]);
    try {
      const result = await unpublishMarketplaceProfile(tenantId);
      if (result.ok) {
        setPublished(null);
      } else {
        setPublishErrors([result.error || "Failed to remove listing"]);
      }
    } catch (e: any) {
      console.error("Failed to unpublish:", e);
      setPublishErrors([e.message || "Failed to remove listing"]);
    } finally {
      setUnpublishing(false);
    }
  }

  // ─── Computed values ─────────────────────────────────────────────────────
  const isPublished = !!published;
  const locationDisplayText = buildLocationDisplay(draft.address, draft.publicLocationMode);

  const publishChecklist = [
    { label: "Business name", done: !!draft.businessName.trim() },
    { label: "Logo (optional but recommended)", done: !!draft.logoAssetId, optional: true },
    { label: "At least one breed selected for listing", done: draft.listedBreeds.length > 0 },
    { label: "At least one program listed", done: programs.some((p) => p.status) },
  ];

  const canPublish = publishChecklist.filter((c) => !c.optional).every((c) => c.done);

  // Build public payload for debug panel
  const publicPayload = buildMarketplacePublicProfile(
    published,
    programs.map((p) => ({ name: p.name, description: p.description, status: p.status, acceptInquiries: p.acceptInquiries, openWaitlist: p.openWaitlist, comingSoon: p.comingSoon }))
  );

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* API Error Banner */}
      {apiError && (
        <div className="rounded-md bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
          <strong>Error loading profile:</strong> {apiError}
        </div>
      )}

      {/* Save Error Banner */}
      {saveError && (
        <div className="rounded-md bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
          <strong>Error saving:</strong> {saveError}
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-primary">Marketplace Profile</h2>
        <p className="text-sm text-secondary mt-1">
          Control how your breeding business and programs appear in the BreederHQ Marketplace.
        </p>
        <div className="flex flex-wrap gap-3 mt-4">
          <Badge variant={isPublished ? "green" : "neutral"}>
            Marketplace: {isPublished ? "Visible" : "Not Published"}
          </Badge>
          <Badge variant="neutral">{listedProgramsCount} of {programs.length} Programs Listed</Badge>
          {published?.publishedAt && (
            <Badge variant="neutral">
              Published: {new Date(published.publishedAt).toLocaleDateString()}
            </Badge>
          )}
        </div>
      </div>

      {/* Section: Business Identity */}
      <SectionCard
        title={
          <div className="flex items-center gap-2">
            <span className="text-lg">🏢</span>
            <div className="flex-1">
              <div className="text-base font-semibold text-primary">Business Identity</div>
              <div className="text-xs text-secondary font-normal">Your program name, logo, and description</div>
            </div>
          </div>
        }
        right={
          <VisibilityToggle
            isPublic={draft.showBusinessIdentity}
            onChange={(v) => updateDraft("showBusinessIdentity", v)}
          />
        }
        highlight={false}
      >
        <div className={`space-y-5 pt-2 ${!draft.showBusinessIdentity ? "opacity-60" : ""}`}>
          {/* Business Name */}
          <div>
            <label className="text-sm font-medium text-primary mb-1.5 block">Business Name</label>
            <input
              type="text"
              value={draft.businessName}
              onChange={(e) => updateDraft("businessName", e.target.value)}
              placeholder="Your breeding program name"
              className={INPUT_CLS}
            />
          </div>

          {/* About Your Program (Bio) */}
          <div>
            <label className="text-sm font-medium text-primary mb-1.5 block">About Your Program</label>
            <textarea
              value={draft.bio}
              onChange={(e) => updateDraft("bio", e.target.value.slice(0, 500))}
              placeholder="Tell potential clients about your breeding program, your experience, and what makes you unique..."
              rows={4}
              className={TEXTAREA_CLS}
            />
            <div className="text-xs text-secondary text-right mt-1">{draft.bio.length}/500</div>
          </div>

          {/* Logo */}
          <div>
            <label className="text-sm font-medium text-primary mb-1.5 block">Logo</label>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-surface-strong border-2 border-dashed border-hairline flex items-center justify-center text-xl text-secondary shrink-0">
                {draft.logoAssetId ? "🖼️" : "📷"}
              </div>
              <div className="flex-1">
                <p className="text-xs text-secondary mb-2">Upload a professional logo for your breeding program.</p>
                <Button size="sm" variant="outline" disabled>
                  Upload Logo (Coming Soon)
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Section: Website & Social Links */}
      <SectionCard
        title={
          <div className="flex items-center gap-2">
            <span className="text-lg">🔗</span>
            <div>
              <div className="text-base font-semibold text-primary">Website & Social Links</div>
              <div className="text-xs text-secondary font-normal">Connect with potential buyers online</div>
            </div>
          </div>
        }
        highlight={false}
      >
        <div className="space-y-5 pt-2">
          {/* Website */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-primary">Website</label>
              <VisibilityToggle
                isPublic={draft.showWebsite}
                onChange={(v) => updateDraft("showWebsite", v)}
              />
            </div>
            <input
              type="url"
              value={draft.websiteUrl}
              onChange={(e) => updateDraft("websiteUrl", e.target.value)}
              placeholder="https://yourwebsite.com"
              className={INPUT_CLS}
            />
          </div>

          {/* Instagram */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-primary">Instagram</label>
              <VisibilityToggle
                isPublic={draft.showInstagram}
                onChange={(v) => updateDraft("showInstagram", v)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-secondary text-sm">@</span>
              <input
                type="text"
                value={draft.instagram}
                onChange={(e) => updateDraft("instagram", e.target.value.replace(/^@/, ""))}
                placeholder="username"
                className={INPUT_CLS}
              />
            </div>
          </div>

          {/* Facebook */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-primary">Facebook</label>
              <VisibilityToggle
                isPublic={draft.showFacebook}
                onChange={(v) => updateDraft("showFacebook", v)}
              />
            </div>
            <input
              type="text"
              value={draft.facebook}
              onChange={(e) => updateDraft("facebook", e.target.value)}
              placeholder="Page name or URL"
              className={INPUT_CLS}
            />
          </div>
        </div>
      </SectionCard>

      {/* Section: Location */}
      <SectionCard
        title={
          <div className="flex items-center gap-2">
            <span className="text-lg">📍</span>
            <div>
              <div className="text-base font-semibold text-primary">Location</div>
              <div className="text-xs text-secondary font-normal">Control what location details are visible on the marketplace</div>
            </div>
          </div>
        }
        highlight={false}
      >
        <div className="space-y-5 pt-2">
          {/* Address Fields */}
          <div className="bg-surface-strong/50 rounded-lg p-4 border border-hairline">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-primary">Your Address</span>
              <PrivateBadge />
            </div>
            <p className="text-xs text-secondary mb-3">Your full address is never shown publicly. Use the options below to choose what location info to display.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="md:col-span-2">
                <div className="text-xs text-secondary mb-1">Street Address</div>
                <input
                  type="text"
                  value={draft.address.street}
                  onChange={(e) => updateAddress("street", e.target.value)}
                  placeholder="123 Main St"
                  className={INPUT_CLS}
                />
              </label>
              <label>
                <div className="text-xs text-secondary mb-1">City</div>
                <input
                  type="text"
                  value={draft.address.city}
                  onChange={(e) => updateAddress("city", e.target.value)}
                  placeholder="City"
                  className={INPUT_CLS}
                />
              </label>
              <label>
                <div className="text-xs text-secondary mb-1">State/Province</div>
                <input
                  type="text"
                  value={draft.address.state}
                  onChange={(e) => updateAddress("state", e.target.value)}
                  placeholder="State"
                  className={INPUT_CLS}
                />
              </label>
              <label>
                <div className="text-xs text-secondary mb-1">ZIP/Postal Code</div>
                <input
                  type="text"
                  value={draft.address.zip}
                  onChange={(e) => updateAddress("zip", e.target.value)}
                  placeholder="12345"
                  className={INPUT_CLS}
                />
              </label>
              <label>
                <div className="text-xs text-secondary mb-1">Country</div>
                <input
                  type="text"
                  value={draft.address.country}
                  onChange={(e) => updateAddress("country", e.target.value)}
                  placeholder="Country"
                  className={INPUT_CLS}
                />
              </label>
            </div>
          </div>

          {/* Location Visibility */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-primary">What buyers see</span>
            </div>
            <p className="text-xs text-secondary mb-3">Choose how your location appears on your marketplace profile</p>
            <div className="flex flex-wrap gap-2">
              {([
                { value: "city_state", label: "City + State" },
                { value: "full", label: "City, State + ZIP" },
                { value: "zip_only", label: "ZIP Code Only" },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateDraft("publicLocationMode", opt.value)}
                  className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                    draft.publicLocationMode === opt.value
                      ? "bg-[hsl(var(--brand-orange))] text-white border-[hsl(var(--brand-orange))] font-medium"
                      : "bg-surface border-hairline text-secondary hover:text-primary hover:border-[hsl(var(--brand-orange))]/50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Section: Business Hours */}
      <SectionCard
        title={
          <div className="flex items-center gap-2">
            <span className="text-lg">🕐</span>
            <div>
              <div className="text-base font-semibold text-primary">Business Hours</div>
              <div className="text-xs text-secondary font-normal">Set when you're available for calls and inquiries</div>
            </div>
          </div>
        }
        highlight={false}
      >
        <div className="space-y-5 pt-2">
          {/* Timezone Selector */}
          <div>
            <label className="text-xs text-secondary mb-1 block">Timezone</label>
            <select
              value={businessHoursTimezone}
              onChange={(e) => handleTimezoneChange(e.target.value)}
              className={INPUT_CLS}
            >
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Phoenix">Arizona Time (MST)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="America/Anchorage">Alaska Time (AKT)</option>
              <option value="Pacific/Honolulu">Hawaii Time (HST)</option>
            </select>
          </div>

          {/* Days Schedule */}
          <div className="space-y-3">
            {(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const).map((day) => {
              const schedule = businessHours[day];
              const dayLabel = day.charAt(0).toUpperCase() + day.slice(1);
              return (
                <div key={day} className="flex items-center gap-3 py-2 border-b border-hairline last:border-0">
                  {/* Day name and toggle */}
                  <div className="w-32 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={schedule.enabled}
                      onChange={(e) => handleBusinessHoursChange(day, "enabled", e.target.checked)}
                      className="w-4 h-4 rounded border-hairline bg-surface text-[hsl(var(--brand-orange))] focus:ring-2 focus:ring-[hsl(var(--brand-orange))]/20"
                    />
                    <span className={`text-sm font-medium ${schedule.enabled ? "text-primary" : "text-secondary"}`}>
                      {dayLabel}
                    </span>
                  </div>

                  {/* Time inputs */}
                  {schedule.enabled ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="time"
                        value={schedule.open}
                        onChange={(e) => handleBusinessHoursChange(day, "open", e.target.value)}
                        className="px-2 py-1 text-sm rounded-md border border-hairline bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))]/50"
                      />
                      <span className="text-xs text-secondary">to</span>
                      <input
                        type="time"
                        value={schedule.close}
                        onChange={(e) => handleBusinessHoursChange(day, "close", e.target.value)}
                        className="px-2 py-1 text-sm rounded-md border border-hairline bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))]/50"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-secondary italic flex-1">Closed</span>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-xs text-secondary">
            Business hours appear on your marketplace profile and help buyers know when to expect responses.
          </p>
        </div>
      </SectionCard>

      {/* Section: Preview and Validation */}
      <SectionCard title="Preview and Validation" highlight={false}>
        <div className="space-y-6">
          <PublishErrorBanner errors={publishErrors} />

          <div>
            <label className={LABEL_CLS}>Marketplace Preview</label>
            <p className={SUBLABEL_CLS}>How your listing will appear to buyers (based on current draft).</p>
            <MarketplacePreviewCard
              businessName={draft.businessName}
              locationDisplay={locationDisplayText}
              breeds={draft.listedBreeds}
            />
          </div>

          <div>
            <label className={LABEL_CLS}>To publish, complete:</label>
            <div className="space-y-1.5 mt-2">
              {publishChecklist.map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-sm">
                  <span className={item.done ? "text-green-400" : "text-secondary"}>
                    {item.done ? "✓" : "○"}
                  </span>
                  <span className={item.done ? "text-primary" : "text-secondary"}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-hairline">
            {isPublished ? (
              <Button
                variant="outline"
                onClick={handleUnpublish}
                disabled={unpublishing}
                className="text-red-400 border-red-400/50 hover:bg-red-400/10"
              >
                {unpublishing ? "Removing..." : "Remove Marketplace Listing"}
              </Button>
            ) : (
              <Button onClick={handlePublish} disabled={!canPublish || publishing}>
                {publishing ? "Publishing..." : "Publish to Marketplace"}
              </Button>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Section: Programs and Listings */}
      <SectionCard
        title="Programs and Listings"
        highlight={false}
        right={
          <div className="flex items-center gap-2">
            {realBreedNames.length === 0 && !breedsLoading && (
              <div className="flex items-center gap-2 text-sm text-secondary">
                <span>Add breeds to create programs.</span>
                <a
                  href="/settings?tab=breeds"
                  className="text-[hsl(var(--brand-orange))] hover:underline"
                >
                  Manage breeds
                </a>
              </div>
            )}
            <Button
              size="sm"
              onClick={() => setCreateModalOpen(true)}
              disabled={realBreedNames.length === 0 && !breedsLoading}
            >
              Create program
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className={SUBLABEL_CLS}>
            Control which breeding programs appear in the marketplace.
          </p>

          {!isPublished && programs.some((p) => p.status) && (
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
              <div className="flex items-start gap-3">
                <div className="text-yellow-400 text-lg">⚠️</div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-yellow-400 mb-1">Marketplace Profile Not Published</h4>
                  <p className="text-sm text-yellow-300/90">
                    You have {listedProgramsCount} {listedProgramsCount === 1 ? 'program' : 'programs'} marked as "Listed", but {listedProgramsCount === 1 ? 'it' : 'they'} won't be visible to buyers until you publish your marketplace profile. Scroll down to "Preview and Validation" to publish.
                  </p>
                </div>
              </div>
            </div>
          )}

          {programs.length === 0 && visibleExamples.length === 0 && (
            <div className="text-center py-8 text-secondary">
              <p>No programs yet. Create your first breeding program to get started.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {programs.map((program) => (
              <ProgramCard
                key={program.id}
                name={program.name}
                description={program.description}
                status={program.status}
                acceptInquiries={program.acceptInquiries}
                openWaitlist={program.openWaitlist}
                comingSoon={program.comingSoon}
                onToggle={() => toggleProgram(program.id)}
                onEdit={() => setEditingProgram(program)}
                onDelete={() => handleDeleteProgram(program.id)}
                disabled={false}
              />
            ))}

            {visibleExamples.map((example) => (
              <ProgramCard
                key={example.id}
                name={example.name}
                description={example.description}
                status={example.status}
                acceptInquiries={true}
                openWaitlist={false}
                comingSoon={false}
                onToggle={() => {}}
                isExample
                onUseTemplate={() => handleUseTemplate(example.id)}
                onHideExample={() => handleHideExample(example.id)}
                disabled={false}
              />
            ))}
          </div>
        </div>
      </SectionCard>

      <CreateProgramModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleCreateProgram}
        availableBreeds={realBreedNames}
      />

      <EditProgramModal
        open={!!editingProgram}
        program={editingProgram}
        onClose={() => setEditingProgram(null)}
        onSave={handleEditProgram}
        onDelete={handleDeleteProgram}
        availableBreeds={realBreedNames}
      />

      {/* Section 5: Trust Signals and Badges */}
      <SectionCard title="Trust Signals and Badges">
        <div className="space-y-4">
          <p className={SUBLABEL_CLS}>
            Badges are earned through verified actions and cannot be manually set. Badge functionality is not yet available.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { name: "Verified Identity" },
              { name: "Health Testing" },
              { name: "5+ Placements" },
              { name: "Quick Responder" },
            ].map((badge) => (
              <div
                key={badge.name}
                className="rounded-lg border p-3 text-center bg-surface-strong/50 border-hairline opacity-60"
              >
                <div className="text-2xl mb-1 text-secondary">○</div>
                <div className="text-xs font-medium text-secondary">{badge.name}</div>
                <div className="text-[10px] text-tertiary mt-1">Locked</div>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* Debug Panel (collapsible) */}
      <div className="border border-hairline rounded-lg bg-surface-strong/30">
        <button
          type="button"
          className="w-full flex items-center justify-between px-4 py-3 text-sm text-secondary hover:text-primary"
          onClick={() => setShowDebugPanel(!showDebugPanel)}
        >
          <span>Debug: Public Payload Preview</span>
          <span>{showDebugPanel ? "▲" : "▼"}</span>
        </button>
        {showDebugPanel && (
          <div className="px-4 pb-4">
            <pre className="text-xs bg-card p-3 rounded-md overflow-auto max-h-96 border border-hairline">
              {publicPayload
                ? JSON.stringify(publicPayload, null, 2)
                : "// No published snapshot yet. Publish to see the public payload."}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
