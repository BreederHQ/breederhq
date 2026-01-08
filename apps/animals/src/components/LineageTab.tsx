// apps/animals/src/components/LineageTab.tsx
// Lineage tab for animal detail view - shows parents, pedigree tree, and COI

import React from "react";
import { makeApi, type PedigreeNode, type COIResult, type ParentsResult, type PrivacySettings } from "../api";

const api = makeApi();

/* ─────────────────────────────────────────────────────────────────────────────
 * Types
 * ───────────────────────────────────────────────────────────────────────────── */

type AnimalRow = {
  id: number;
  name: string;
  species?: string;
  sex?: string;
  breed?: string;
  photoUrl?: string;
};

type AnimalOption = {
  id: number;
  name: string;
  breed?: string | null;
  photoUrl?: string | null;
};

/* ─────────────────────────────────────────────────────────────────────────────
 * Helper: COI Risk Badge
 * ───────────────────────────────────────────────────────────────────────────── */

function COIBadge({ coi }: { coi: COIResult | null }) {
  if (!coi) return null;

  const percent = (coi.coefficient * 100).toFixed(2);
  const colorClass = {
    LOW: "bg-green-500/20 text-green-400 border-green-500/30",
    MODERATE: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    HIGH: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    CRITICAL: "bg-red-500/20 text-red-400 border-red-500/30",
  }[coi.riskLevel];

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium ${colorClass}`}>
      <span>COI: {percent}%</span>
      <span className="opacity-70">({coi.riskLevel.toLowerCase()})</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Helper: Parent Card
 * ───────────────────────────────────────────────────────────────────────────── */

function ParentCard({
  label,
  parent,
  onSelect,
  onClear,
  mode,
  loading,
}: {
  label: string;
  parent: AnimalOption | null;
  onSelect: () => void;
  onClear: () => void;
  mode: "view" | "edit";
  loading?: boolean;
}) {
  return (
    <div>
      <div className="text-xs font-semibold text-secondary mb-2">{label}</div>
      <div
        className={`rounded-lg border border-hairline p-3 bg-surface transition-colors ${
          mode === "edit" ? "hover:bg-white/5 cursor-pointer" : ""
        }`}
        onClick={mode === "edit" ? onSelect : undefined}
      >
        {loading ? (
          <div className="text-sm text-secondary animate-pulse">Loading...</div>
        ) : parent ? (
          <div className="flex items-center gap-3">
            {parent.photoUrl ? (
              <img
                src={parent.photoUrl}
                alt={parent.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg">
                {label.includes("Sire") ? "♂" : "♀"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{parent.name}</div>
              {parent.breed && (
                <div className="text-xs text-secondary truncate">{parent.breed}</div>
              )}
            </div>
            {mode === "edit" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                className="p-1 rounded hover:bg-white/10 text-secondary hover:text-primary transition-colors"
                title="Remove"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ) : (
          <div className="text-sm text-secondary">
            {mode === "edit" ? "Click to select..." : "Not linked"}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Helper: Animal Picker Modal
 * ───────────────────────────────────────────────────────────────────────────── */

function AnimalPickerModal({
  open,
  onClose,
  onSelect,
  sex,
  species,
  excludeId,
  title,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (animal: AnimalOption) => void;
  sex: "FEMALE" | "MALE";
  species?: string;
  excludeId: number;
  title: string;
}) {
  const [search, setSearch] = React.useState("");
  const [animals, setAnimals] = React.useState<AnimalOption[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.animals.list({
          q: search || undefined,
          limit: 50,
        });
        const items = (res as any)?.items || [];
        // Filter by sex and exclude self
        const filtered = items.filter(
          (a: any) =>
            a.id !== excludeId &&
            (a.sex || "").toUpperCase() === sex &&
            (!species || (a.species || "").toUpperCase() === species.toUpperCase())
        );
        setAnimals(
          filtered.map((a: any) => ({
            id: a.id,
            name: a.name,
            breed: a.breed,
            photoUrl: a.photoUrl,
          }))
        );
      } catch (err) {
        console.error("Failed to load animals:", err);
        setAnimals([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open, search, sex, species, excludeId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-surface border border-hairline rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-hairline">
          <h3 className="text-lg font-semibold">{title}</h3>
          <input
            type="text"
            placeholder="Search animals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mt-3 w-full px-3 py-2 rounded-md border border-hairline bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            autoFocus
          />
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="text-center py-8 text-secondary">Loading...</div>
          ) : animals.length === 0 ? (
            <div className="text-center py-8 text-secondary">
              No {sex.toLowerCase()}s found
            </div>
          ) : (
            <div className="space-y-1">
              {animals.map((animal) => (
                <button
                  key={animal.id}
                  onClick={() => {
                    onSelect(animal);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-white/5 transition-colors text-left"
                >
                  {animal.photoUrl ? (
                    <img
                      src={animal.photoUrl}
                      alt={animal.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm">
                      {sex === "MALE" ? "♂" : "♀"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{animal.name}</div>
                    {animal.breed && (
                      <div className="text-xs text-secondary truncate">{animal.breed}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="p-3 border-t border-hairline">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm rounded-md border border-hairline hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Helper: Format animal name with titles
 * ───────────────────────────────────────────────────────────────────────────── */

function formatNameWithTitles(node: PedigreeNode): React.ReactNode {
  const hasPrefix = node.titlePrefix && node.titlePrefix.trim();
  const hasSuffix = node.titleSuffix && node.titleSuffix.trim();

  if (!hasPrefix && !hasSuffix) {
    return node.name;
  }

  return (
    <>
      {hasPrefix && (
        <span className="text-[hsl(var(--brand-orange))] font-semibold">{node.titlePrefix} </span>
      )}
      <span>{node.name}</span>
      {hasSuffix && (
        <span className="text-[hsl(var(--brand-orange))] font-semibold"> {node.titleSuffix}</span>
      )}
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Helper: Simple Pedigree Tree (3 generations)
 * ───────────────────────────────────────────────────────────────────────────── */

function PedigreeTreeNode({
  node,
  depth,
  maxDepth,
}: {
  node: PedigreeNode | null;
  depth: number;
  maxDepth: number;
}) {
  if (!node || depth > maxDepth) return null;

  const hasParents = node.dam || node.sire;
  const showChildren = depth < maxDepth && hasParents;

  return (
    <div className="flex items-center gap-2">
      {/* Node */}
      <div className="flex-shrink-0 w-32">
        <div className="rounded-md border border-hairline p-2 bg-surface text-xs">
          <div className="font-medium truncate" title={node.name}>
            {node.name}
          </div>
          {node.breed && (
            <div className="text-secondary truncate text-[10px]" title={node.breed}>
              {node.breed}
            </div>
          )}
        </div>
      </div>

      {/* Children */}
      {showChildren && (
        <div className="flex flex-col gap-1">
          <PedigreeTreeNode node={node.sire} depth={depth + 1} maxDepth={maxDepth} />
          <PedigreeTreeNode node={node.dam} depth={depth + 1} maxDepth={maxDepth} />
        </div>
      )}
    </div>
  );
}

function SimplePedigreeTree({ pedigree }: { pedigree: PedigreeNode | null }) {
  if (!pedigree) {
    return (
      <div className="text-sm text-secondary py-4">
        No pedigree data available. Set parents to build the family tree.
      </div>
    );
  }

  const hasAnyAncestors = pedigree.dam || pedigree.sire;
  if (!hasAnyAncestors) {
    return (
      <div className="text-sm text-secondary py-4">
        No ancestors recorded. Set the dam and sire to start building the pedigree.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="inline-flex gap-4 min-w-max">
        {/* Subject */}
        <div className="flex flex-col justify-center">
          <div className="rounded-md border-2 border-accent p-2 bg-accent/10 text-xs w-40">
            <div className="font-semibold truncate">{formatNameWithTitles(pedigree)}</div>
            {pedigree.breed && (
              <div className="text-secondary truncate text-[10px]">{pedigree.breed}</div>
            )}
          </div>
        </div>

        {/* Parents */}
        <div className="flex flex-col justify-center gap-2">
          {/* Sire */}
          <div className="flex items-center gap-2">
            <div className="rounded-md border border-hairline p-2 bg-surface text-xs w-36">
              {pedigree.sire ? (
                <>
                  <div className="font-medium truncate">{formatNameWithTitles(pedigree.sire)}</div>
                  {pedigree.sire.breed && (
                    <div className="text-secondary truncate text-[10px]">{pedigree.sire.breed}</div>
                  )}
                </>
              ) : (
                <div className="text-secondary">Unknown Sire</div>
              )}
            </div>
            {/* Grandparents (sire's side) */}
            {pedigree.sire && (pedigree.sire.sire || pedigree.sire.dam) && (
              <div className="flex flex-col gap-1">
                <div className="rounded border border-hairline p-1.5 bg-surface text-[10px] w-32">
                  {pedigree.sire.sire ? (
                    <div className="truncate">{formatNameWithTitles(pedigree.sire.sire)}</div>
                  ) : (
                    <div className="text-secondary">Unknown</div>
                  )}
                </div>
                <div className="rounded border border-hairline p-1.5 bg-surface text-[10px] w-32">
                  {pedigree.sire.dam ? (
                    <div className="truncate">{formatNameWithTitles(pedigree.sire.dam)}</div>
                  ) : (
                    <div className="text-secondary">Unknown</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Dam */}
          <div className="flex items-center gap-2">
            <div className="rounded-md border border-hairline p-2 bg-surface text-xs w-36">
              {pedigree.dam ? (
                <>
                  <div className="font-medium truncate">{formatNameWithTitles(pedigree.dam)}</div>
                  {pedigree.dam.breed && (
                    <div className="text-secondary truncate text-[10px]">{pedigree.dam.breed}</div>
                  )}
                </>
              ) : (
                <div className="text-secondary">Unknown Dam</div>
              )}
            </div>
            {/* Grandparents (dam's side) */}
            {pedigree.dam && (pedigree.dam.sire || pedigree.dam.dam) && (
              <div className="flex flex-col gap-1">
                <div className="rounded border border-hairline p-1.5 bg-surface text-[10px] w-32">
                  {pedigree.dam.sire ? (
                    <div className="truncate">{formatNameWithTitles(pedigree.dam.sire)}</div>
                  ) : (
                    <div className="text-secondary">Unknown</div>
                  )}
                </div>
                <div className="rounded border border-hairline p-1.5 bg-surface text-[10px] w-32">
                  {pedigree.dam.dam ? (
                    <div className="truncate">{formatNameWithTitles(pedigree.dam.dam)}</div>
                  ) : (
                    <div className="text-secondary">Unknown</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Privacy Settings Panel - Controls what's shared with other breeders
 * ───────────────────────────────────────────────────────────────────────────── */

function PrivacyToggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className={`flex items-start gap-3 py-2 cursor-pointer ${disabled ? "opacity-50" : ""}`}>
      <div className="pt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="w-4 h-4 rounded border-hairline bg-surface text-accent focus:ring-accent/50"
        />
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-secondary">{description}</div>
      </div>
    </label>
  );
}

function PrivacySettingsPanel({
  animalId,
  mode,
}: {
  animalId: number;
  mode: "view" | "edit";
}) {
  const [settings, setSettings] = React.useState<PrivacySettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);

  React.useEffect(() => {
    api.animals.lineage.getPrivacySettings(animalId)
      .then(setSettings)
      .catch((err) => console.error("Failed to load privacy settings:", err))
      .finally(() => setLoading(false));
  }, [animalId]);

  const updateSetting = async (key: keyof Omit<PrivacySettings, "animalId">, value: boolean) => {
    if (!settings || mode !== "edit") return;
    setSaving(true);
    try {
      const updated = await api.animals.lineage.updatePrivacySettings(animalId, { [key]: value });
      setSettings(updated);
    } catch (err) {
      console.error("Failed to update privacy setting:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-hairline bg-surface p-4">
        <div className="text-sm text-secondary animate-pulse">Loading privacy settings...</div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="rounded-lg border border-hairline bg-surface overflow-hidden">
      {/* Header - clickable to expand/collapse */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-hairline/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🔒</span>
          <h3 className="text-sm font-semibold">Sharing & Privacy</h3>
          {saving && <span className="text-xs text-secondary">(saving...)</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            settings.allowCrossTenantMatching
              ? "bg-green-500/20 text-green-400"
              : "bg-yellow-500/20 text-yellow-400"
          }`}>
            {settings.allowCrossTenantMatching ? "Discoverable" : "Private"}
          </span>
          <svg
            className={`w-4 h-4 text-secondary transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expandable content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-hairline">
          <p className="text-xs text-secondary py-3">
            Control what information about this animal is visible to other breeders in the BreederHQ network.
            This affects how your animal appears in cross-kennel pedigrees.
          </p>

          <div className="space-y-1">
            <div className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2">
              Cross-Kennel Visibility
            </div>

            <PrivacyToggle
              label="Allow cross-tenant matching"
              description="Let BreederHQ match this animal with records from other breeders (via microchip, registry number, etc.)"
              checked={settings.allowCrossTenantMatching}
              onChange={(v) => updateSetting("allowCrossTenantMatching", v)}
              disabled={mode !== "edit"}
            />

            <PrivacyToggle
              label="Show name"
              description="Display this animal's name to other breeders viewing their pedigrees"
              checked={settings.showName}
              onChange={(v) => updateSetting("showName", v)}
              disabled={mode !== "edit" || !settings.allowCrossTenantMatching}
            />

            <PrivacyToggle
              label="Show photo"
              description="Display this animal's photo in cross-kennel pedigrees"
              checked={settings.showPhoto}
              onChange={(v) => updateSetting("showPhoto", v)}
              disabled={mode !== "edit" || !settings.allowCrossTenantMatching}
            />

            <PrivacyToggle
              label="Show full birth date"
              description="Show complete DOB (otherwise only year is shown)"
              checked={settings.showFullDob}
              onChange={(v) => updateSetting("showFullDob", v)}
              disabled={mode !== "edit" || !settings.allowCrossTenantMatching}
            />

            <PrivacyToggle
              label="Show full registry numbers"
              description="Show complete AKC/UKC/etc. numbers (otherwise only last 4 digits)"
              checked={settings.showRegistryFull}
              onChange={(v) => updateSetting("showRegistryFull", v)}
              disabled={mode !== "edit" || !settings.allowCrossTenantMatching}
            />

            <PrivacyToggle
              label="Show health test results"
              description="Share detailed health testing results with other breeders"
              checked={settings.showHealthResults}
              onChange={(v) => updateSetting("showHealthResults", v)}
              disabled={mode !== "edit" || !settings.allowCrossTenantMatching}
            />

            <PrivacyToggle
              label="Show genetic data"
              description="Share coat color genetics and other genetic test results"
              checked={settings.showGeneticData}
              onChange={(v) => updateSetting("showGeneticData", v)}
              disabled={mode !== "edit" || !settings.allowCrossTenantMatching}
            />

            <div className="text-xs font-semibold text-secondary uppercase tracking-wide mt-4 mb-2">
              Contact Preferences
            </div>

            <PrivacyToggle
              label="Allow info requests"
              description="Let other breeders request additional information about this animal"
              checked={settings.allowInfoRequests}
              onChange={(v) => updateSetting("allowInfoRequests", v)}
              disabled={mode !== "edit" || !settings.allowCrossTenantMatching}
            />

            <PrivacyToggle
              label="Allow direct contact"
              description="Show your contact information directly (otherwise they must send a request)"
              checked={settings.allowDirectContact}
              onChange={(v) => updateSetting("allowDirectContact", v)}
              disabled={mode !== "edit" || !settings.allowCrossTenantMatching}
            />
          </div>

          {!settings.allowCrossTenantMatching && (
            <div className="mt-4 p-3 rounded-md bg-yellow-500/10 border border-yellow-500/30 text-xs text-yellow-400">
              Cross-tenant matching is disabled. This animal won't appear in other breeders' pedigrees
              and COI calculations across kennels won't include this animal's lineage.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Main Component: LineageTab
 * ───────────────────────────────────────────────────────────────────────────── */

export function LineageTab({
  animal,
  mode,
}: {
  animal: AnimalRow;
  mode: "view" | "edit";
}) {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Parent data
  const [dam, setDam] = React.useState<AnimalOption | null>(null);
  const [sire, setSire] = React.useState<AnimalOption | null>(null);
  const [coi, setCoi] = React.useState<COIResult | null>(null);
  const [pedigree, setPedigree] = React.useState<PedigreeNode | null>(null);

  // Picker modal state
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [pickerSex, setPickerSex] = React.useState<"FEMALE" | "MALE">("FEMALE");

  // Load parents and pedigree
  React.useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // Load pedigree (includes COI)
        const pedigreeRes = await api.animals.lineage.getPedigree(animal.id, 3);
        setPedigree(pedigreeRes.pedigree);
        setCoi(pedigreeRes.coi);

        // Extract dam/sire from pedigree
        if (pedigreeRes.pedigree) {
          setDam(pedigreeRes.pedigree.dam ? {
            id: pedigreeRes.pedigree.dam.id,
            name: pedigreeRes.pedigree.dam.name,
            breed: pedigreeRes.pedigree.dam.breed,
            photoUrl: pedigreeRes.pedigree.dam.photoUrl,
          } : null);
          setSire(pedigreeRes.pedigree.sire ? {
            id: pedigreeRes.pedigree.sire.id,
            name: pedigreeRes.pedigree.sire.name,
            breed: pedigreeRes.pedigree.sire.breed,
            photoUrl: pedigreeRes.pedigree.sire.photoUrl,
          } : null);
        }
      } catch (err) {
        console.error("Failed to load lineage:", err);
        setError("Failed to load lineage data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [animal.id]);

  // Save parents
  const saveParents = React.useCallback(
    async (newDamId: number | null, newSireId: number | null) => {
      setSaving(true);
      setError(null);
      try {
        await api.animals.lineage.setParents(animal.id, {
          damId: newDamId,
          sireId: newSireId,
        });
        // Reload pedigree
        const pedigreeRes = await api.animals.lineage.getPedigree(animal.id, 3);
        setPedigree(pedigreeRes.pedigree);
        setCoi(pedigreeRes.coi);
      } catch (err: any) {
        console.error("Failed to save parents:", err);
        setError(err?.message || "Failed to save parents");
      } finally {
        setSaving(false);
      }
    },
    [animal.id]
  );

  // Handlers
  const handleSelectDam = (selected: AnimalOption) => {
    setDam(selected);
    saveParents(selected.id, sire?.id ?? null);
  };

  const handleSelectSire = (selected: AnimalOption) => {
    setSire(selected);
    saveParents(dam?.id ?? null, selected.id);
  };

  const handleClearDam = () => {
    setDam(null);
    saveParents(null, sire?.id ?? null);
  };

  const handleClearSire = () => {
    setSire(null);
    saveParents(dam?.id ?? null, null);
  };

  const openDamPicker = () => {
    setPickerSex("FEMALE");
    setPickerOpen(true);
  };

  const openSirePicker = () => {
    setPickerSex("MALE");
    setPickerOpen(true);
  };

  return (
    <div className="space-y-4 p-4">
      {/* Error message */}
      {error && (
        <div className="rounded-md bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Parents Section */}
      <div className="rounded-lg border border-hairline bg-surface p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <span>Parents</span>
            {saving && <span className="text-xs text-secondary">(saving...)</span>}
          </h3>
          {coi && coi.coefficient > 0 && <COIBadge coi={coi} />}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ParentCard
            label="SIRE (Father)"
            parent={sire}
            onSelect={openSirePicker}
            onClear={handleClearSire}
            mode={mode}
            loading={loading}
          />
          <ParentCard
            label="DAM (Mother)"
            parent={dam}
            onSelect={openDamPicker}
            onClear={handleClearDam}
            mode={mode}
            loading={loading}
          />
        </div>
      </div>

      {/* Pedigree Tree */}
      <div className="rounded-lg border border-hairline bg-surface p-4">
        <h3 className="text-sm font-semibold mb-4">Pedigree (3 Generations)</h3>
        {loading ? (
          <div className="text-sm text-secondary py-4 animate-pulse">Loading pedigree...</div>
        ) : (
          <SimplePedigreeTree pedigree={pedigree} />
        )}
      </div>

      {/* COI Details */}
      {coi && coi.commonAncestors.length > 0 && (
        <div className="rounded-lg border border-hairline bg-surface p-4">
          <h3 className="text-sm font-semibold mb-3">Inbreeding Analysis</h3>
          <div className="text-sm text-secondary mb-3">
            Coefficient of Inbreeding (COI) calculated over {coi.generationsAnalyzed} generations.
          </div>
          <div className="space-y-2">
            <div className="text-xs font-semibold text-secondary">Common Ancestors</div>
            {coi.commonAncestors.slice(0, 5).map((ancestor) => (
              <div
                key={ancestor.id}
                className="flex items-center justify-between py-1.5 border-b border-hairline last:border-0"
              >
                <span className="text-sm">{ancestor.name}</span>
                <span className="text-xs text-secondary">
                  {(ancestor.contribution * 100).toFixed(2)}% contribution
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Privacy Settings */}
      <PrivacySettingsPanel animalId={animal.id} mode={mode} />

      {/* Animal Picker Modal */}
      <AnimalPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={pickerSex === "FEMALE" ? handleSelectDam : handleSelectSire}
        sex={pickerSex}
        species={animal.species}
        excludeId={animal.id}
        title={pickerSex === "FEMALE" ? "Select Dam (Mother)" : "Select Sire (Father)"}
      />
    </div>
  );
}

export default LineageTab;
