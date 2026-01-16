// apps/marketplace/src/management/pages/ProgramsSettingsPage.tsx
// Breeder-side management of Breeding Programs for marketplace visibility
// V2: Enhanced with breed selection, pricing tiers, media, and visibility controls

import * as React from "react";
import { Button, SectionCard, Badge, BreedCombo } from "@bhq/ui";
import type { BreedHit } from "@bhq/ui";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  X,
  Image as ImageIcon,
  Upload,
  DollarSign,
  Clock,
  FileText,
  Sparkles,
} from "lucide-react";
import {
  getBreederPrograms,
  getBreederProgram,
  createBreederProgram,
  updateBreederProgram,
  deleteBreederProgram,
  type BreedingProgramListItem,
  type BreedingProgramDetail,
  type BreedingProgramCreateInput,
  type ProgramPricingTier,
} from "../../api/client";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type ProgramsSettingsPageProps = {
  /** When true, hides internal header (drawer provides its own) */
  isDrawer?: boolean;
};

// Pricing mode for each tier
type PricingMode = "single" | "range" | "contact";

// Enhanced pricing structure per spec
type ProgramPricing = {
  petPriceMode: PricingMode;
  petPriceSingle: string;
  petPriceMin: string;
  petPriceMax: string;
  showPetPricing: boolean;

  breedingRightsPriceMode: PricingMode;
  breedingRightsPriceSingle: string;
  breedingRightsPriceMin: string;
  breedingRightsPriceMax: string;
  showBreedingRightsPricing: boolean;

  showQualityPriceMode: PricingMode;
  showQualityPriceSingle: string;
  showQualityPriceMin: string;
  showQualityPriceMax: string;
  showShowQualityPricing: boolean;
};

type EditingProgram = {
  id: number | null; // null = creating new
  name: string;
  species: string;
  breedText: string;
  breedId: number | null; // From BreedCombo selection
  description: string;
  programStory: string; // NEW: Long-form program story
  listed: boolean;
  acceptInquiries: boolean;
  openWaitlist: boolean;
  acceptReservations: boolean;
  comingSoon: boolean; // NEW: Coming soon badge
  // Legacy pricing (for backward compat)
  pricingTiers: ProgramPricingTier[];
  // NEW: Structured pricing per spec
  pricing: ProgramPricing;
  whatsIncluded: string;
  showWhatsIncluded: boolean; // NEW: Visibility toggle
  typicalWaitTime: string;
  showWaitTime: boolean; // NEW: Visibility toggle
  // Media
  coverImageUrl: string | null; // NEW: Cover image
  showCoverImage: boolean; // NEW: Visibility toggle
};

