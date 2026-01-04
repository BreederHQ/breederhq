// apps/platform/src/components/MarketplaceSettingsTab.tsx
import React from "react";
import { Button, SectionCard, Badge } from "@bhq/ui";

/* ─────────────────────────────────────────────────────────────────────────────
   MarketplaceSettingsTab - Breeder Marketplace Profile Settings

   Draft-to-publish flow with localStorage persistence (keyed by tenantId).
   Preview uses DRAFT state. Publish copies draft -> published snapshot.
───────────────────────────────────────────────────────────────────────────── */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type MarketplaceSettingsTabProps = {
  dirty: boolean;
  onDirty: (v: boolean) => void;
  onNavigateToBreeds?: () => void;
};

type PublicLocationMode = "city_state" | "zip_only" | "full" | "hidden";

type MarketplaceProfileDraft = {
  businessName: string;
  logoAssetId: string | null;
  bio: string;
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
  const m = document.cookie.match(/(?:^|; )csrfToken=([^;]*)/);
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
): Promise<{ ok: boolean; publishedAt?: string; errors?: string[] }> {
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
    publicLocationMode: "hidden",
    searchParticipation: {
      distanceSearch: false,
      citySearch: false,
      zipRadius: false,
    },
    listedBreeds: [],
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
  listedPrograms: { name: string; availability: string }[];
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
  programsState: { name: string; status: boolean; availability: string }[]
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
      .map((p) => ({ name: p.name, availability: p.availability })),
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
    <label className={["inline-flex items-center gap-2 cursor-pointer", disabled ? "opacity-50 cursor-not-allowed" : ""].join(" ")}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={[
          "relative w-10 h-5 rounded-full transition-colors",
          checked ? "bg-[hsl(var(--brand-orange))]" : "bg-surface-strong border border-hairline",
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
    <label className={["flex items-center gap-2 cursor-pointer", disabled ? "opacity-50 cursor-not-allowed" : ""].join(" ")}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => !disabled && onChange(e.target.checked)}
        disabled={disabled}
        className="w-4 h-4 rounded border-hairline bg-card accent-[hsl(var(--brand-orange))]"
      />
      <span className="text-sm text-primary">{label}</span>
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

function ProgramCard({
  name,
  description,
  status,
  availability,
  onToggle,
  isExample,
  onUseTemplate,
  onHideExample,
}: {
  name: string;
  description: string;
  status: boolean;
  availability: string;
  onToggle: () => void;
  isExample?: boolean;
  onUseTemplate?: () => void;
  onHideExample?: () => void;
}) {
  return (
    <div className="rounded-lg border border-hairline bg-card p-4 space-y-3">
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
          <Toggle checked={status} onChange={onToggle} label="Listed in Marketplace" />
        )}
      </div>
      <div className="flex items-center gap-2 text-xs">
        <Badge variant={status ? "green" : "neutral"}>
          {status ? "Listed" : "Hidden"}
        </Badge>
        <Badge variant="neutral">{availability}</Badge>
      </div>
      {isExample ? (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onUseTemplate}
            className="text-xs text-[hsl(var(--brand-orange))] hover:underline"
          >
            Use this template
          </button>
          <button
            type="button"
            onClick={onHideExample}
            className="text-xs text-secondary hover:text-primary"
          >
            Hide example
          </button>
        </div>
      ) : (
        <button type="button" className="text-xs text-[hsl(var(--brand-orange))] hover:underline">
          Preview listing →
        </button>
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
}: {
  title: string;
  items: string[];
  selected: string[];
  onToggle: (item: string) => void;
  noteValue: string;
  onNoteChange: (v: string) => void;
  noteMaxLength?: number;
}) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-primary">{title}</h4>
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <Checkbox
            key={item}
            checked={selected.includes(item)}
            onChange={() => onToggle(item)}
            label={item}
          />
        ))}
      </div>
      <div>
        <textarea
          value={noteValue}
          onChange={(e) => onNoteChange(e.target.value.slice(0, noteMaxLength))}
          placeholder="Optional notes..."
          rows={2}
          className={TEXTAREA_CLS}
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
  availability: string;
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
  const [availability, setAvailability] = React.useState("Accepting inquiries");

  const availabilityOptions = [
    "Accepting inquiries",
    "Waitlist only",
    "Not accepting inquiries",
    "Coming soon",
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({
      name: name.trim(),
      description: description.trim(),
      breeds: selectedBreeds,
      listed,
      availability,
    });
    setName("");
    setDescription("");
    setSelectedBreeds([]);
    setListed(false);
    setAvailability("Accepting inquiries");
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
              <label className={LABEL_CLS}>Availability Status</label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className={INPUT_CLS}
              >
                {availabilityOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between py-2">
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

const MarketplaceSettingsTabInner = React.forwardRef<MarketplaceHandle, MarketplaceSettingsTabProps>(
  function MarketplaceSettingsTab({ onDirty, onNavigateToBreeds }, ref) {
  // ─── State ────────────────────────────────────────────────────────────────
  const [draft, setDraft] = React.useState<MarketplaceProfileDraft>(createEmptyDraft);
  const [published, setPublished] = React.useState<MarketplacePublishedSnapshot | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);
  const [publishErrors, setPublishErrors] = React.useState<string[]>([]);
  const [showDebugPanel, setShowDebugPanel] = React.useState(false);
  const [apiLoading, setApiLoading] = React.useState(true);
  const [apiError, setApiError] = React.useState<string | null>(null);
  const [saveError, setSaveError] = React.useState<string | null>(null);

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

  // ─── Species and breeds (DO NOT MODIFY - read only for gating) ───────────
  const [selectedSpecies, setSelectedSpecies] = React.useState<string[]>([]);
  const speciesOptions = ["Dog", "Cat", "Horse", "Goat", "Sheep", "Rabbit"];

  // Programs state (DO NOT MODIFY LOGIC)
  const [programs, setPrograms] = React.useState<{
    id: string;
    name: string;
    description: string;
    status: boolean;
    availability: string;
    breeds?: string[];
  }[]>([]);

  // Example programs (static, can be hidden)
  const examplePrograms = [
    { id: "example-1", name: "Golden Retriever Program", description: "AKC registered Goldens with OFA clearances. Family-raised with early neurological stimulation.", status: true, availability: "Accepting inquiries" },
    { id: "example-2", name: "Labrador Program", description: "English Labs bred for temperament and conformation.", status: false, availability: "Waitlist only" },
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

  // ─── Dirty tracking ──────────────────────────────────────────────────────
  React.useEffect(() => {
    const isDirty = JSON.stringify(draft) !== initialDraftRef.current;
    onDirty(isDirty);
  }, [draft, onDirty]);

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

  // ─── Programs helpers (DO NOT MODIFY LOGIC) ──────────────────────────────
  function toggleSpecies(species: string) {
    setSelectedSpecies((prev) =>
      prev.includes(species) ? prev.filter((s) => s !== species) : [...prev, species]
    );
  }

  function toggleProgram(id: string) {
    setPrograms((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: !p.status } : p))
    );
  }

  function handleCreateProgram(data: ProgramFormData) {
    const newProgram = {
      id: `program-${Date.now()}`,
      name: data.name,
      description: data.description,
      status: data.listed,
      availability: data.availability,
      breeds: data.breeds,
    };
    setPrograms((prev) => [...prev, newProgram]);
  }

  function handleUseTemplate(exampleId: string) {
    const example = examplePrograms.find((p) => p.id === exampleId);
    if (!example) return;
    const newProgram = {
      id: `program-${Date.now()}`,
      name: example.name,
      description: example.description,
      status: example.status,
      availability: example.availability,
      breeds: [] as string[],
    };
    setPrograms((prev) => [...prev, newProgram]);
    setHiddenExamples((prev) => [...prev, exampleId]);
  }

  function handleHideExample(exampleId: string) {
    setHiddenExamples((prev) => [...prev, exampleId]);
  }

  const listedProgramsCount = programs.filter((p) => p.status).length;
  const listedPrograms = programs.filter((p) => p.status).map((p) => ({
    name: p.name,
    description: p.description,
    availability: p.availability,
  }));

  // ─── Save Draft (API-based) ────────────────────────────────────────────────
  async function handleSaveDraft(): Promise<void> {
    setSaving(true);
    setSaveError(null);
    try {
      const result = await saveMarketplaceDraft(tenantId, draft);
      if (result.ok) {
        const now = result.draftUpdatedAt || new Date().toISOString();
        initialDraftRef.current = JSON.stringify({ ...draft, updatedAt: now });
        setDraft((prev) => ({ ...prev, updatedAt: now }));
        onDirty(false);
      }
    } catch (e) {
      console.error("Failed to save draft:", e);
      setSaveError(e.message || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // Expose save method for SettingsPanel
  React.useImperativeHandle(ref, () => ({
    save: handleSaveDraft,
  }), [draft, tenantId]);

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
        breeds: draft.listedBreeds.map((name) => ({ name })),
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
        onDirty(false);
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
    programs.map((p) => ({ name: p.name, status: p.status, availability: p.availability }))
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
            Marketplace: {isPublished ? "Visible" : "Draft"}
          </Badge>
          <Badge variant="neutral">{listedProgramsCount} of {programs.length} Programs Listed</Badge>
          {draft.updatedAt && (
            <Badge variant="neutral">
              Draft Updated: {new Date(draft.updatedAt).toLocaleDateString()}
            </Badge>
          )}
          {published?.publishedAt && (
            <Badge variant="neutral">
              Published: {new Date(published.publishedAt).toLocaleDateString()}
            </Badge>
          )}
        </div>
      </div>

      {/* Section 1: Business Identity */}
      <SectionCard title="Business Identity">
        <div className="space-y-4">
          <div>
            <label className={LABEL_CLS}>Public Business Name</label>
            <input
              type="text"
              value={draft.businessName}
              onChange={(e) => updateDraft("businessName", e.target.value)}
              placeholder="Your breeding program name"
              className={INPUT_CLS}
            />
          </div>

          <div>
            <label className={LABEL_CLS}>Logo</label>
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-lg bg-card border-2 border-dashed border-hairline flex items-center justify-center text-3xl text-secondary">
                🐾
              </div>
              <div className="flex-1">
                <Button variant="outline" size="sm">Upload Logo</Button>
                <p className="text-xs text-secondary mt-2">
                  Recommended: Square image, at least 200×200px. PNG or JPG.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className={LABEL_CLS}>Short Business Bio</label>
            <textarea
              value={draft.bio}
              onChange={(e) => updateDraft("bio", e.target.value.slice(0, 500))}
              placeholder="Describe your breeding program..."
              rows={3}
              className={TEXTAREA_CLS}
            />
            <div className="text-xs text-secondary text-right mt-1">{draft.bio.length}/500</div>
          </div>

          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className={LABEL_CLS}>Website URL</label>
              <input
                type="url"
                value={draft.websiteUrl}
                onChange={(e) => updateDraft("websiteUrl", e.target.value)}
                placeholder="https://yoursite.com"
                className={INPUT_CLS}
              />
            </div>
            <Toggle checked={draft.showWebsite} onChange={(v) => updateDraft("showWebsite", v)} label="Show in Marketplace" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className={LABEL_CLS}>Instagram</label>
                <input
                  type="text"
                  value={draft.instagram}
                  onChange={(e) => updateDraft("instagram", e.target.value)}
                  placeholder="@yourbusiness"
                  className={INPUT_CLS}
                />
              </div>
              <Toggle checked={draft.showInstagram} onChange={(v) => updateDraft("showInstagram", v)} />
            </div>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className={LABEL_CLS}>Facebook</label>
                <input
                  type="text"
                  value={draft.facebook}
                  onChange={(e) => updateDraft("facebook", e.target.value)}
                  placeholder="YourPage"
                  className={INPUT_CLS}
                />
              </div>
              <Toggle checked={draft.showFacebook} onChange={(v) => updateDraft("showFacebook", v)} />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Section 2: Location and Service Area */}
      <SectionCard title="Location and Service Area">
        <div className="space-y-4">
          <p className={SUBLABEL_CLS}>
            Your full address is kept private. Choose how much to display publicly.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={LABEL_CLS}>Street Address (Private)</label>
              <input
                type="text"
                value={draft.address.street}
                onChange={(e) => updateAddress("street", e.target.value)}
                placeholder="123 Main St"
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>City</label>
              <input
                type="text"
                value={draft.address.city}
                onChange={(e) => updateAddress("city", e.target.value)}
                placeholder="City"
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>State/Province</label>
              <input
                type="text"
                value={draft.address.state}
                onChange={(e) => updateAddress("state", e.target.value)}
                placeholder="State"
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>ZIP/Postal Code</label>
              <input
                type="text"
                value={draft.address.zip}
                onChange={(e) => updateAddress("zip", e.target.value)}
                placeholder="12345"
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Country</label>
              <input
                type="text"
                value={draft.address.country}
                onChange={(e) => updateAddress("country", e.target.value)}
                placeholder="Country"
                className={INPUT_CLS}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={LABEL_CLS}>Public Location Display</label>
              <RadioGroup
                name="locationDisplay"
                value={draft.publicLocationMode}
                onChange={(v) => updateDraft("publicLocationMode", v as PublicLocationMode)}
                options={[
                  { value: "city_state", label: "City + State" },
                  { value: "zip_only", label: "ZIP Code only" },
                  { value: "full", label: "City + State + ZIP" },
                  { value: "hidden", label: "Hidden from public" },
                ]}
              />
            </div>

            <div>
              <label className={LABEL_CLS}>Search Participation</label>
              <div className="space-y-2">
                <Checkbox
                  checked={draft.searchParticipation.distanceSearch}
                  onChange={(v) => updateSearchParticipation("distanceSearch", v)}
                  label="Allow distance-based search"
                />
                <Checkbox
                  checked={draft.searchParticipation.citySearch}
                  onChange={(v) => updateSearchParticipation("citySearch", v)}
                  label="Allow city/state search"
                />
                <Checkbox
                  checked={draft.searchParticipation.zipRadius}
                  onChange={(v) => updateSearchParticipation("zipRadius", v)}
                  label="Allow ZIP radius search"
                />
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Section 3: Species and Breeds (DO NOT MODIFY) */}
      <SectionCard title="Species and Breeds">
        <div className="space-y-4">
          <div className="rounded-lg border border-hairline bg-surface-strong/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-primary">Species You Breed</h4>
                <p className="text-sm text-secondary mt-1">
                  Select all species in your breeding program.
                </p>
              </div>
              <Badge variant="neutral">
                {selectedSpecies.length} selected
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {speciesOptions.map((species) => (
                <SpeciesChip
                  key={species}
                  label={species}
                  selected={selectedSpecies.includes(species)}
                  onClick={() => toggleSpecies(species)}
                />
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-hairline bg-surface-strong/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-primary">Breeds to List</h4>
                <p className="text-sm text-secondary mt-1">
                  Select which breeds to advertise on the Marketplace.{" "}
                  <button
                    type="button"
                    className="text-[hsl(var(--brand-orange))] hover:underline"
                    onClick={onNavigateToBreeds}
                  >
                    Manage breeds
                  </button>
                </p>
              </div>
              <Badge variant="neutral">
                {breedsLoading ? "..." : `${draft.listedBreeds.length} of ${tenantBreeds.length} listed`}
              </Badge>
            </div>
            {breedsLoading ? (
              <div className="mt-3 text-sm text-secondary">Loading breeds...</div>
            ) : tenantBreeds.length === 0 ? (
              <div className="mt-3 text-sm text-secondary italic">
                No breeds added yet.{" "}
                <button
                  type="button"
                  className="text-[hsl(var(--brand-orange))] hover:underline"
                  onClick={onNavigateToBreeds}
                >
                  Add breeds to your program
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 mt-3">
                {tenantBreeds.map((breed) => {
                  const isListed = draft.listedBreeds.includes(breed.name);
                  return (
                    <button
                      key={breed.name}
                      type="button"
                      onClick={() => toggleBreedListing(breed.name)}
                      className={[
                        "text-sm px-3 py-1.5 rounded-full border transition-colors",
                        isListed
                          ? "bg-[hsl(var(--brand-orange))] text-white border-transparent"
                          : "bg-surface-strong border-hairline text-secondary hover:border-[hsl(var(--brand-orange))]/50",
                      ].join(" ")}
                    >
                      {breed.name}
                      {breed.source === "custom" && (
                        <span className={[
                          "ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full",
                          isListed ? "bg-white/20 text-white" : "bg-amber-500/20 text-amber-400"
                        ].join(" ")}>
                          Custom
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Section 4: Programs and Listings (DO NOT MODIFY) */}
      <SectionCard
        title="Programs and Listings"
        right={
          <div className="flex items-center gap-2">
            {realBreedNames.length === 0 && !breedsLoading && (
              <div className="flex items-center gap-2 text-sm text-secondary">
                <span>Add breeds to create programs.</span>
                <button
                  type="button"
                  className="text-[hsl(var(--brand-orange))] hover:underline"
                  onClick={onNavigateToBreeds}
                >
                  Manage breeds
                </button>
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
                availability={program.availability}
                onToggle={() => toggleProgram(program.id)}
              />
            ))}

            {visibleExamples.map((example) => (
              <ProgramCard
                key={example.id}
                name={example.name}
                description={example.description}
                status={example.status}
                availability={example.availability}
                onToggle={() => {}}
                isExample
                onUseTemplate={() => handleUseTemplate(example.id)}
                onHideExample={() => handleHideExample(example.id)}
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

      {/* Section 5: Standards and Credentials */}
      <SectionCard title="Standards and Credentials">
        <div className="space-y-6">
          <CredentialsChecklist
            title="Registrations and Affiliations"
            items={["AKC Breeder of Merit", "AKC Bred with H.E.A.R.T.", "GANA Member", "GRCA Member", "UKC Registered", "CKC Registered"]}
            selected={draft.standardsAndCredentials.registrations}
            onToggle={(item) => toggleCredentialItem("registrations", item)}
            noteValue={draft.standardsAndCredentials.registrationsNote}
            onNoteChange={(v) => updateCredentials("registrationsNote", v)}
          />

          <CredentialsChecklist
            title="Health and Genetic Practices"
            items={["OFA Hip/Elbow", "OFA Cardiac", "OFA Eyes (CAER)", "PennHIP", "Genetic Testing", "Embark/Wisdom Panel"]}
            selected={draft.standardsAndCredentials.healthPractices}
            onToggle={(item) => toggleCredentialItem("healthPractices", item)}
            noteValue={draft.standardsAndCredentials.healthNote}
            onNoteChange={(v) => updateCredentials("healthNote", v)}
          />

          <CredentialsChecklist
            title="Breeding Practices"
            items={["Health-tested parents only", "Puppy Culture", "Avidog Program", "Breeding soundness exam", "Limited breeding rights", "Co-ownership available"]}
            selected={draft.standardsAndCredentials.breedingPractices}
            onToggle={(item) => toggleCredentialItem("breedingPractices", item)}
            noteValue={draft.standardsAndCredentials.breedingNote}
            onNoteChange={(v) => updateCredentials("breedingNote", v)}
          />

          <CredentialsChecklist
            title="Care and Early Life"
            items={["ENS/ESI", "Vet checked", "First vaccinations", "Microchipped", "Crate/potty training started", "Socialization protocol"]}
            selected={draft.standardsAndCredentials.carePractices}
            onToggle={(item) => toggleCredentialItem("carePractices", item)}
            noteValue={draft.standardsAndCredentials.careNote}
            onNoteChange={(v) => updateCredentials("careNote", v)}
          />
        </div>
      </SectionCard>

      {/* Section 6: Placement Policies */}
      <SectionCard title="Placement Policies">
        <div className="space-y-4">
          <div className="space-y-2">
            <Checkbox
              checked={draft.placementPolicies.requireApplication}
              onChange={(v) => updatePlacement("requireApplication", v)}
              label="Require application"
            />
            <Checkbox
              checked={draft.placementPolicies.requireInterview}
              onChange={(v) => updatePlacement("requireInterview", v)}
              label="Require interview/meeting"
            />
            <Checkbox
              checked={draft.placementPolicies.requireContract}
              onChange={(v) => updatePlacement("requireContract", v)}
              label="Require signed contract"
            />
            <Checkbox
              checked={draft.placementPolicies.hasReturnPolicy}
              onChange={(v) => updatePlacement("hasReturnPolicy", v)}
              label="Lifetime return policy"
            />
            <Checkbox
              checked={draft.placementPolicies.offersSupport}
              onChange={(v) => updatePlacement("offersSupport", v)}
              label="Ongoing breeder support"
            />
          </div>
          <div>
            <label className={LABEL_CLS}>Additional Placement Notes</label>
            <textarea
              value={draft.placementPolicies.note}
              onChange={(e) => updatePlacement("note", e.target.value.slice(0, 300))}
              placeholder="Describe your placement process..."
              rows={3}
              className={TEXTAREA_CLS}
            />
            <div className="text-xs text-secondary text-right mt-1">{draft.placementPolicies.note.length}/300</div>
          </div>
        </div>
      </SectionCard>

      {/* Section 7: Trust Signals and Badges */}
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

      {/* Section 8: Preview and Validation */}
      <SectionCard title="Preview and Validation">
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

          <div className="flex items-center gap-3 pt-4 border-t border-hairline">
            <Button variant="outline" onClick={handleSaveDraft} disabled={saving}>
              {saving ? "Saving..." : "Save Draft"}
            </Button>
            <Button onClick={handlePublish} disabled={!canPublish || publishing}>
              {publishing ? "Publishing..." : "Publish to Marketplace"}
            </Button>
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
});

export default MarketplaceSettingsTabInner;
