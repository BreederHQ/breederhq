// apps/marketplace/src/breeder/pages/MarketplaceManagePortal.tsx
// Marketplace Storefront Management - V2
//
// Complete storefront management including:
// - Business Profile (name, bio, logo)
// - Location settings
// - Breeds selection
// - Contact & Social links
// - Standards & Credentials (registrations, health, breeding, care practices)
// - Placement Policies
// - Program Listings

import * as React from "react";
import { Link } from "react-router-dom";
import { Button, BreedCombo, CustomBreedDialog } from "@bhq/ui";
import type { BreedHit } from "@bhq/ui";
import { createPortal } from "react-dom";
import { getOverlayRoot } from "@bhq/ui/overlay";
import {
  Store,
  PawPrint,
  Plus,
  Trash2,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  Shield,
  Award,
  Heart,
  Sparkles,
  Dog,
  Link2,
  Lock,
  Pencil,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Upload,
  Clock,
  FileText,
  Calendar,
  Baby,
  Users,
} from "lucide-react";

// API imports
import {
  getMarketplaceProfile,
  saveMarketplaceProfileDraft,
  publishMarketplaceProfile,
  unpublishMarketplaceProfile,
  getBreederBreedingPlans,
  getBreederOffspringGroups,
  type MarketplaceProfileData,
  type MarketplaceProfileDraft,
  type BreederBreedingPlanItem,
  type BreederOffspringGroupItem,
} from "../../api/client";
import { DefaultCoverImage } from "../../shared/DefaultCoverImage";
import { ImageUpload } from "../../shared/ImageUpload";

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function getTenantId(): string {
  try {
    const w = typeof window !== "undefined" ? (window as any) : {};
    return w.__BHQ_TENANT_ID__ || localStorage.getItem("BHQ_TENANT_ID") || "";
  } catch {
    return "";
  }
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// VISIBILITY TOGGLE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

/** Visibility toggle pill button for showing/hiding sections on marketplace */
function VisibilityToggle({
  isPublic,
  onChange,
  disabled,
}: {
  isPublic: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!isPublic)}
      disabled={disabled}
      className={`
        inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium transition-all
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${isPublic
          ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
          : "bg-zinc-500/15 text-zinc-400 hover:bg-zinc-500/25"
        }
      `}
    >
      {isPublic ? (
        <>
          <Eye className="w-3 h-3" />
          Public
        </>
      ) : (
        <>
          <EyeOff className="w-3 h-3" />
          Unlisted
        </>
      )}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BREEDS TYPES
// ═══════════════════════════════════════════════════════════════════════════

type BreedsSpecies = "DOG" | "CAT" | "HORSE" | "GOAT" | "SHEEP" | "RABBIT";
type BreedsSpeciesUI = "Dog" | "Cat" | "Horse" | "Goat" | "Sheep" | "Rabbit";

type SelectedBreed = {
  id: string | number;
  breedId?: number | null;
  customBreedId?: number | null;
  name: string;
  species: BreedsSpeciesUI;
  source: "canonical" | "custom";
};

const SPECIES_OPTIONS: BreedsSpeciesUI[] = ["Dog", "Cat", "Horse", "Goat", "Sheep", "Rabbit"];

function toApiSpecies(ui: BreedsSpeciesUI): BreedsSpecies {
  return ui.toUpperCase() as BreedsSpecies;
}

function toUiSpecies(api: string): BreedsSpeciesUI {
  const up = String(api).toUpperCase();
  if (up === "DOG") return "Dog";
  if (up === "CAT") return "Cat";
  if (up === "HORSE") return "Horse";
  if (up === "GOAT") return "Goat";
  if (up === "SHEEP") return "Sheep";
  if (up === "RABBIT") return "Rabbit";
  return "Dog";
}

// ═══════════════════════════════════════════════════════════════════════════
// CREDENTIAL OPTIONS (from SettingsPanel)
// ═══════════════════════════════════════════════════════════════════════════

// Registry options are now fetched dynamically from the database
// See fetchRegistries() in CredentialsSection component

const HEALTH_PRACTICE_OPTIONS = [
  "OFA Hip/Elbow",
  "OFA Cardiac",
  "OFA Eyes (CAER)",
  "PennHIP",
  "Genetic Testing",
  "Embark/Wisdom Panel",
];

const BREEDING_PRACTICE_OPTIONS = [
  "Health-tested parents only",
  "Puppy Culture",
  "Avidog Program",
  "Breeding soundness exam",
  "Limited breeding rights",
  "Co-ownership available",
];

const CARE_PRACTICE_OPTIONS = [
  "ENS/ESI",
  "Vet checked",
  "First vaccinations",
  "Microchipped",
  "Crate/potty training started",
  "Socialization protocol",
];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PORTAL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

type ActiveSection = "business" | "breeds" | "credentials" | "policies";

export interface MarketplaceManagePortalProps {
  embedded?: boolean; // If true, renders without page header (for use in drawer)
}

export function MarketplaceManagePortal({ embedded = false }: MarketplaceManagePortalProps = {}) {
  const tenantId = getTenantId();
  const [profileData, setProfileData] = React.useState<MarketplaceProfileData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState<ActiveSection>("business");

  // Form state - initialized from draft or published
  const [form, setForm] = React.useState<MarketplaceProfileDraft>({});
  const [originalForm, setOriginalForm] = React.useState<MarketplaceProfileDraft>({});
  const [hasChanges, setHasChanges] = React.useState(false);

  // Foaling dashboard state
  const [breedingPlans, setBreedingPlans] = React.useState<BreederBreedingPlanItem[]>([]);
  const [loadingPlans, setLoadingPlans] = React.useState(false);

  // Fetch profile data on mount
  React.useEffect(() => {
    if (!tenantId) return;

    let dead = false;

    async function fetchProfile() {
      setLoading(true);
      setError(null);
      try {
        const data = await getMarketplaceProfile(tenantId);
        if (dead) return;
        setProfileData(data);
        // Initialize form: MERGE published data with draft
        // Start with published as base, then overlay draft fields on top
        // This ensures:
        // 1. If no draft exists, we see published data for editing
        // 2. If draft has partial edits, we see draft changes + missing fields from published
        // 3. User always sees the complete picture of their storefront
        const published = data.published || {};
        const draft = data.draft || {};
        const merged = { ...published, ...draft };

        // Normalize breeds: v1 data might use "listedBreeds" instead of "breeds"
        // and might have strings instead of objects
        const rawBreeds = merged.breeds || (merged as any).listedBreeds || [];
        if (Array.isArray(rawBreeds)) {
          merged.breeds = rawBreeds.map((b: unknown) => {
            if (typeof b === "string") {
              return { name: b, species: "Dog", isPublic: true }; // Default to Dog for legacy data
            }
            if (b && typeof b === "object" && "name" in b) {
              // Normalize species: could be null, uppercase "DOG", or capitalized "Dog"
              let species = (b as any).species;
              if (!species) {
                species = "Dog";
              } else if (typeof species === "string") {
                // Capitalize first letter, lowercase rest: "DOG" -> "Dog", "dog" -> "Dog"
                species = species.charAt(0).toUpperCase() + species.slice(1).toLowerCase();
              }
              return {
                name: (b as any).name,
                species,
                breedId: (b as any).breedId,
                customBreedId: (b as any).customBreedId,
                source: (b as any).source,
                isPublic: (b as any).isPublic ?? true,
              };
            }
            return null;
          }).filter(Boolean);
        }

        // Normalize listedPrograms: v1 data might use "programs" instead of "listedPrograms"
        const rawPrograms = merged.listedPrograms || (merged as any).programs || [];
        if (Array.isArray(rawPrograms)) {
          merged.listedPrograms = rawPrograms.map((p: unknown) => {
            if (typeof p === "string") {
              return { name: p, species: "DOG", description: null, acceptInquiries: true, openWaitlist: false, comingSoon: false };
            }
            if (p && typeof p === "object" && "name" in p) {
              const prog = p as any;
              return {
                // Preserve all fields from the stored program
                ...prog,
                // Set defaults for required fields
                name: prog.name,
                species: prog.species || "DOG",
                breedText: prog.breedText || null,
                breedId: prog.breedId ?? null,
                description: prog.description || null,
                programStory: prog.programStory || null,
                coverImageUrl: prog.coverImageUrl || null,
                showCoverImage: prog.showCoverImage ?? true,
                acceptInquiries: prog.acceptInquiries ?? true,
                openWaitlist: prog.openWaitlist ?? false,
                acceptReservations: prog.acceptReservations ?? false,
                comingSoon: prog.comingSoon ?? false,
                pricingTiers: prog.pricingTiers || null,
                whatsIncluded: prog.whatsIncluded || null,
                typicalWaitTime: prog.typicalWaitTime || null,
                showWhatsIncluded: prog.showWhatsIncluded ?? true,
                showWaitTime: prog.showWaitTime ?? true,
                mediaAssetIds: prog.mediaAssetIds || [],
              };
            }
            return null;
          }).filter(Boolean);
        }

        // Normalize standardsAndCredentials: ensure show* flags default to true for legacy data with items
        if (merged.standardsAndCredentials) {
          const creds = merged.standardsAndCredentials as any;
          merged.standardsAndCredentials = {
            ...creds,
            // Default show* to true if items exist and show* is not explicitly set
            showRegistrations: creds.showRegistrations ?? ((creds.registrations?.length || 0) > 0),
            showHealthPractices: creds.showHealthPractices ?? ((creds.healthPractices?.length || 0) > 0),
            showBreedingPractices: creds.showBreedingPractices ?? ((creds.breedingPractices?.length || 0) > 0),
            showCarePractices: creds.showCarePractices ?? ((creds.carePractices?.length || 0) > 0),
          };
        }

        // Normalize placementPolicies: ensure showPolicies defaults to true for legacy data
        if (merged.placementPolicies) {
          const policies = merged.placementPolicies as any;
          const hasAnyPolicy = policies.requireApplication || policies.requireInterview ||
            policies.requireContract || policies.requireDeposit || policies.requireHomeVisit ||
            policies.requireVetReference || policies.requireSpayNeuter || policies.hasReturnPolicy ||
            policies.lifetimeTakeBack || policies.offersSupport;
          merged.placementPolicies = {
            ...policies,
            showPolicies: policies.showPolicies ?? hasAnyPolicy,
          };
        }

        setForm(merged);
        setOriginalForm(JSON.parse(JSON.stringify(merged))); // Deep copy for comparison
        setHasChanges(false);
      } catch (err: any) {
        if (!dead) setError(err.message || "Failed to load profile");
      } finally {
        if (!dead) setLoading(false);
      }
    }

    fetchProfile();
    return () => { dead = true; };
  }, [tenantId]);

  // Fetch breeding plans for foaling dashboard (only for HORSE species)
  React.useEffect(() => {
    if (!tenantId || embedded) return; // Skip if embedded in drawer

    let cancelled = false;
    setLoadingPlans(true);

    getBreederBreedingPlans(tenantId, { limit: 100 })
      .then((res) => {
        if (cancelled) return;
        // Only include HORSE species plans
        const horsePlans = (res.items || []).filter(
          (p) => p.species?.toUpperCase() === "HORSE"
        );
        setBreedingPlans(horsePlans);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoadingPlans(false);
      });

    return () => { cancelled = true; };
  }, [tenantId, embedded]);

  // Check if breeder has any horse breeds (for showing foaling widget)
  const hasHorseBreeds = React.useMemo(() => {
    const breeds = form.breeds || [];
    return breeds.some((b: any) =>
      b.species?.toUpperCase() === "HORSE" ||
      b.species?.toLowerCase() === "horse"
    );
  }, [form.breeds]);

  // Track changes - compare against original to detect real changes
  const updateForm = (updates: Partial<MarketplaceProfileDraft>) => {
    setForm((prev) => {
      const newForm = { ...prev, ...updates };
      // Compare new form against original to detect real changes
      const hasRealChanges = JSON.stringify(newForm) !== JSON.stringify(originalForm);
      setHasChanges(hasRealChanges);
      return newForm;
    });
  };

  // Save draft
  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await saveMarketplaceProfileDraft(tenantId, form);
      // Update originalForm to match what we just saved
      setOriginalForm(JSON.parse(JSON.stringify(form)));
      setHasChanges(false);
      // Refresh profile data for draftUpdatedAt timestamp
      const data = await getMarketplaceProfile(tenantId);
      setProfileData(data);
    } catch (err: any) {
      alert(err.message || "Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  // Publish profile
  const handlePublish = async () => {
    if (!form.businessName?.trim()) {
      alert("Business name is required to publish");
      return;
    }
    if (!form.breeds?.length) {
      alert("At least one breed is required to publish");
      return;
    }

    setPublishing(true);
    try {
      // Save all programs - the API/frontend will filter incomplete ones when displaying publicly
      await publishMarketplaceProfile(tenantId, form);
      // Update originalForm to match what we just published
      // This prevents false "unsaved changes" detection
      setOriginalForm(JSON.parse(JSON.stringify(form)));
      setHasChanges(false);
      // Refresh profile data for publishedAt timestamp
      const data = await getMarketplaceProfile(tenantId);
      setProfileData(data);
    } catch (err: any) {
      alert(err.message || "Failed to publish profile");
    } finally {
      setPublishing(false);
    }
  };

  // Unpublish profile
  const handleUnpublish = async () => {
    if (!confirm("This will remove your breeder listing from the marketplace. Continue?")) return;
    setPublishing(true);
    try {
      await unpublishMarketplaceProfile(tenantId);
      const data = await getMarketplaceProfile(tenantId);
      setProfileData(data);
    } catch (err: any) {
      alert(err.message || "Failed to unpublish profile");
    } finally {
      setPublishing(false);
    }
  };

  if (!tenantId) {
    return (
      <div className="min-h-screen bg-portal-surface flex items-center justify-center">
        <div className="text-center">
          <Store className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
          <p className="text-text-secondary">No business selected.</p>
          <p className="text-sm text-text-tertiary mt-1">Please select a business to manage your marketplace presence.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-portal-surface">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-12 w-64 bg-portal-card rounded animate-pulse mb-8" />
          <div className="h-48 bg-portal-card rounded-lg animate-pulse mb-6" />
          <div className="h-64 bg-portal-card rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-portal-surface">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12 bg-portal-card rounded-lg border border-border-subtle">
            <AlertCircle className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
            <p className="text-red-400 mb-4">{error}</p>
            <Button variant="secondary" onClick={() => window.location.reload()}>
              Reload
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isPublished = !!profileData?.publishedAt;

  return (
    <div className={embedded ? "" : "min-h-screen bg-portal-surface"}>
      <div className={embedded ? "p-6" : "max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8"}>
        {/* Header - Hide when embedded in drawer */}
        {!embedded && (
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Marketplace Storefront</h1>
            <p className="text-sm text-text-secondary mt-1">
              Configure your breeder profile for the marketplace
            </p>
          </div>
        )}

        {/* Status Banner */}
        <div className={`rounded-lg p-4 border mb-6 ${
          isPublished
            ? "bg-green-500/10 border-green-500/30"
            : "bg-zinc-500/10 border-zinc-500/30"
        }`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              {isPublished ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm text-green-300">
                    Your Storefront is Currently Live on the Marketplace
                  </span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-zinc-500" />
                  <span className="text-sm text-zinc-400">
                    Your Storefront is Currently Not Listed in the BreederHQ Marketplace
                  </span>
                </>
              )}
              <VisibilityToggle
                isPublic={isPublished}
                onChange={async (makePublic) => {
                  if (makePublic) {
                    // Publish
                    await handlePublish();
                  } else {
                    // Unpublish
                    await handleUnpublish();
                  }
                }}
                disabled={publishing || (!isPublished && (!form.businessName?.trim() || !form.breeds?.length))}
              />
            </div>
            <div className="flex items-center gap-2">
              {hasChanges && (
                <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full animate-pulse">
                  Unsaved changes
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSaveDraft}
                disabled={saving || !hasChanges}
              >
                {saving ? "Saving..." : "Save Draft"}
              </Button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={publishing}
                className={`
                  px-4 py-1.5 text-sm font-medium rounded-lg transition-all
                  ${publishing
                    ? "bg-zinc-600 text-zinc-400 cursor-wait"
                    : hasChanges
                      ? "bg-accent text-white shadow-lg shadow-accent/30 hover:bg-accent/90"
                      : isPublished
                        ? "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                        : "bg-accent text-white hover:bg-accent/90"
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {publishing ? "Publishing..." : isPublished ? "Update Listing" : "Publish"}
              </button>
            </div>
          </div>
        </div>

        {/* Warning Banners - Missing Required Items */}
        {((form.breeds?.length || 0) === 0 || (form.listedPrograms?.length || 0) === 0) && (
          <div className="space-y-3 mb-6">
            {(form.breeds?.length || 0) === 0 && (
              <div className="rounded-lg p-4 border bg-red-500/10 border-red-500/30">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-300">
                      No Breeds selected
                    </p>
                    <p className="text-xs text-red-400/80 mt-0.5">
                      You must select at least one breed to publish your storefront.
                      <button
                        type="button"
                        onClick={() => setActiveSection("breeds")}
                        className="ml-1 underline hover:text-red-300 transition-colors"
                      >
                        Select breeds now →
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            )}
            {(form.listedPrograms?.length || 0) === 0 && (
              <div className="rounded-lg p-4 border bg-red-500/10 border-red-500/30">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-300">
                      No Breeding Programs configured
                    </p>
                    <p className="text-xs text-red-400/80 mt-0.5">
                      Your storefront won't be visible to shoppers without at least one breeding program.
                      <Link
                        to="/manage/breeding-programs"
                        className="ml-1 underline hover:text-red-300 transition-colors"
                      >
                        Add a breeding program now →
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manage Storefront Banner - Only show when NOT embedded in drawer */}
        {!embedded && (
          <>
            <div className="bg-gradient-to-r from-accent/10 via-accent/5 to-transparent border border-accent/20 rounded-xl p-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-accent/20 rounded-xl">
                  <Store className="w-6 h-6 text-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">Manage Your Storefront</h3>
                  <p className="text-sm text-text-secondary mb-4">
                    Configure your business profile, breeds, credentials, policies, and breeding programs
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setActiveSection("business")}
                  >
                    Edit Storefront Settings
                  </Button>
                </div>
              </div>
            </div>

            {/* 4 Hero Cards - Main Navigation */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Direct Listings Card */}
          <Link
            to="/manage/individual-animals"
            className="bg-gradient-to-br from-purple-500/10 via-portal-card to-portal-surface border-l-4 border-l-purple-500 rounded-xl overflow-hidden hover:border-l-purple-400 transition-all group cursor-pointer shadow-lg hover:shadow-purple-500/20 block"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-purple-500/20 rounded-xl group-hover:bg-purple-500/30 transition-colors">
                  <Sparkles className="w-8 h-8 text-purple-400" />
                </div>
                <ChevronRight className="w-6 h-6 text-text-tertiary group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Individual Animals</h3>
              <p className="text-sm text-text-tertiary mb-4">
                List individual animals for sale or placement
              </p>
              <div className="pt-4 border-t border-border-subtle">
                <div className="text-accent font-medium flex items-center gap-2">
                  Manage Listings
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </Link>

          {/* Animal Programs Card */}
          <Link
            to="/manage/animal-programs"
            className="bg-gradient-to-br from-blue-500/10 via-portal-card to-portal-surface border-l-4 border-l-blue-500 rounded-xl overflow-hidden hover:border-l-blue-400 transition-all group cursor-pointer shadow-lg hover:shadow-blue-500/20 block"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition-colors">
                  <Users className="w-8 h-8 text-blue-400" />
                </div>
                <ChevronRight className="w-6 h-6 text-text-tertiary group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Animal Programs</h3>
              <p className="text-sm text-text-tertiary mb-4">
                STUD, REHOME, GUARDIAN, and other recurring programs
              </p>
              <div className="pt-4 border-t border-border-subtle">
                <div className="text-accent font-medium flex items-center gap-2">
                  Manage Programs
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </Link>

          {/* Breeding Programs Card */}
          <Link
            to="/manage/breeding-programs"
            className="bg-gradient-to-br from-amber-500/10 via-portal-card to-portal-surface border-l-4 border-l-amber-500 rounded-xl overflow-hidden hover:border-l-amber-400 transition-all group cursor-pointer shadow-lg hover:shadow-amber-500/20 block"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-amber-500/20 rounded-xl group-hover:bg-amber-500/30 transition-colors">
                  <PawPrint className="w-8 h-8 text-amber-400" />
                </div>
                <ChevronRight className="w-6 h-6 text-text-tertiary group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Breeding Programs</h3>
              <p className="text-sm text-text-tertiary mb-4">
                Offspring groups from your breeding plans
              </p>
              <div className="pt-4 border-t border-border-subtle">
                <div className="text-accent font-medium flex items-center gap-2">
                  Manage Programs
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </Link>

          {/* Services Listings Card */}
          <Link
            to="/manage/your-services"
            className="bg-gradient-to-br from-green-500/10 via-portal-card to-portal-surface border-l-4 border-l-green-500 rounded-xl overflow-hidden hover:border-l-green-400 transition-all group cursor-pointer shadow-lg hover:shadow-green-500/20 block"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-green-500/20 rounded-xl group-hover:bg-green-500/30 transition-colors">
                  <Heart className="w-8 h-8 text-green-400" />
                </div>
                <ChevronRight className="w-6 h-6 text-text-tertiary group-hover:text-green-400 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Your Services</h3>
              <p className="text-sm text-text-tertiary mb-4">
                Offer training, grooming, or other professional services
              </p>
              <div className="pt-4 border-t border-border-subtle">
                <div className="text-accent font-medium flex items-center gap-2">
                  Manage Services
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </Link>
            </div>

          </>
        )}

        {/* Expandable Storefront Settings Sections (Shown when "Edit Storefront Settings" is clicked or when embedded in drawer) */}
        {(embedded || (activeSection === "business" || activeSection === "breeds" || activeSection === "credentials" || activeSection === "policies")) && (
          <>
            {/* Section Tabs */}
            <div className="flex flex-wrap gap-1 border-b border-border-subtle mb-6">
              <button
                type="button"
                onClick={() => setActiveSection("business")}
                className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
                  activeSection === "business"
                    ? "text-white border-accent"
                    : "text-text-secondary hover:text-white border-transparent"
                }`}
              >
                <Store size={14} className="inline mr-2" />
                Business Profile
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("breeds")}
                className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px relative ${
                  activeSection === "breeds"
                    ? "text-white border-accent"
                    : (form.breeds?.length || 0) === 0
                      ? "text-amber-400 hover:text-amber-300 border-amber-500/50"
                      : "text-text-secondary hover:text-white border-transparent"
                }`}
              >
                <Dog size={14} className="inline mr-2" />
                Your Breeds
                {(form.breeds?.length || 0) === 0 && activeSection !== "breeds" && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("credentials")}
                className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
                  activeSection === "credentials"
                    ? "text-white border-accent"
                    : "text-text-secondary hover:text-white border-transparent"
                }`}
              >
                <Award size={14} className="inline mr-2" />
                Standards & Credentials
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("policies")}
                className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
                  activeSection === "policies"
                    ? "text-white border-accent"
                    : "text-text-secondary hover:text-white border-transparent"
                }`}
              >
                <Shield size={14} className="inline mr-2" />
                Placement Policies
              </button>
            </div>

            {/* Business Profile Section */}
            {activeSection === "business" && (
              <BusinessProfileSection form={form} updateForm={updateForm} tenantId={tenantId} />
            )}

            {/* Your Breeds Section */}
            {activeSection === "breeds" && (
              <BreedsSection form={form} updateForm={updateForm} tenantId={tenantId} isPublished={isPublished} />
            )}

            {/* Standards & Credentials Section */}
            {activeSection === "credentials" && (
              <CredentialsSection form={form} updateForm={updateForm} />
            )}

            {/* Placement Policies Section */}
            {activeSection === "policies" && (
              <PoliciesSection form={form} updateForm={updateForm} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BUSINESS PROFILE SECTION
// ═══════════════════════════════════════════════════════════════════════════

function BusinessProfileSection({
  form,
  updateForm,
  tenantId,
}: {
  form: MarketplaceProfileDraft;
  updateForm: (updates: Partial<MarketplaceProfileDraft>) => void;
  tenantId: string;
}) {
  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="bg-portal-card border border-border-subtle rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Business Identity</h3>
          <VisibilityToggle
            isPublic={form.showBusinessIdentity ?? true}
            onChange={(v) => updateForm({ showBusinessIdentity: v })}
          />
        </div>
        <p className="text-sm text-text-tertiary mb-4">Your program name, logo, and description</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Business Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.businessName || ""}
              onChange={(e) => updateForm({ businessName: e.target.value })}
              placeholder="Your Breeding Program Name"
              className="w-full px-3 py-2 text-sm bg-portal-surface border border-border-subtle rounded-lg focus:border-accent focus:outline-none"
            />
          </div>

          <div className="flex items-start gap-4">
            <ImageUpload
              value={form.logoUrl}
              onChange={(url) => updateForm({ logoUrl: url })}
              label="Program Logo"
              placeholder="https://example.com/logo.png"
              recommendedSize="Recommended: Square image (e.g., 400x400px). Displayed on breeder cards and profile pages."
              previewClassName="w-24 h-24"
              showDefaultWhenEmpty={true}
              emptyStateHint="💡 Add your logo to stand out"
              emptyStateExplanation="Without a custom logo, buyers see the BreederHQ default. Adding your logo helps build brand recognition."
            />
            <div className="pt-6">
              <VisibilityToggle
                isPublic={form.showLogo ?? true}
                onChange={(v) => updateForm({ showLogo: v })}
                disabled={!form.logoUrl?.trim()}
              />
            </div>
          </div>

          <div className="flex items-start gap-4">
            <ImageUpload
              value={form.bannerImageUrl}
              onChange={(url) => updateForm({ bannerImageUrl: url })}
              label="Profile Banner Image"
              placeholder="https://example.com/banner.jpg"
              recommendedSize="Recommended: Wide image (e.g., 1200x400px). Displayed as a banner at the top of your breeder profile page."
              previewClassName="w-full h-32"
              showDefaultWhenEmpty={true}
              emptyStateHint="💡 Showcase your facility or animals"
              emptyStateExplanation="Without a custom banner, buyers see the BreederHQ default. A banner featuring your facilities, animals, or landscape creates a professional first impression."
            />
            <div className="pt-6">
              <VisibilityToggle
                isPublic={form.showBanner ?? true}
                onChange={(v) => updateForm({ showBanner: v })}
                disabled={!form.bannerImageUrl?.trim()}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">About Your Program</label>
            <textarea
              value={form.bio || ""}
              onChange={(e) => updateForm({ bio: e.target.value })}
              placeholder="Tell potential buyers about your breeding program, experience, and what makes you unique..."
              rows={4}
              maxLength={1000}
              className="w-full px-3 py-2 text-sm bg-portal-surface border border-border-subtle rounded-lg resize-none focus:border-accent focus:outline-none"
            />
            <div className="text-xs text-text-tertiary text-right mt-1">{(form.bio || "").length}/1000</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Year Established</label>
            <input
              type="number"
              value={form.yearEstablished || ""}
              onChange={(e) => updateForm({ yearEstablished: e.target.value ? parseInt(e.target.value, 10) : null })}
              placeholder="2010"
              min="1900"
              max={new Date().getFullYear()}
              className="w-48 px-3 py-2 text-sm bg-portal-surface border border-border-subtle rounded-lg focus:border-accent focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Website & Social Links */}
      <div className="bg-portal-card border border-border-subtle rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-2">Website & Social Links</h3>
        <p className="text-sm text-text-tertiary mb-4">Control visibility for each link individually</p>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-text-secondary mb-1">Website</label>
              <input
                type="url"
                value={form.websiteUrl || ""}
                onChange={(e) => updateForm({ websiteUrl: e.target.value })}
                placeholder="https://yourwebsite.com"
                className="w-full px-3 py-2 text-sm bg-portal-surface border border-border-subtle rounded-lg focus:border-accent focus:outline-none"
              />
            </div>
            <div className="pt-6">
              <VisibilityToggle
                isPublic={form.showWebsite ?? true}
                onChange={(v) => updateForm({ showWebsite: v })}
                disabled={!form.websiteUrl?.trim()}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-text-secondary mb-1">Instagram</label>
                <input
                  type="text"
                  value={form.instagram || ""}
                  onChange={(e) => updateForm({ instagram: e.target.value })}
                  placeholder="@yourhandle"
                  className="w-full px-3 py-2 text-sm bg-portal-surface border border-border-subtle rounded-lg focus:border-accent focus:outline-none"
                />
              </div>
              <div className="pt-6">
                <VisibilityToggle
                  isPublic={form.showInstagram ?? true}
                  onChange={(v) => updateForm({ showInstagram: v })}
                  disabled={!form.instagram?.trim()}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-text-secondary mb-1">Facebook</label>
                <input
                  type="text"
                  value={form.facebook || ""}
                  onChange={(e) => updateForm({ facebook: e.target.value })}
                  placeholder="facebook.com/yourpage"
                  className="w-full px-3 py-2 text-sm bg-portal-surface border border-border-subtle rounded-lg focus:border-accent focus:outline-none"
                />
              </div>
              <div className="pt-6">
                <VisibilityToggle
                  isPublic={form.showFacebook ?? true}
                  onChange={(v) => updateForm({ showFacebook: v })}
                  disabled={!form.facebook?.trim()}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="bg-portal-card border border-border-subtle rounded-lg p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-white">Location</h3>
          <VisibilityToggle
            isPublic={form.publicLocationMode !== "hidden"}
            onChange={(v) => updateForm({ publicLocationMode: v ? "city_state" : "hidden" })}
          />
        </div>
        <p className="text-sm text-text-tertiary mb-4">Control what location details are visible on the marketplace</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Street Address</label>
            <input
              type="text"
              value={form.address?.streetAddress || ""}
              onChange={(e) => updateForm({ address: { ...form.address, streetAddress: e.target.value } })}
              placeholder="123 Main St"
              className="w-full px-3 py-2 text-sm bg-portal-surface border border-border-subtle rounded-lg focus:border-accent focus:outline-none"
            />
            <p className="text-xs text-text-tertiary mt-1">Your full address is never shown publicly. Use the options below to choose what location info to display.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">City</label>
              <input
                type="text"
                value={form.address?.city || ""}
                onChange={(e) => updateForm({ address: { ...form.address, city: e.target.value } })}
                placeholder="City"
                className="w-full px-3 py-2 text-sm bg-portal-surface border border-border-subtle rounded-lg focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">State/Province</label>
              <input
                type="text"
                value={form.address?.state || ""}
                onChange={(e) => updateForm({ address: { ...form.address, state: e.target.value } })}
                placeholder="State"
                className="w-full px-3 py-2 text-sm bg-portal-surface border border-border-subtle rounded-lg focus:border-accent focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">ZIP/Postal Code</label>
              <input
                type="text"
                value={form.address?.zip || ""}
                onChange={(e) => updateForm({ address: { ...form.address, zip: e.target.value } })}
                placeholder="ZIP"
                className="w-full px-3 py-2 text-sm bg-portal-surface border border-border-subtle rounded-lg focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Country</label>
              <input
                type="text"
                value={form.address?.country || "United States"}
                onChange={(e) => updateForm({ address: { ...form.address, country: e.target.value } })}
                placeholder="Country"
                className="w-full px-3 py-2 text-sm bg-portal-surface border border-border-subtle rounded-lg focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">What buyers see</label>
            <p className="text-xs text-text-tertiary mb-3">Choose how your location appears on your marketplace profile</p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "city_state", label: "City + State" },
                { value: "zip_only", label: "ZIP Code Only" },
                { value: "full", label: "Full (City, State ZIP)" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateForm({ publicLocationMode: opt.value as any })}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    form.publicLocationMode === opt.value
                      ? "bg-blue-500/20 border-blue-400 text-blue-300"
                      : "bg-portal-surface border-border-subtle text-text-secondary hover:border-border-default"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// YOUR BREEDS SECTION
// ═══════════════════════════════════════════════════════════════════════════

function BreedsSection({
  form,
  updateForm,
  tenantId,
  isPublished,
}: {
  form: MarketplaceProfileDraft;
  updateForm: (updates: Partial<MarketplaceProfileDraft>) => void;
  tenantId: string;
  isPublished: boolean;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Breeding Program Breeds</h2>
        <p className="text-sm text-text-tertiary mt-1">
          Select the breeds you work with in your breeding program. These will be available for marketplace listings.
        </p>
      </div>

      <div className="bg-portal-card border border-border-subtle rounded-lg p-6">
        <BreedsSelector
          breeds={form.breeds || []}
          onChange={(breeds) => updateForm({ breeds })}
          tenantId={tenantId}
          isPublished={isPublished}
          listedPrograms={form.listedPrograms || []}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BREEDS SELECTOR (Full featured with BreedCombo)
// ═══════════════════════════════════════════════════════════════════════════

function BreedsSelector({
  breeds,
  onChange,
  tenantId,
  isPublished,
  listedPrograms,
}: {
  breeds: Array<{ name: string; species?: string | null; breedId?: number | null; customBreedId?: number | null; source?: string; isPublic?: boolean }>;
  onChange: (breeds: Array<{ name: string; species?: string | null; breedId?: number | null; customBreedId?: number | null; source?: string; isPublic?: boolean }>) => void;
  tenantId: string;
  isPublished: boolean;
  listedPrograms: ListedProgramItem[];
}) {
  const [selectedSpecies, setSelectedSpecies] = React.useState<BreedsSpeciesUI>("Dog");
  const [selectedBreed, setSelectedBreed] = React.useState<BreedHit | null>(null);
  const [customBreedOpen, setCustomBreedOpen] = React.useState(false);
  const [linkedBreeds, setLinkedBreeds] = React.useState<Set<string>>(new Set());

  // Fetch breeding programs to determine which breeds are linked
  React.useEffect(() => {
    async function fetchBreedingPrograms() {
      try {
        const csrf = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/)?.[1];
        const res = await fetch("/api/v1/breeding/programs?limit=100", {
          credentials: "include",
          headers: {
            "X-Tenant-Id": tenantId,
            ...(csrf ? { "X-CSRF-Token": decodeURIComponent(csrf) } : {}),
          },
        });
        if (res.ok) {
          const data = await res.json();
          const linked = new Set<string>();
          for (const program of data.items || []) {
            if (program.breedText) {
              linked.add(program.breedText.toLowerCase());
            }
          }
          setLinkedBreeds(linked);
        }
      } catch {
        // Silently fail - worst case, all breeds can be removed
      }
    }
    fetchBreedingPrograms();
  }, [tenantId]);

  const isBreedLinked = (breedName: string) => linkedBreeds.has(breedName.toLowerCase());

  // Determine why a breed cannot be removed (for tooltip)
  const getRemovalBlockReason = (breedName: string): string | null => {
    // Cannot remove if linked to a breeding program
    if (isBreedLinked(breedName)) {
      return "Breed is linked to a breeding program. Remove the program first.";
    }
    // Cannot remove last breed if storefront is published
    if (breeds.length <= 1 && isPublished) {
      return "Cannot remove the last breed while storefront is published. Unpublish first.";
    }
    return null;
  };

  const canRemoveBreed = (breedName: string) => {
    return getRemovalBlockReason(breedName) === null;
  };

  const addBreed = (hit: BreedHit) => {
    const exists = breeds.some(
      (b) => b.name.toLowerCase() === hit.name.toLowerCase() && (b.species || "Dog") === hit.species
    );
    if (exists) {
      setSelectedBreed(null);
      return;
    }

    const isCustom = hit.source === "custom";
    const breedId = !isCustom && typeof hit.id === "number" ? hit.id : null;
    const customBreedId = isCustom && typeof hit.id === "number" ? hit.id : null;

    onChange([
      ...breeds,
      {
        name: hit.name,
        species: hit.species,
        breedId,
        customBreedId,
        source: hit.source,
        isPublic: false, // Default to unlisted - breeder can make public when ready
      },
    ]);
    setSelectedBreed(null);
  };

  const removeBreed = (index: number) => {
    const breed = breeds[index];
    if (!breed || !canRemoveBreed(breed.name)) return;
    onChange(breeds.filter((_, i) => i !== index));
  };

  // Check if a breed is used in a PUBLIC (complete) breeding program listing
  // A program is considered public if it has both name and breed filled in
  const isBreedInPublicProgram = (breedName: string): boolean => {
    return listedPrograms.some(
      (p) => p.name?.trim() && p.breedText?.trim() &&
             p.breedText.toLowerCase() === breedName.toLowerCase()
    );
  };

  const toggleBreedVisibility = (index: number) => {
    const breed = breeds[index];
    if (!breed) return;

    const currentlyPublic = breed.isPublic ?? true;

    // If trying to make unlisted, check if it's used in a public program
    if (currentlyPublic && isBreedInPublicProgram(breed.name)) {
      alert(`"${breed.name}" cannot be unlisted because it's used in a public Breeding Program.`);
      return;
    }

    const updated = breeds.map((b, i) =>
      i === index ? { ...b, isPublic: !currentlyPublic } : b
    );
    onChange(updated);
  };

  // Group breeds by species for display, preserving global index
  const breedsBySpecies = SPECIES_OPTIONS.map((sp) => ({
    species: sp,
    breeds: breeds.map((b, idx) => ({ ...b, globalIdx: idx })).filter((b) => (b.species || "Dog") === sp),
  })).filter((g) => g.breeds.length > 0);

  return (
    <div className="space-y-4">
      {/* Add Breed UI */}
      <div className="bg-portal-surface border border-border-subtle rounded-lg p-4">
        <h4 className="font-medium text-white mb-3">Add Breed</h4>
        <div className="grid grid-cols-[140px_1fr_auto] gap-3 items-end">
          <div>
            <label className="block text-xs text-text-tertiary mb-1">Species</label>
            <select
              value={selectedSpecies}
              onChange={(e) => {
                setSelectedSpecies(e.target.value as BreedsSpeciesUI);
                setSelectedBreed(null);
              }}
              className="w-full px-3 py-2 text-sm bg-portal-card border border-border-subtle rounded-lg focus:border-accent focus:outline-none"
            >
              {SPECIES_OPTIONS.map((sp) => (
                <option key={sp} value={sp}>{sp}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-tertiary mb-1">Breed</label>
            <BreedCombo
              species={selectedSpecies}
              value={selectedBreed}
              onChange={(hit) => {
                if (hit) addBreed(hit);
              }}
            />
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCustomBreedOpen(true)}
          >
            New Custom
          </Button>
        </div>
      </div>

      {/* Selected Breeds List */}
      <div className="bg-portal-surface border border-border-subtle rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-portal-card/50">
          <h4 className="font-medium text-white">Your Breeds</h4>
          <span className="text-sm text-text-tertiary">{breeds.length} breed{breeds.length !== 1 ? "s" : ""}</span>
        </div>

        {breeds.length === 0 ? (
          <div className="text-center py-8 text-text-tertiary">
            <Dog size={32} className="mx-auto mb-2 opacity-50" />
            <p>No breeds selected yet.</p>
            <p className="text-xs mt-1">Use the search above to add breeds.</p>
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {breedsBySpecies.map(({ species, breeds: speciesBreeds }) => (
              <div key={species}>
                {/* Species Header */}
                <div className="px-4 py-2 bg-portal-card/30">
                  <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide">{species}s</span>
                </div>

                {/* Breed Rows */}
                {speciesBreeds.map((breed) => {
                  const linked = isBreedLinked(breed.name);
                  const canRemove = canRemoveBreed(breed.name);
                  const isPublic = breed.isPublic ?? true;

                  return (
                    <div
                      key={`${breed.name}-${breed.globalIdx}`}
                      className={`
                        flex items-center gap-4 px-4 py-3 transition-colors
                        ${linked ? "bg-accent/5" : "hover:bg-portal-card/30"}
                      `}
                    >
                      {/* Breed Icon */}
                      <div className={`
                        w-10 h-10 rounded-lg flex items-center justify-center text-base font-bold flex-shrink-0
                        ${linked
                          ? "bg-accent/20 text-accent border border-accent/30"
                          : "bg-portal-card text-text-secondary border border-border-subtle"
                        }
                      `}>
                        {breed.name.charAt(0).toUpperCase()}
                      </div>

                      {/* Breed Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{breed.name}</span>
                          {breed.source === "custom" && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded font-medium">
                              Custom
                            </span>
                          )}
                        </div>
                        {linked && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Link2 size={11} className="text-accent" />
                            <span className="text-xs text-accent">Linked to breeding program</span>
                          </div>
                        )}
                      </div>

                      {/* Visibility Toggle */}
                      <div className="flex-shrink-0">
                        <VisibilityToggle
                          isPublic={isPublic}
                          onChange={() => toggleBreedVisibility(breed.globalIdx)}
                        />
                      </div>

                      {/* Remove Button */}
                      <div className="flex-shrink-0">
                        {canRemove ? (
                          <button
                            type="button"
                            onClick={() => removeBreed(breed.globalIdx)}
                            className="p-2 rounded-lg text-text-tertiary hover:text-red-400 hover:bg-red-500/10 transition-all"
                            title="Remove breed"
                          >
                            <Trash2 size={16} />
                          </button>
                        ) : (
                          <div
                            className="p-2 rounded-lg text-text-tertiary/40 cursor-not-allowed"
                            title={getRemovalBlockReason(breed.name) || "Cannot remove"}
                          >
                            <Lock size={16} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Custom Breed Dialog */}
      {getOverlayRoot() && createPortal(
        <CustomBreedDialog
          open={customBreedOpen}
          onClose={() => setCustomBreedOpen(false)}
          api={{
            breeds: {
              customCreate: async (payload) => {
                const csrf = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/)?.[1];
                const res = await fetch("/api/v1/breeds/custom", {
                  method: "POST",
                  credentials: "include",
                  headers: {
                    "Content-Type": "application/json",
                    "X-Tenant-Id": tenantId,
                    ...(csrf ? { "X-CSRF-Token": decodeURIComponent(csrf) } : {}),
                  },
                  body: JSON.stringify(payload),
                });
                if (!res.ok) {
                  const err = await res.json().catch(() => ({}));
                  throw new Error(err.message || "Create failed");
                }
                return res.json();
              },
            },
          }}
          species={toApiSpecies(selectedSpecies) as any}
          onCreated={(created) => {
            addBreed({
              id: created.id,
              name: created.name,
              species: selectedSpecies,
              source: "custom",
            });
            setCustomBreedOpen(false);
          }}
        />,
        getOverlayRoot()!
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STANDARDS & CREDENTIALS SECTION
// ═══════════════════════════════════════════════════════════════════════════

function CredentialsSection({
  form,
  updateForm,
}: {
  form: MarketplaceProfileDraft;
  updateForm: (updates: Partial<MarketplaceProfileDraft>) => void;
}) {
  const [registries, setRegistries] = React.useState<Array<{ id: number; name: string; code: string; species: string | null; country: string | null }>>([]);
  const [registriesLoading, setRegistriesLoading] = React.useState(true);
  const [registrySearchTerm, setRegistrySearchTerm] = React.useState("");
  const [selectedSpecies, setSelectedSpecies] = React.useState<string>("ALL");

  const creds = form.standardsAndCredentials || {};

  // Fetch registries on mount
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setRegistriesLoading(true);
        const res = await fetch("/api/v1/registries", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to load registries");
        const json = await res.json();
        const items = json?.items || [];
        if (alive) {
          setRegistries(items);
        }
      } catch (e: any) {
        console.error("Failed to load registries:", e);
        if (alive) setRegistries([]);
      } finally {
        if (alive) setRegistriesLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const updateCreds = (key: string, value: any) => {
    updateForm({
      standardsAndCredentials: { ...creds, [key]: value },
    });
  };

  const toggleItem = (
    section: "registrations" | "healthPractices" | "breedingPractices" | "carePractices",
    item: string
  ) => {
    const list = creds[section] || [];
    const newList = list.includes(item) ? list.filter((i: string) => i !== item) : [...list, item];
    updateCreds(section, newList);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Standards and Credentials</h2>
        <p className="text-sm text-text-tertiary mt-1">
          Configure your breeding program's standards, credentials, and practices.
        </p>
      </div>

      {/* Registrations and Affiliations */}
      <div className="bg-portal-card border border-border-subtle rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-accent" />
            <h3 className="text-base font-semibold text-white">Registry Memberships & Breeder Credentials</h3>
          </div>
          <VisibilityToggle
            isPublic={creds.showRegistrations ?? false}
            onChange={(v) => updateCreds("showRegistrations", v)}
            disabled={(creds.registrations || []).length === 0}
          />
        </div>

        {registriesLoading ? (
          <div className="text-sm text-text-tertiary text-center py-4">Loading registries...</div>
        ) : (
          <>
            {/* Species filter tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
              {["ALL", "HORSE", "DOG", "CAT", "GOAT", "SHEEP", "RABBIT"].map((species) => (
                <button
                  key={species}
                  type="button"
                  onClick={() => setSelectedSpecies(species)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    selectedSpecies === species
                      ? "bg-accent text-white"
                      : "bg-portal-surface text-text-secondary hover:bg-portal-surface/80 hover:text-white border border-border-subtle"
                  }`}
                >
                  {species === "ALL" ? "All Species" : species.charAt(0) + species.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {/* Search bar */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search registries (e.g., AQHA, Jockey Club, USEF)..."
                value={registrySearchTerm}
                onChange={(e) => setRegistrySearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-portal-surface border border-border-subtle rounded-lg focus:border-accent focus:outline-none"
              />
            </div>

            {/* Registry checkboxes */}
            <div className="grid grid-cols-2 gap-3 mb-4 max-h-96 overflow-y-auto">
              {registries
                .filter((reg) => {
                  // Species filter
                  if (selectedSpecies !== "ALL" && reg.species !== selectedSpecies) {
                    // Include global registries (species: null) in all species tabs
                    if (reg.species !== null) return false;
                  }
                  // Search filter
                  if (!registrySearchTerm) return true;
                  const search = registrySearchTerm.toLowerCase();
                  return (
                    reg.name.toLowerCase().includes(search) ||
                    reg.code.toLowerCase().includes(search) ||
                    (reg.country && reg.country.toLowerCase().includes(search))
                  );
                })
                .map((reg) => (
                  <label key={reg.code} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(creds.registrations || []).includes(reg.name)}
                      onChange={() => toggleItem("registrations", reg.name)}
                      className="w-4 h-4 rounded border-border-subtle bg-portal-surface accent-accent"
                    />
                    <span className="text-sm text-text-secondary" title={`${reg.name}${reg.country ? ` (${reg.country})` : ''}`}>
                      {reg.name}
                      {reg.country && reg.country !== 'US' && (
                        <span className="text-xs text-text-tertiary ml-1">({reg.country})</span>
                      )}
                    </span>
                  </label>
                ))}
            </div>

            {registries.filter((reg) => {
              // Species filter
              if (selectedSpecies !== "ALL" && reg.species !== selectedSpecies) {
                if (reg.species !== null) return false;
              }
              // Search filter
              if (!registrySearchTerm) return true;
              const search = registrySearchTerm.toLowerCase();
              return (
                reg.name.toLowerCase().includes(search) ||
                reg.code.toLowerCase().includes(search) ||
                (reg.country && reg.country.toLowerCase().includes(search))
              );
            }).length === 0 && (
              <div className="text-sm text-text-tertiary text-center py-4">
                No registries found{registrySearchTerm ? ` matching "${registrySearchTerm}"` : ` for ${selectedSpecies.toLowerCase()}`}
              </div>
            )}
          </>
        )}

        <div>
          <label className="block text-xs text-text-tertiary mb-1">Notes</label>
          <textarea
            value={creds.registrationsNote || ""}
            onChange={(e) => updateCreds("registrationsNote", e.target.value.slice(0, 200))}
            placeholder="Optional notes (e.g., 'AQHA Certified Breeder since 2015')..."
            rows={2}
            className="w-full px-3 py-2 text-sm bg-portal-surface border border-border-subtle rounded-lg resize-none focus:border-accent focus:outline-none"
          />
          <div className="text-xs text-text-tertiary text-right mt-1">{(creds.registrationsNote || "").length}/200</div>
        </div>
      </div>

      {/* Health and Genetic Practices */}
      <div className="bg-portal-card border border-border-subtle rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-400" />
            <h3 className="text-base font-semibold text-white">Health and Genetic Practices</h3>
          </div>
          <VisibilityToggle
            isPublic={creds.showHealthPractices ?? false}
            onChange={(v) => updateCreds("showHealthPractices", v)}
            disabled={(creds.healthPractices || []).length === 0}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {HEALTH_PRACTICE_OPTIONS.map((item) => (
            <label key={item} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={(creds.healthPractices || []).includes(item)}
                onChange={() => toggleItem("healthPractices", item)}
                className="w-4 h-4 rounded border-border-subtle bg-portal-surface accent-accent"
              />
              <span className="text-sm text-text-secondary">{item}</span>
            </label>
          ))}
        </div>
        <div>
          <label className="block text-xs text-text-tertiary mb-1">Notes</label>
          <textarea
            value={creds.healthNote || ""}
            onChange={(e) => updateCreds("healthNote", e.target.value.slice(0, 200))}
            placeholder="Optional notes..."
            rows={2}
            className="w-full px-3 py-2 text-sm bg-portal-surface border border-border-subtle rounded-lg resize-none focus:border-accent focus:outline-none"
          />
          <div className="text-xs text-text-tertiary text-right mt-1">{(creds.healthNote || "").length}/200</div>
        </div>
      </div>

      {/* Breeding Practices */}
      <div className="bg-portal-card border border-border-subtle rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <PawPrint className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-semibold text-white">Breeding Practices</h3>
          </div>
          <VisibilityToggle
            isPublic={creds.showBreedingPractices ?? false}
            onChange={(v) => updateCreds("showBreedingPractices", v)}
            disabled={(creds.breedingPractices || []).length === 0}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {BREEDING_PRACTICE_OPTIONS.map((item) => (
            <label key={item} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={(creds.breedingPractices || []).includes(item)}
                onChange={() => toggleItem("breedingPractices", item)}
                className="w-4 h-4 rounded border-border-subtle bg-portal-surface accent-accent"
              />
              <span className="text-sm text-text-secondary">{item}</span>
            </label>
          ))}
        </div>
        <div>
          <label className="block text-xs text-text-tertiary mb-1">Notes</label>
          <textarea
            value={creds.breedingNote || ""}
            onChange={(e) => updateCreds("breedingNote", e.target.value.slice(0, 200))}
            placeholder="Optional notes..."
            rows={2}
            className="w-full px-3 py-2 text-sm bg-portal-surface border border-border-subtle rounded-lg resize-none focus:border-accent focus:outline-none"
          />
          <div className="text-xs text-text-tertiary text-right mt-1">{(creds.breedingNote || "").length}/200</div>
        </div>
      </div>

      {/* Care and Early Life */}
      <div className="bg-portal-card border border-border-subtle rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-semibold text-white">Care and Early Life</h3>
          </div>
          <VisibilityToggle
            isPublic={creds.showCarePractices ?? false}
            onChange={(v) => updateCreds("showCarePractices", v)}
            disabled={(creds.carePractices || []).length === 0}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {CARE_PRACTICE_OPTIONS.map((item) => (
            <label key={item} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={(creds.carePractices || []).includes(item)}
                onChange={() => toggleItem("carePractices", item)}
                className="w-4 h-4 rounded border-border-subtle bg-portal-surface accent-accent"
              />
              <span className="text-sm text-text-secondary">{item}</span>
            </label>
          ))}
        </div>
        <div>
          <label className="block text-xs text-text-tertiary mb-1">Notes</label>
          <textarea
            value={creds.careNote || ""}
            onChange={(e) => updateCreds("careNote", e.target.value.slice(0, 200))}
            placeholder="Optional notes..."
            rows={2}
            className="w-full px-3 py-2 text-sm bg-portal-surface border border-border-subtle rounded-lg resize-none focus:border-accent focus:outline-none"
          />
          <div className="text-xs text-text-tertiary text-right mt-1">{(creds.careNote || "").length}/200</div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PLACEMENT POLICIES SECTION
// ═══════════════════════════════════════════════════════════════════════════

function PoliciesSection({
  form,
  updateForm,
}: {
  form: MarketplaceProfileDraft;
  updateForm: (updates: Partial<MarketplaceProfileDraft>) => void;
}) {
  const policies = form.placementPolicies || {};

  const updatePolicies = (key: string, value: any) => {
    updateForm({
      placementPolicies: { ...policies, [key]: value },
    });
  };

  // Check if any policy is selected
  const hasAnyPolicy =
    policies.requireApplication ||
    policies.requireInterview ||
    policies.requireContract ||
    policies.requireDeposit ||
    policies.requireHomeVisit ||
    policies.requireVetReference ||
    policies.requireSpayNeuter ||
    policies.hasReturnPolicy ||
    policies.lifetimeTakeBack ||
    policies.offersSupport;

  // Grouped policy options
  const buyerRequirements = [
    { key: "requireApplication", label: "Require application" },
    { key: "requireInterview", label: "Require interview/meeting" },
    { key: "requireContract", label: "Require signed contract" },
    { key: "requireHomeVisit", label: "Require home visit" },
    { key: "requireVetReference", label: "Require vet reference" },
  ];

  const petPlacement = [
    { key: "requireSpayNeuter", label: "Require spay/neuter for pets" },
  ];

  const breederCommitments = [
    { key: "hasReturnPolicy", label: "Accept returns" },
    { key: "lifetimeTakeBack", label: "Lifetime take-back guarantee" },
    { key: "offersSupport", label: "Ongoing breeder support" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Placement Policies</h2>
        <p className="text-sm text-text-tertiary mt-1">
          Configure your placement requirements and policies for buyers.
        </p>
      </div>

      <div className="bg-portal-card border border-border-subtle rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-accent" />
            <h3 className="text-base font-semibold text-white">Placement Policies</h3>
          </div>
          <VisibilityToggle
            isPublic={policies.showPolicies ?? false}
            onChange={(v) => updatePolicies("showPolicies", v)}
            disabled={!hasAnyPolicy}
          />
        </div>

        {/* Buyer Requirements */}
        <div className="mb-6 p-4 rounded-lg bg-portal-surface/50 border border-border-subtle/50">
          <div className="text-sm font-semibold text-white mb-3">Buyer Requirements</div>
          <div className="grid grid-cols-2 gap-3">
            {buyerRequirements.map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(policies as any)[key] ?? false}
                  onChange={(e) => updatePolicies(key, e.target.checked)}
                  className="w-4 h-4 rounded border-border-subtle bg-portal-surface accent-accent"
                />
                <span className="text-sm text-text-secondary">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Payment & Deposit */}
        <div className="mb-6 p-4 rounded-lg bg-portal-surface/50 border border-border-subtle/50">
          <div className="text-sm font-semibold text-white mb-3">Payment & Deposit</div>
          <p className="text-xs text-text-tertiary mb-3">Select your preferred terminology to display on the marketplace</p>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={policies.requireDeposit ?? false}
                onChange={(e) => {
                  // Update both values in single call to avoid stale closure issue
                  updateForm({
                    placementPolicies: {
                      ...policies,
                      requireDeposit: e.target.checked,
                      requireReservationFee: e.target.checked ? false : policies.requireReservationFee,
                    },
                  });
                }}
                className="w-4 h-4 rounded border-border-subtle bg-portal-surface accent-accent"
              />
              <span className="text-sm text-text-secondary">Require deposit</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={policies.requireReservationFee ?? false}
                onChange={(e) => {
                  // Update both values in single call to avoid stale closure issue
                  updateForm({
                    placementPolicies: {
                      ...policies,
                      requireReservationFee: e.target.checked,
                      requireDeposit: e.target.checked ? false : policies.requireDeposit,
                    },
                  });
                }}
                className="w-4 h-4 rounded border-border-subtle bg-portal-surface accent-accent"
              />
              <span className="text-sm text-text-secondary">Require reservation fee</span>
            </label>
            {(policies.requireDeposit || policies.requireReservationFee) && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={policies.depositRefundable ?? false}
                  onChange={(e) => updatePolicies("depositRefundable", e.target.checked)}
                  className="w-4 h-4 rounded border-border-subtle bg-portal-surface accent-accent"
                />
                <span className="text-sm text-text-secondary">Is refundable</span>
              </label>
            )}
          </div>
        </div>

        {/* Pet Placement */}
        <div className="mb-6 p-4 rounded-lg bg-portal-surface/50 border border-border-subtle/50">
          <div className="text-sm font-semibold text-white mb-3">Pet Placement</div>
          <div className="grid grid-cols-2 gap-3">
            {petPlacement.map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(policies as any)[key] ?? false}
                  onChange={(e) => updatePolicies(key, e.target.checked)}
                  className="w-4 h-4 rounded border-border-subtle bg-portal-surface accent-accent"
                />
                <span className="text-sm text-text-secondary">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Breeder Commitments */}
        <div className="mb-6 p-4 rounded-lg bg-portal-surface/50 border border-border-subtle/50">
          <div className="text-sm font-semibold text-white mb-3">Breeder Commitments</div>
          <div className="grid grid-cols-2 gap-3">
            {breederCommitments.map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(policies as any)[key] ?? false}
                  onChange={(e) => updatePolicies(key, e.target.checked)}
                  className="w-4 h-4 rounded border-border-subtle bg-portal-surface accent-accent"
                />
                <span className="text-sm text-text-secondary">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-text-tertiary mb-1">Additional Notes</label>
          <textarea
            value={policies.note || ""}
            onChange={(e) => updatePolicies("note", e.target.value.slice(0, 300))}
            placeholder="Optional notes about your placement policies..."
            rows={3}
            className="w-full px-3 py-2 text-sm bg-portal-surface border border-border-subtle rounded-lg resize-none focus:border-accent focus:outline-none"
          />
          <div className="text-xs text-text-tertiary text-right mt-1">{(policies.note || "").length}/300</div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BREEDING PROGRAMS SECTION
// ═══════════════════════════════════════════════════════════════════════════

const PROGRAM_SPECIES_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "DOG", label: "Dog" },
  { value: "CAT", label: "Cat" },
  { value: "HORSE", label: "Horse" },
  { value: "GOAT", label: "Goat" },
  { value: "SHEEP", label: "Sheep" },
  { value: "RABBIT", label: "Rabbit" },
];

type ProgramPricingMode = "single" | "range" | "contact";

type ListedProgramItem = NonNullable<MarketplaceProfileDraft["listedPrograms"]>[number];

function createEmptyProgram(): ListedProgramItem {
  return {
    name: "",
    species: "DOG",
    breedText: "",
    breedId: null,
    description: "",
    programStory: "",
    acceptInquiries: true,
    openWaitlist: false,
    acceptReservations: false,
    comingSoon: false,
    pricingTiers: null,
    whatsIncluded: "",
    showWhatsIncluded: true,
    typicalWaitTime: "",
    showWaitTime: true,
    coverImageUrl: null,
    showCoverImage: true,
  };
}

/** Program card for list view */
function ProgramListCard({
  program,
  index,
  stats,
  loadingStats,
  onEdit,
  onRemove,
}: {
  program: ListedProgramItem;
  index: number;
  stats: ProgramSummaryStats;
  loadingStats: boolean;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const hasStats = stats.totalPlans > 0 || stats.availableCount > 0 || stats.upcomingLitters > 0;
  const isMissingRequired = !program.name?.trim() || !program.breedText?.trim();

  return (
    <div className={`bg-portal-card border rounded-xl p-6 hover:border-border-default transition-colors cursor-pointer ${isMissingRequired ? "border-red-500/50" : "border-border-subtle"}`} onClick={onEdit}>
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h4 className="text-lg font-semibold text-white">
              {program.name || `Program ${index + 1}`}
            </h4>
            {isMissingRequired && (
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-red-500/20 text-red-400 rounded-full font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                Missing Required Fields
              </span>
            )}
            {program.comingSoon && (
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-amber-500/20 text-amber-400 rounded-full font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                Coming Soon
              </span>
            )}
          </div>
          <div className="text-base text-text-secondary">
            {program.species ? PROGRAM_SPECIES_OPTIONS.find(s => s.value === program.species)?.label || program.species : "No species"}
            {program.breedText ? ` — ${program.breedText}` : <span className="text-red-400"> — No breed selected</span>}
          </div>
          {program.description && (
            <p className="text-sm text-text-tertiary mt-2 line-clamp-2">{program.description}</p>
          )}

          {/* Summary Stats Row */}
          {!loadingStats && hasStats && (
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border-subtle">
              {stats.activePlans > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span className="text-text-secondary">
                    <span className="text-white font-medium">{stats.activePlans}</span> active plan{stats.activePlans !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
              {stats.upcomingLitters > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Baby className="w-4 h-4 text-purple-400" />
                  <span className="text-text-secondary">
                    <span className="text-white font-medium">{stats.upcomingLitters}</span> upcoming litter{stats.upcomingLitters !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
              {stats.nextExpectedBirth && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-text-secondary">
                    Due <span className="text-white font-medium">{formatDate(stats.nextExpectedBirth)}</span>
                  </span>
                </div>
              )}
              {stats.availableCount > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-green-400" />
                  <span className="text-text-secondary">
                    <span className="text-green-400 font-medium">{stats.availableCount}</span> available now
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Feature Badges */}
          <div className="flex flex-wrap gap-2 mt-4 text-sm text-text-tertiary">
            {program.acceptInquiries && <span className="px-3 py-1 bg-portal-surface rounded-lg">Inquiries</span>}
            {program.openWaitlist && <span className="px-3 py-1 bg-portal-surface rounded-lg">Waitlist</span>}
            {program.acceptReservations && <span className="px-3 py-1 bg-portal-surface rounded-lg">Reservations</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-2.5 text-text-secondary hover:text-white transition-colors rounded-lg hover:bg-white/5"
            title="Edit program"
          >
            <Pencil size={18} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="p-2.5 text-text-secondary hover:text-red-400 transition-colors rounded-lg hover:bg-white/5"
            title="Remove program"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Inline expandable program editor */
function ProgramEditor({
  program,
  index,
  onChange,
  onCollapse,
  onRemove,
  breederBreeds,
}: {
  program: ListedProgramItem;
  index: number;
  onChange: (updates: Partial<ListedProgramItem>) => void;
  onCollapse: () => void;
  onRemove: () => void;
  breederBreeds: SelectedBreed[];
}) {
  const isMissingRequired = !program.name?.trim() || !program.breedText?.trim();

  // Filter breeds by selected species
  const currentSpecies = (program.species || "DOG").toUpperCase();
  const availableBreeds = breederBreeds.filter(
    (b) => b.species.toUpperCase() === currentSpecies
  );

  // Handle breed selection from dropdown
  const handleBreedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const breedName = e.target.value;
    if (!breedName) {
      onChange({ breedText: "", breedId: null });
      return;
    }
    const selectedBreed = availableBreeds.find((b) => b.name === breedName);
    if (selectedBreed) {
      onChange({
        breedText: selectedBreed.name,
        breedId: selectedBreed.breedId ?? null,
      });
    }
  };

  return (
    <div className={`bg-portal-card border rounded-xl overflow-hidden ${isMissingRequired ? "border-amber-500/50" : "border-accent/50"}`}>
      {/* Header - clickable to collapse */}
      <div
        className="flex items-center justify-between px-6 py-4 bg-portal-surface/50 cursor-pointer hover:bg-portal-surface/70 transition-colors"
        onClick={onCollapse}
      >
        <div className="flex items-center gap-3">
          <ChevronUp className="w-5 h-5 text-text-secondary" />
          <div>
            <h4 className="text-lg font-semibold text-white">
              {program.name || `Program ${index + 1}`}
            </h4>
            <p className="text-sm text-text-secondary">
              {program.species ? PROGRAM_SPECIES_OPTIONS.find(s => s.value === program.species)?.label || program.species : "Dog"}
              {program.breedText ? ` — ${program.breedText}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={onRemove}
            className="p-2.5 text-text-secondary hover:text-red-400 transition-colors rounded-lg hover:bg-white/5"
            title="Remove program"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="p-6 space-y-6 border-t border-border-subtle">
        {/* Program Identity */}
        <div className="space-y-4">
          <h5 className="text-sm font-semibold text-white border-b border-border-subtle pb-2">
            Program Identity
          </h5>

          {/* Program Name */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Program Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={program.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="e.g., Golden Retriever Breeding Program"
              maxLength={100}
              className={`w-full px-3 py-2.5 text-sm bg-portal-surface border rounded-lg focus:border-accent focus:outline-none ${
                !program.name?.trim() ? "border-amber-500/70" : "border-border-subtle"
              }`}
            />
            {!program.name?.trim() && (
              <p className="text-xs text-amber-400 mt-1">Program name is required</p>
            )}
          </div>

          {/* Species & Breed */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Species <span className="text-red-400">*</span>
              </label>
              <select
                value={program.species || "DOG"}
                onChange={(e) => onChange({ species: e.target.value, breedText: "", breedId: null })}
                className="w-full px-3 py-2.5 text-sm bg-portal-surface border border-border-subtle rounded-lg focus:border-accent focus:outline-none"
              >
                {PROGRAM_SPECIES_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Breed <span className="text-red-400">*</span>
              </label>
              {availableBreeds.length > 0 ? (
                <select
                  value={program.breedText || ""}
                  onChange={handleBreedChange}
                  className={`w-full px-3 py-2.5 text-sm bg-portal-surface border rounded-lg focus:border-accent focus:outline-none ${
                    !program.breedText?.trim() ? "border-amber-500/70" : "border-border-subtle"
                  }`}
                >
                  <option value="">Select a breed...</option>
                  {availableBreeds.map((breed) => (
                    <option key={breed.id} value={breed.name}>{breed.name}</option>
                  ))}
                </select>
              ) : (
                <div className="px-3 py-2.5 text-sm bg-portal-surface border border-amber-500/50 rounded-lg text-amber-400">
                  No {PROGRAM_SPECIES_OPTIONS.find(s => s.value === program.species)?.label || "Dog"} breeds in your list.
                  <br />
                  <span className="text-xs text-text-tertiary">Add breeds in the "Your Breeds" tab first.</span>
                </div>
              )}
              {!program.breedText?.trim() && availableBreeds.length > 0 && (
                <p className="text-xs text-amber-400 mt-1">Breed is required</p>
              )}
            </div>
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Short Description
            </label>
            <textarea
              value={program.description || ""}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="Brief description shown in cards and search results"
              rows={2}
              maxLength={500}
              className="w-full px-3 py-2.5 text-sm bg-portal-surface border border-border-subtle rounded-lg resize-none focus:border-accent focus:outline-none"
            />
            <div className="text-xs text-text-tertiary text-right mt-1">
              {(program.description || "").length}/500
            </div>
          </div>

          {/* Program Story */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1 flex items-center gap-1">
              <FileText className="w-4 h-4" />
              Program Story
            </label>
            <p className="text-xs text-text-tertiary mb-2">
              Tell buyers about your breeding philosophy and what makes this program special
            </p>
            <textarea
              value={program.programStory || ""}
              onChange={(e) => onChange({ programStory: e.target.value })}
              placeholder="Share your story... How did you start? What are your goals?"
              rows={4}
              maxLength={5000}
              className="w-full px-3 py-2.5 text-sm bg-portal-surface border border-border-subtle rounded-lg resize-none focus:border-accent focus:outline-none"
            />
            <div className="text-xs text-text-tertiary text-right mt-1">
              {(program.programStory || "").length}/5000
            </div>
          </div>
        </div>

        {/* Cover Image */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-2">
            <h5 className="text-sm font-semibold text-white">Cover Image</h5>
            <VisibilityToggle
              isPublic={program.showCoverImage ?? true}
              onChange={(v) => onChange({ showCoverImage: v })}
            />
          </div>

          <div className="bg-portal-surface/50 border border-border-subtle rounded-lg p-3">
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <div className="text-text-tertiary uppercase tracking-wide mb-0.5">Recommended</div>
                <div className="text-white font-medium">1200 x 630px</div>
              </div>
              <div>
                <div className="text-text-tertiary uppercase tracking-wide mb-0.5">Aspect Ratio</div>
                <div className="text-white font-medium">1.9:1 (landscape)</div>
              </div>
              <div>
                <div className="text-text-tertiary uppercase tracking-wide mb-0.5">Max Size</div>
                <div className="text-white font-medium">5MB</div>
              </div>
            </div>
            <p className="text-[11px] text-text-tertiary mt-2">
              JPG, PNG, or WebP. Landscape images work best. Image will be cropped to fit card dimensions.
            </p>
          </div>

          {program.coverImageUrl ? (
            <div className="relative">
              <img
                src={program.coverImageUrl}
                alt="Cover"
                className="w-full h-40 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => onChange({ coverImageUrl: null })}
                className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-border-subtle rounded-lg p-6 text-center">
              <Upload className="w-6 h-6 mx-auto text-text-tertiary mb-2" />
              <p className="text-xs text-text-tertiary mb-2">Enter image URL:</p>
              <input
                type="url"
                placeholder="https://example.com/image.jpg"
                onChange={(e) => onChange({ coverImageUrl: e.target.value || null })}
                className="w-full max-w-sm mx-auto px-3 py-2 text-sm bg-portal-surface border border-border-subtle rounded-lg focus:border-accent focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Program Settings */}
        <div className="space-y-4">
          <h5 className="text-sm font-semibold text-white border-b border-border-subtle pb-2">
            Program Settings
          </h5>

          <label className="flex items-center gap-3 cursor-pointer p-3 bg-portal-surface rounded-lg">
            <input
              type="checkbox"
              checked={program.comingSoon ?? false}
              onChange={(e) => onChange({ comingSoon: e.target.checked })}
              className="w-4 h-4 rounded border-border-subtle bg-portal-card"
            />
            <div className="flex-1">
              <div className="text-sm text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Coming Soon
              </div>
              <div className="text-xs text-text-secondary mt-0.5">Show a badge for programs without current availability</div>
            </div>
          </label>

          <div className="border-t border-border-subtle pt-4">
            <div className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-3">
              Buyer Interaction Options
            </div>

            <div className="grid grid-cols-3 gap-3">
              <label className="flex items-start gap-2 cursor-pointer p-3 bg-portal-surface rounded-lg">
                <input
                  type="checkbox"
                  checked={program.acceptInquiries ?? true}
                  onChange={(e) => onChange({ acceptInquiries: e.target.checked })}
                  className="w-4 h-4 mt-0.5 rounded border-border-subtle bg-portal-card"
                />
                <div>
                  <div className="text-sm text-white">Accept Inquiries</div>
                  <div className="text-xs text-text-secondary mt-0.5">Show "Contact Breeder" button</div>
                </div>
              </label>

              <label className="flex items-start gap-2 cursor-pointer p-3 bg-portal-surface rounded-lg">
                <input
                  type="checkbox"
                  checked={program.openWaitlist ?? false}
                  onChange={(e) => onChange({ openWaitlist: e.target.checked })}
                  className="w-4 h-4 mt-0.5 rounded border-border-subtle bg-portal-card"
                />
                <div>
                  <div className="text-sm text-white">Open Waitlist</div>
                  <div className="text-xs text-text-secondary mt-0.5">Show "Join Waitlist" button</div>
                </div>
              </label>

              <label className="flex items-start gap-2 cursor-pointer p-3 bg-portal-surface rounded-lg">
                <input
                  type="checkbox"
                  checked={program.acceptReservations ?? false}
                  onChange={(e) => onChange({ acceptReservations: e.target.checked })}
                  className="w-4 h-4 mt-0.5 rounded border-border-subtle bg-portal-card"
                />
                <div>
                  <div className="text-sm text-white">Accept Reservations</div>
                  <div className="text-xs text-text-secondary mt-0.5">Paid deposits (Stripe)</div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


export default MarketplaceManagePortal;