const SPECIES_OPTIONS = [
  { value: "DOG", label: "Dog" },
  { value: "CAT", label: "Cat" },
  { value: "HORSE", label: "Horse" },
  { value: "GOAT", label: "Goat" },
  { value: "SHEEP", label: "Sheep" },
  { value: "RABBIT", label: "Rabbit" },
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function getTenantId(): string {
  try {
    const w: any = typeof window !== "undefined" ? window : {};
    return w.__BHQ_TENANT_ID__ || localStorage.getItem("BHQ_TENANT_ID") || "";
  } catch {
    return "";
  }
}

function createEmptyPricing(): ProgramPricing {
  return {
    petPriceMode: "contact",
    petPriceSingle: "",
    petPriceMin: "",
    petPriceMax: "",
    showPetPricing: true,
    breedingRightsPriceMode: "contact",
    breedingRightsPriceSingle: "",
    breedingRightsPriceMin: "",
    breedingRightsPriceMax: "",
    showBreedingRightsPricing: false,
    showQualityPriceMode: "contact",
    showQualityPriceSingle: "",
    showQualityPriceMin: "",
    showQualityPriceMax: "",
    showShowQualityPricing: false,
  };
}

function createEmptyProgram(): EditingProgram {
  return {
    id: null,
    name: "",
    species: "DOG",
    breedText: "",
    breedId: null,
    description: "",
    programStory: "",
    listed: false,
    acceptInquiries: true,
    openWaitlist: false,
    acceptReservations: false,
    comingSoon: false,
    pricingTiers: [],
    pricing: createEmptyPricing(),
    whatsIncluded: "",
    showWhatsIncluded: true,
    typicalWaitTime: "",
    showWaitTime: true,
    coverImageUrl: null,
    showCoverImage: true,
  };
}

function programToEditing(p: BreedingProgramDetail): EditingProgram {
  // Parse pricing from pricingTiers or structured pricing if available
  const pricing = createEmptyPricing();

  // Try to extract structured pricing from pricingTiers (legacy format)
  if (p.pricingTiers && p.pricingTiers.length > 0) {
    for (const tier of p.pricingTiers) {
      const tierLower = tier.tier.toLowerCase();
      if (tierLower.includes("pet") || tierLower === "companion") {
        pricing.petPriceMode = tier.priceRange ? "single" : "contact";
        pricing.petPriceSingle = tier.priceRange || "";
        pricing.showPetPricing = true;
      } else if (tierLower.includes("breeding") || tierLower.includes("breeder")) {
        pricing.breedingRightsPriceMode = tier.priceRange ? "single" : "contact";
        pricing.breedingRightsPriceSingle = tier.priceRange || "";
        pricing.showBreedingRightsPricing = true;
      } else if (tierLower.includes("show")) {
        pricing.showQualityPriceMode = tier.priceRange ? "single" : "contact";
        pricing.showQualityPriceSingle = tier.priceRange || "";
        pricing.showShowQualityPricing = true;
      }
    }
  }

  return {
    id: p.id,
    name: p.name,
    species: p.species,
    breedText: p.breedText || "",
    breedId: (p as any).breedId || null,
    description: p.description || "",
    programStory: (p as any).programStory || "",
    listed: p.listed,
    acceptInquiries: p.acceptInquiries,
    openWaitlist: p.openWaitlist,
    acceptReservations: p.acceptReservations,
    comingSoon: (p as any).comingSoon || false,
    pricingTiers: p.pricingTiers || [],
    pricing,
    whatsIncluded: p.whatsIncluded || "",
    showWhatsIncluded: (p as any).showWhatsIncluded ?? true,
    typicalWaitTime: p.typicalWaitTime || "",
    showWaitTime: (p as any).showWaitTime ?? true,
    coverImageUrl: (p as any).coverImageUrl || null,
    showCoverImage: (p as any).showCoverImage ?? true,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function ProgramCard({
  program,
  onEdit,
  onToggleListed,
}: {
  program: BreedingProgramListItem;
  onEdit: () => void;
  onToggleListed: () => void;
}) {
  const planCount = program._count?.breedingPlans ?? 0;

  return (
    <div className="border border-border-subtle rounded-lg p-4 bg-portal-card">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-base font-medium text-white truncate">{program.name}</h3>
            {program.listed ? (
              <Badge variant="success">Listed</Badge>
            ) : (
              <Badge variant="neutral">Draft</Badge>
            )}
            {program.comingSoon && (
              <Badge variant="warning" className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Coming Soon
              </Badge>
            )}
          </div>
          <div className="text-sm text-text-secondary">
            {program.species} {program.breedText ? `- ${program.breedText}` : ""}
          </div>
          <div className="text-xs text-text-tertiary mt-1">
            {planCount} breeding plan{planCount !== 1 ? "s" : ""} linked
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleListed}
            className="p-2 rounded-md hover:bg-white/5 text-text-secondary hover:text-white transition-colors"
            title={program.listed ? "Unpublish from marketplace" : "Publish to marketplace"}
          >
            {program.listed ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="p-2 rounded-md hover:bg-white/5 text-text-secondary hover:text-white transition-colors"
            title="Edit program"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick toggles */}
      <div className="flex items-center gap-4 mt-3 text-xs text-text-tertiary">
        {program.acceptInquiries && <span>Inquiries</span>}
        {program.openWaitlist && <span>Waitlist</span>}
        {program.acceptReservations && <span>Reservations</span>}
      </div>
    </div>
  );
}

/** Visibility toggle pill button */
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
          Hidden
        </>
      )}
    </button>
  );
}

