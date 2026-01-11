// apps/marketplace/src/management/pages/ProgramsSettingsPage.tsx
// Breeder-side management of Breeding Programs for marketplace visibility

import * as React from "react";
import { Button, SectionCard, Badge } from "@bhq/ui";
import { Plus, Pencil, Trash2, Eye, EyeOff, ChevronDown, ChevronUp, X } from "lucide-react";
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

type EditingProgram = {
  id: number | null; // null = creating new
  name: string;
  species: string;
  breedText: string;
  description: string;
  listed: boolean;
  acceptInquiries: boolean;
  openWaitlist: boolean;
  acceptReservations: boolean;
  pricingTiers: ProgramPricingTier[];
  whatsIncluded: string;
  typicalWaitTime: string;
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

function createEmptyProgram(): EditingProgram {
  return {
    id: null,
    name: "",
    species: "DOG",
    breedText: "",
    description: "",
    listed: false,
    acceptInquiries: true,
    openWaitlist: false,
    acceptReservations: false,
    pricingTiers: [],
    whatsIncluded: "",
    typicalWaitTime: "",
  };
}

function programToEditing(p: BreedingProgramDetail): EditingProgram {
  return {
    id: p.id,
    name: p.name,
    species: p.species,
    breedText: p.breedText || "",
    description: p.description || "",
    listed: p.listed,
    acceptInquiries: p.acceptInquiries,
    openWaitlist: p.openWaitlist,
    acceptReservations: p.acceptReservations,
    pricingTiers: p.pricingTiers || [],
    whatsIncluded: p.whatsIncluded || "",
    typicalWaitTime: p.typicalWaitTime || "",
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
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-medium text-white truncate">{program.name}</h3>
            {program.listed ? (
              <Badge variant="success">Listed</Badge>
            ) : (
              <Badge variant="neutral">Draft</Badge>
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

function PricingTierEditor({
  tiers,
  onChange,
}: {
  tiers: ProgramPricingTier[];
  onChange: (tiers: ProgramPricingTier[]) => void;
}) {
  const addTier = () => {
    onChange([...tiers, { tier: "", priceRange: "", description: "" }]);
  };

  const updateTier = (index: number, field: keyof ProgramPricingTier, value: string) => {
    const updated = [...tiers];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeTier = (index: number) => {
    onChange(tiers.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {tiers.map((tier, index) => (
        <div key={index} className="flex items-start gap-2 p-3 bg-border-default/30 rounded-md">
          <div className="flex-1 grid grid-cols-2 gap-2">
            <input
              type="text"
              value={tier.tier}
              onChange={(e) => updateTier(index, "tier", e.target.value)}
              placeholder="Tier name (e.g., Pet)"
              className="px-3 py-2 text-sm bg-border-default border border-border-subtle rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <input
              type="text"
              value={tier.priceRange}
              onChange={(e) => updateTier(index, "priceRange", e.target.value)}
              placeholder="Price range (e.g., $2,000-$2,500)"
              className="px-3 py-2 text-sm bg-border-default border border-border-subtle rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <input
              type="text"
              value={tier.description || ""}
              onChange={(e) => updateTier(index, "description", e.target.value)}
              placeholder="Description (optional)"
              className="col-span-2 px-3 py-2 text-sm bg-border-default border border-border-subtle rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <button
            type="button"
            onClick={() => removeTier(index)}
            className="p-2 text-text-tertiary hover:text-red-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addTier}
        className="text-sm text-accent hover:text-accent-hover flex items-center gap-1"
      >
        <Plus className="w-4 h-4" />
        Add pricing tier
      </button>
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

  return (
    <div className="space-y-6">
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

      {/* Basic Info */}
      <SectionCard title="Basic Information">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Program Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={program.name}
              onChange={(e) => onChange({ ...program, name: e.target.value })}
              placeholder="e.g., Golden Retriever Breeding Program"
              className="w-full px-3 py-2 text-sm bg-border-default border border-border-subtle rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Species <span className="text-red-400">*</span>
              </label>
              <select
                value={program.species}
                onChange={(e) => onChange({ ...program, species: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-border-default border border-border-subtle rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
              >
                {SPECIES_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Breed
              </label>
              <input
                type="text"
                value={program.breedText}
                onChange={(e) => onChange({ ...program, breedText: e.target.value })}
                placeholder="e.g., Golden Retriever"
                className="w-full px-3 py-2 text-sm bg-border-default border border-border-subtle rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Description
            </label>
            <textarea
              value={program.description}
              onChange={(e) => onChange({ ...program, description: e.target.value })}
              placeholder="Tell potential buyers about your breeding program, your goals, and what makes your program special..."
              rows={4}
              className="w-full px-3 py-2 text-sm bg-border-default border border-border-subtle rounded-md focus:outline-none focus:ring-1 focus:ring-accent resize-none"
            />
          </div>
        </div>
      </SectionCard>

      {/* Marketplace Settings */}
      <SectionCard title="Marketplace Settings">
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={program.listed}
              onChange={(e) => onChange({ ...program, listed: e.target.checked })}
              className="w-4 h-4 rounded border-border-subtle bg-border-default text-accent focus:ring-accent"
            />
            <div>
              <div className="text-sm font-medium text-white">List on Marketplace</div>
              <div className="text-xs text-text-tertiary">Make this program visible to potential buyers</div>
            </div>
          </label>

          <div className="border-t border-border-subtle pt-4 space-y-3">
            <div className="text-sm font-medium text-text-secondary mb-2">Availability Options</div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={program.acceptInquiries}
                onChange={(e) => onChange({ ...program, acceptInquiries: e.target.checked })}
                className="w-4 h-4 rounded border-border-subtle bg-border-default text-accent focus:ring-accent"
              />
              <div>
                <div className="text-sm text-white">Accept Inquiries</div>
                <div className="text-xs text-text-tertiary">Allow buyers to send you messages about this program</div>
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
                <div className="text-xs text-text-tertiary">Allow buyers to join a waitlist for future litters/foals</div>
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
                <div className="text-xs text-text-tertiary">Allow buyers to place deposits on specific offspring groups</div>
              </div>
            </label>
          </div>
        </div>
      </SectionCard>

      {/* Pricing */}
      <SectionCard title="Pricing Information">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Pricing Tiers
            </label>
            <PricingTierEditor
              tiers={program.pricingTiers}
              onChange={(tiers) => onChange({ ...program, pricingTiers: tiers })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              What's Included
            </label>
            <textarea
              value={program.whatsIncluded}
              onChange={(e) => onChange({ ...program, whatsIncluded: e.target.value })}
              placeholder="List what buyers receive (e.g., vaccinations, microchip, health guarantee, starter kit...)"
              rows={3}
              maxLength={1000}
              className="w-full px-3 py-2 text-sm bg-border-default border border-border-subtle rounded-md focus:outline-none focus:ring-1 focus:ring-accent resize-none"
            />
            <div className="text-xs text-text-tertiary mt-1 text-right">
              {program.whatsIncluded.length}/1000
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Typical Wait Time
            </label>
            <input
              type="text"
              value={program.typicalWaitTime}
              onChange={(e) => onChange({ ...program, typicalWaitTime: e.target.value })}
              placeholder="e.g., 3-6 months"
              className="w-full px-3 py-2 text-sm bg-border-default border border-border-subtle rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>
      </SectionCard>

      {/* Actions */}
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
          <Button onClick={onSave} disabled={saving || !program.name.trim()}>
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
    if (!editing || !editing.name.trim()) return;

    setSaving(true);
    try {
      const input: BreedingProgramCreateInput = {
        name: editing.name.trim(),
        species: editing.species,
        breedText: editing.breedText.trim() || null,
        description: editing.description.trim() || null,
        listed: editing.listed,
        acceptInquiries: editing.acceptInquiries,
        openWaitlist: editing.openWaitlist,
        acceptReservations: editing.acceptReservations,
        pricingTiers: editing.pricingTiers.length > 0 ? editing.pricingTiers : null,
        whatsIncluded: editing.whatsIncluded.trim() || null,
        typicalWaitTime: editing.typicalWaitTime.trim() || null,
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