/** Single pricing tier editor (Pet, Breeding Rights, or Show Quality) */
function PricingTierRow({
  label,
  mode,
  singlePrice,
  minPrice,
  maxPrice,
  showPricing,
  onModeChange,
  onSingleChange,
  onMinChange,
  onMaxChange,
  onShowChange,
}: {
  label: string;
  mode: PricingMode;
  singlePrice: string;
  minPrice: string;
  maxPrice: string;
  showPricing: boolean;
  onModeChange: (m: PricingMode) => void;
  onSingleChange: (v: string) => void;
  onMinChange: (v: string) => void;
  onMaxChange: (v: string) => void;
  onShowChange: (v: boolean) => void;
}) {
  return (
    <div className="p-4 bg-border-default/30 rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white">{label}</span>
        <VisibilityToggle isPublic={showPricing} onChange={onShowChange} />
      </div>

      {showPricing && (
        <>
          {/* Mode selector */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={mode === "single"}
                onChange={() => onModeChange("single")}
                className="w-3.5 h-3.5 text-accent focus:ring-accent"
              />
              <span className="text-xs text-text-secondary">Fixed Price</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={mode === "range"}
                onChange={() => onModeChange("range")}
                className="w-3.5 h-3.5 text-accent focus:ring-accent"
              />
              <span className="text-xs text-text-secondary">Price Range</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={mode === "contact"}
                onChange={() => onModeChange("contact")}
                className="w-3.5 h-3.5 text-accent focus:ring-accent"
              />
              <span className="text-xs text-text-secondary">Contact for Pricing</span>
            </label>
          </div>

          {/* Price inputs */}
          {mode === "single" && (
            <div>
              <input
                type="text"
                value={singlePrice}
                onChange={(e) => onSingleChange(e.target.value)}
                placeholder="$2,500"
                className="w-full px-3 py-2 text-sm bg-border-default border border-border-subtle rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          )}

          {mode === "range" && (
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={minPrice}
                onChange={(e) => onMinChange(e.target.value)}
                placeholder="Min: $2,000"
                className="px-3 py-2 text-sm bg-border-default border border-border-subtle rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <input
                type="text"
                value={maxPrice}
                onChange={(e) => onMaxChange(e.target.value)}
                placeholder="Max: $3,000"
                className="px-3 py-2 text-sm bg-border-default border border-border-subtle rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          )}

          {mode === "contact" && (
            <p className="text-xs text-text-tertiary italic">
              Buyers will see "Contact for pricing" on the marketplace
            </p>
          )}
        </>
      )}
    </div>
  );
}

function ProgramEditor({
  program,
  onChange,
  onSave,
  onCancel,
  onDelete,
  saving,
}: {
  program: EditingProgram;
  onChange: (p: EditingProgram) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
  saving: boolean;
}) {
  const isNew = program.id === null;

  // Convert species to UI format for BreedCombo
  const speciesForCombo = program.species.charAt(0).toUpperCase() + program.species.slice(1).toLowerCase();

  // Handle breed selection from BreedCombo
  const handleBreedSelect = (hit: BreedHit | null) => {
    if (hit) {
      onChange({
        ...program,
        breedText: hit.name,
        breedId: hit.id ?? null,
      });
    }
  };

  // Helper to update pricing
  const updatePricing = (updates: Partial<ProgramPricing>) => {
    onChange({ ...program, pricing: { ...program.pricing, ...updates } });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">
          {isNew ? "Create Breeding Program" : "Edit Breeding Program"}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 text-text-secondary hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 1: Program Identity
          ═══════════════════════════════════════════════════════════════════════ */}
      <SectionCard title="Program Identity">
        <div className="space-y-4">
          {/* Program Name */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Program Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={program.name}
              onChange={(e) => onChange({ ...program, name: e.target.value })}
              placeholder="e.g., Golden Retriever Breeding Program"
              maxLength={100}
              className="w-full px-3 py-2 text-sm bg-border-default border border-border-subtle rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <div className="text-xs text-text-tertiary mt-1 text-right">
              {program.name.length}/100
            </div>
          </div>

          {/* Species & Breed */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Species <span className="text-red-400">*</span>
              </label>
              <select
                value={program.species}
                onChange={(e) => onChange({ ...program, species: e.target.value, breedText: "", breedId: null })}
                className="w-full px-3 py-2 text-sm bg-border-default border border-border-subtle rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
              >
                {SPECIES_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Breed <span className="text-red-400">*</span>
              </label>
              <BreedCombo
                species={speciesForCombo as any}
                value={program.breedText ? { id: program.breedId ?? 0, name: program.breedText, species: speciesForCombo, source: "canonical" } : null}
                onChange={handleBreedSelect}
              />
            </div>
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Short Description
            </label>
            <textarea
              value={program.description}
              onChange={(e) => onChange({ ...program, description: e.target.value })}
              placeholder="Brief description of your program (shown in cards and search results)"
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 text-sm bg-border-default border border-border-subtle rounded-md focus:outline-none focus:ring-1 focus:ring-accent resize-none"
            />
            <div className="text-xs text-text-tertiary mt-1 text-right">
              {program.description.length}/500
            </div>
          </div>

          {/* Program Story (Long-form) */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              <FileText className="w-4 h-4 inline mr-1" />
              Program Story
            </label>
            <p className="text-xs text-text-tertiary mb-2">
              Tell buyers about your breeding philosophy, experience, and what makes your program special
            </p>
            <textarea
              value={program.programStory}
              onChange={(e) => onChange({ ...program, programStory: e.target.value })}
              placeholder="Share your story... How did you start? What are your goals? What makes your animals special?"
              rows={6}
              maxLength={5000}
              className="w-full px-3 py-2 text-sm bg-border-default border border-border-subtle rounded-md focus:outline-none focus:ring-1 focus:ring-accent resize-none"
            />
            <div className="text-xs text-text-tertiary mt-1 text-right">
              {program.programStory.length}/5000
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 2: Cover Image (Basic)
          ═══════════════════════════════════════════════════════════════════════ */}
      <SectionCard title="Cover Image">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-text-tertiary">
              Primary photo shown on your program listing
            </p>
            <VisibilityToggle
              isPublic={program.showCoverImage}
              onChange={(v) => onChange({ ...program, showCoverImage: v })}
            />
          </div>

          {program.coverImageUrl ? (
            <div className="relative">
              <img
                src={program.coverImageUrl}
                alt="Cover"
                className="w-full h-48 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => onChange({ ...program, coverImageUrl: null })}
                className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-border-subtle rounded-lg p-8 text-center">
              <Upload className="w-8 h-8 mx-auto text-text-tertiary mb-2" />
              <p className="text-sm text-text-secondary">Image upload coming soon</p>
              <p className="text-xs text-text-tertiary mt-1">
                For now, you can enter a URL:
              </p>
              <input
                type="url"
                placeholder="https://example.com/image.jpg"
                onChange={(e) => onChange({ ...program, coverImageUrl: e.target.value || null })}
                className="mt-2 w-full max-w-sm mx-auto px-3 py-2 text-sm bg-border-default border border-border-subtle rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          )}
        </div>
      </SectionCard>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 3: Program Settings
          ═══════════════════════════════════════════════════════════════════════ */}
      <SectionCard title="Program Settings">
        <div className="space-y-4">
          {/* Published Status */}
          <div className="flex items-center justify-between p-3 bg-border-default/30 rounded-lg">
            <div>
              <div className="text-sm font-medium text-white">List on Marketplace</div>
              <div className="text-xs text-text-tertiary">Make this program visible to potential buyers</div>
            </div>
            <VisibilityToggle
              isPublic={program.listed}
              onChange={(v) => onChange({ ...program, listed: v })}
            />
          </div>

          {/* Coming Soon Badge */}
          <label className="flex items-center gap-3 cursor-pointer p-3 bg-border-default/30 rounded-lg">
            <input
              type="checkbox"
              checked={program.comingSoon}
              onChange={(e) => onChange({ ...program, comingSoon: e.target.checked })}
              className="w-4 h-4 rounded border-border-subtle bg-border-default text-accent focus:ring-accent"
            />
            <div className="flex-1">
              <div className="text-sm text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Coming Soon
              </div>
              <div className="text-xs text-text-tertiary">Show a "Coming Soon" badge (for programs without current availability)</div>
            </div>
          </label>

          <div className="border-t border-border-subtle pt-4 space-y-3">
            <div className="text-sm font-medium text-text-secondary mb-2">Buyer Interaction Options</div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={program.acceptInquiries}
                onChange={(e) => onChange({ ...program, acceptInquiries: e.target.checked })}
                className="w-4 h-4 rounded border-border-subtle bg-border-default text-accent focus:ring-accent"
              />
              <div>
                <div className="text-sm text-white">Accept Inquiries</div>
                <div className="text-xs text-text-tertiary">Show "Contact Breeder" button on program page</div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={program.openWaitlist}
                onChange={(e) => onChange({ ...program, openWaitlist: e.target.checked })}
                className="w-4 h-4 rounded border-border-subtle bg-border-default text-accent focus:ring-accent"
              />
              <div>
                <div className="text-sm text-white">Open Waitlist</div>
                <div className="text-xs text-text-tertiary">Show "Join Waitlist" button on program page</div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={program.acceptReservations}
                onChange={(e) => onChange({ ...program, acceptReservations: e.target.checked })}
                className="w-4 h-4 rounded border-border-subtle bg-border-default text-accent focus:ring-accent"
              />
              <div>
                <div className="text-sm text-white">Accept Reservations</div>
                <div className="text-xs text-text-tertiary">Allow paid deposits for waitlist (requires Stripe connection)</div>
              </div>
            </label>
          </div>
        </div>
      </SectionCard>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 4: Pricing
          ═══════════════════════════════════════════════════════════════════════ */}
      <SectionCard title="Pricing">
        <div className="space-y-4">
          <p className="text-xs text-text-tertiary">
            Set pricing for different placement types. Toggle visibility to show/hide each tier on your listing.
          </p>

          {/* Pet Pricing */}
          <PricingTierRow
            label="Pet / Companion Pricing"
            mode={program.pricing.petPriceMode}
            singlePrice={program.pricing.petPriceSingle}
            minPrice={program.pricing.petPriceMin}
            maxPrice={program.pricing.petPriceMax}
            showPricing={program.pricing.showPetPricing}
            onModeChange={(m) => updatePricing({ petPriceMode: m })}
            onSingleChange={(v) => updatePricing({ petPriceSingle: v })}
            onMinChange={(v) => updatePricing({ petPriceMin: v })}
            onMaxChange={(v) => updatePricing({ petPriceMax: v })}
            onShowChange={(v) => updatePricing({ showPetPricing: v })}
          />

          {/* Breeding Rights Pricing */}
          <PricingTierRow
            label="Breeding Rights Pricing"
            mode={program.pricing.breedingRightsPriceMode}
            singlePrice={program.pricing.breedingRightsPriceSingle}
            minPrice={program.pricing.breedingRightsPriceMin}
            maxPrice={program.pricing.breedingRightsPriceMax}
            showPricing={program.pricing.showBreedingRightsPricing}
            onModeChange={(m) => updatePricing({ breedingRightsPriceMode: m })}
            onSingleChange={(v) => updatePricing({ breedingRightsPriceSingle: v })}
            onMinChange={(v) => updatePricing({ breedingRightsPriceMin: v })}
            onMaxChange={(v) => updatePricing({ breedingRightsPriceMax: v })}
            onShowChange={(v) => updatePricing({ showBreedingRightsPricing: v })}
          />

          {/* Show Quality Pricing */}
          <PricingTierRow
            label="Show Quality Pricing"
            mode={program.pricing.showQualityPriceMode}
            singlePrice={program.pricing.showQualityPriceSingle}
            minPrice={program.pricing.showQualityPriceMin}
            maxPrice={program.pricing.showQualityPriceMax}
            showPricing={program.pricing.showShowQualityPricing}
            onModeChange={(m) => updatePricing({ showQualityPriceMode: m })}
            onSingleChange={(v) => updatePricing({ showQualityPriceSingle: v })}
            onMinChange={(v) => updatePricing({ showQualityPriceMin: v })}
            onMaxChange={(v) => updatePricing({ showQualityPriceMax: v })}
            onShowChange={(v) => updatePricing({ showShowQualityPricing: v })}
          />

          {/* What's Included */}
          <div className="border-t border-border-subtle pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-text-secondary">What's Included</label>
              <VisibilityToggle
                isPublic={program.showWhatsIncluded}
                onChange={(v) => onChange({ ...program, showWhatsIncluded: v })}
              />
            </div>
            <textarea
              value={program.whatsIncluded}
              onChange={(e) => onChange({ ...program, whatsIncluded: e.target.value })}
              placeholder="List what buyers receive: vaccinations, microchip, health guarantee, starter kit, breeder support..."
              rows={3}
              maxLength={1000}
              className="w-full px-3 py-2 text-sm bg-border-default border border-border-subtle rounded-md focus:outline-none focus:ring-1 focus:ring-accent resize-none"
            />
            <div className="text-xs text-text-tertiary mt-1 text-right">
              {program.whatsIncluded.length}/1000
            </div>
          </div>

          {/* Typical Wait Time */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-text-secondary flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Typical Wait Time
              </label>
              <VisibilityToggle
                isPublic={program.showWaitTime}
                onChange={(v) => onChange({ ...program, showWaitTime: v })}
              />
            </div>
            <input
              type="text"
              value={program.typicalWaitTime}
              onChange={(e) => onChange({ ...program, typicalWaitTime: e.target.value })}
              placeholder="e.g., 3-6 months, 1 year, varies"
              className="w-full px-3 py-2 text-sm bg-border-default border border-border-subtle rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>
      </SectionCard>

      {/* ═══════════════════════════════════════════════════════════════════════
          Actions Footer
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
        <div>
          {!isNew && onDelete && (
            <Button variant="ghost" onClick={onDelete} className="text-red-400 hover:text-red-300">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Program
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={saving || !program.name.trim() || !program.breedText.trim()}>
            {saving ? "Saving..." : isNew ? "Create Program" : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function ProgramsSettingsPage({ isDrawer }: ProgramsSettingsPageProps) {
  const tenantId = getTenantId();

  // State
  const [programs, setPrograms] = React.useState<BreedingProgramListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Editing state
  const [editing, setEditing] = React.useState<EditingProgram | null>(null);
  const [saving, setSaving] = React.useState(false);

  // Load programs
  const loadPrograms = React.useCallback(async () => {
    if (!tenantId) {
      setError("No tenant context found. Please ensure you are logged in as a breeder.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await getBreederPrograms(tenantId);
      setPrograms(response.items);
    } catch (e: any) {
      setError(e.message || "Failed to load programs");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  React.useEffect(() => {
    loadPrograms();
  }, [loadPrograms]);

  // Handlers
  const handleCreate = () => {
    setEditing(createEmptyProgram());
  };

  const handleEdit = async (program: BreedingProgramListItem) => {
    try {
      const detail = await getBreederProgram(tenantId, program.id);
      setEditing(programToEditing(detail));
    } catch (e: any) {
      setError(e.message || "Failed to load program details");
    }
  };

  const handleToggleListed = async (program: BreedingProgramListItem) => {
    try {
      await updateBreederProgram(tenantId, program.id, { listed: !program.listed });
      await loadPrograms();
    } catch (e: any) {
      setError(e.message || "Failed to update program");
    }
  };

  const handleSave = async () => {
    if (!editing || !editing.name.trim() || !editing.breedText.trim()) return;

    setSaving(true);
    try {
      // Convert new pricing structure to legacy pricingTiers format
      const pricingTiers: ProgramPricingTier[] = [];

      // Helper to format price string from mode/values
      const formatPriceRange = (
        mode: PricingMode,
        single: string,
        min: string,
        max: string
      ): string => {
        if (mode === "contact") return "";
        if (mode === "single") return single.trim();
        if (mode === "range") {
          const minVal = min.trim();
          const maxVal = max.trim();
          if (minVal && maxVal) return `${minVal} - ${maxVal}`;
          if (minVal) return `${minVal}+`;
          if (maxVal) return `Up to ${maxVal}`;
          return "";
        }
        return "";
      };

      // Add Pet tier if visible
      if (editing.pricing.showPetPricing) {
        const priceRange = formatPriceRange(
          editing.pricing.petPriceMode,
          editing.pricing.petPriceSingle,
          editing.pricing.petPriceMin,
          editing.pricing.petPriceMax
        );
        pricingTiers.push({
          tier: "Pet / Companion",
          priceRange: priceRange || "Contact for pricing",
          description: "",
        });
      }

      // Add Breeding Rights tier if visible
      if (editing.pricing.showBreedingRightsPricing) {
        const priceRange = formatPriceRange(
          editing.pricing.breedingRightsPriceMode,
          editing.pricing.breedingRightsPriceSingle,
          editing.pricing.breedingRightsPriceMin,
          editing.pricing.breedingRightsPriceMax
        );
        pricingTiers.push({
          tier: "Breeding Rights",
          priceRange: priceRange || "Contact for pricing",
          description: "",
        });
      }

      // Add Show Quality tier if visible
      if (editing.pricing.showShowQualityPricing) {
        const priceRange = formatPriceRange(
          editing.pricing.showQualityPriceMode,
          editing.pricing.showQualityPriceSingle,
          editing.pricing.showQualityPriceMin,
          editing.pricing.showQualityPriceMax
        );
        pricingTiers.push({
          tier: "Show Quality",
          priceRange: priceRange || "Contact for pricing",
          description: "",
        });
      }

      const input: BreedingProgramCreateInput = {
        name: editing.name.trim(),
        species: editing.species,
        breedText: editing.breedText.trim() || null,
        description: editing.description.trim() || null,
        listed: editing.listed,
        acceptInquiries: editing.acceptInquiries,
        openWaitlist: editing.openWaitlist,
        acceptReservations: editing.acceptReservations,
        pricingTiers: pricingTiers.length > 0 ? pricingTiers : null,
        whatsIncluded: editing.whatsIncluded.trim() || null,
        typicalWaitTime: editing.typicalWaitTime.trim() || null,
        // Extended fields (will be stored but may need API update to persist all)
        ...(editing.programStory?.trim() && { programStory: editing.programStory.trim() }),
        ...(editing.comingSoon && { comingSoon: editing.comingSoon }),
        ...(editing.coverImageUrl && { coverImageUrl: editing.coverImageUrl }),
      };

      if (editing.id === null) {
        await createBreederProgram(tenantId, input);
      } else {
        await updateBreederProgram(tenantId, editing.id, input);
      }

      setEditing(null);
      await loadPrograms();
    } catch (e: any) {
      setError(e.message || "Failed to save program");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editing || editing.id === null) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this program? This cannot be undone."
    );
    if (!confirmed) return;

    setSaving(true);
    try {
      await deleteBreederProgram(tenantId, editing.id);
      setEditing(null);
      await loadPrograms();
    } catch (e: any) {
      setError(e.message || "Failed to delete program");
    } finally {
      setSaving(false);
    }
  };

  // Render
  if (editing) {
    return (
      <div className={isDrawer ? "" : "max-w-3xl mx-auto p-6"}>
        <ProgramEditor
          program={editing}
          onChange={setEditing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
          onDelete={editing.id !== null ? handleDelete : undefined}
          saving={saving}
        />
      </div>
    );
  }

  return (
    <div className={isDrawer ? "" : "max-w-3xl mx-auto p-6"}>
      {/* Header */}
      {!isDrawer && (
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-white">Breeding Programs</h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage your breeding programs and their marketplace visibility.
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-md text-sm text-red-400">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-border-default/50 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {/* Programs list */}
      {!loading && (
        <>
          {programs.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border-subtle rounded-lg">
              <div className="text-text-secondary mb-4">
                You haven't created any breeding programs yet.
              </div>
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Program
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {programs.map((program) => (
                <ProgramCard
                  key={program.id}
                  program={program}
                  onEdit={() => handleEdit(program)}
                  onToggleListed={() => handleToggleListed(program)}
                />
              ))}

              <div className="pt-4">
                <Button variant="outline" onClick={handleCreate}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Program
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ProgramsSettingsPage;
