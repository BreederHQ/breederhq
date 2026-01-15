// apps/offspring/src/components/AddOffspringForm.tsx
// Shared Add Offspring form component for use in both standalone and group-context modes

import * as React from "react";
import ReactDOM from "react-dom";
import { Plus, FilePlus2 } from "lucide-react";
import { Button, DatePicker, BreedCombo } from "@bhq/ui";
import { CollarPicker } from "./CollarPicker";

const MODAL_Z = 2147485000;

const inputClass =
  "w-full h-9 rounded-md border border-hairline bg-surface px-3 text-sm text-primary " +
  "placeholder:text-secondary/80 focus:outline-none focus:ring-1 focus:ring-[hsl(var(--brand-orange))] " +
  "focus:border-[hsl(var(--brand-orange))] shadow-[inset_0_0_0_9999px_rgba(255,255,255,0.02)]";

const labelClass = "text-xs text-secondary";

type Sex = "MALE" | "FEMALE" | "UNKNOWN";
type Species = "DOG" | "CAT" | "HORSE";

export type GroupOption = {
  id: number;
  label: string;
  species?: string | null;
  breed?: string | null;
};

export type AddOffspringFormData = {
  name: string;
  sex: Sex;
  species: Species;
  birthWeightOz: number | null;
  price: number | null;
  notes: string;
  groupId: number | null;
  breed: string | null;
  whelpingCollarColor: string | null;
  dob?: string | null;
};

export type AddOffspringFormProps = {
  /** Whether the form is open */
  open: boolean;
  /** Called when the form should close */
  onClose: () => void;
  /** Called when form is submitted with valid data */
  onCreate: (data: AddOffspringFormData) => Promise<void> | void;
  /**
   * Pre-selected group context. When provided, the parent group selection UI is hidden
   * and this group is used automatically.
   */
  groupContext?: {
    id: number;
    name: string;
    species?: string | null;
    breed?: string | null;
  } | null;
  /**
   * Available group options for parent group selection.
   * Only used when groupContext is not provided.
   */
  groupOptions?: GroupOption[];
  /** API for breed lookup (only needed in standalone mode) */
  breedsApi?: {
    listCanonical: (params?: { species?: string; q?: string; limit?: number }) => Promise<any>;
  };
  /** Whether the form is currently submitting */
  submitting?: boolean;
};

export function AddOffspringForm({
  open,
  onClose,
  onCreate,
  groupContext,
  groupOptions = [],
  breedsApi,
  submitting = false,
}: AddOffspringFormProps) {
  const isGroupContextMode = !!groupContext;

  const [form, setForm] = React.useState<AddOffspringFormData>({
    name: "",
    sex: "UNKNOWN",
    species: (groupContext?.species as Species) || "DOG",
    birthWeightOz: null,
    price: null,
    notes: "",
    groupId: groupContext?.id ?? null,
    breed: groupContext?.breed ?? null,
    whelpingCollarColor: null,
  });

  const [allowNoGroup, setAllowNoGroup] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement | null>(null);

  // Reset form when opening or when group context changes
  React.useEffect(() => {
    if (open) {
      setForm({
        name: "",
        sex: "UNKNOWN",
        species: (groupContext?.species as Species) || "DOG",
        birthWeightOz: null,
        price: null,
        notes: "",
        groupId: groupContext?.id ?? null,
        breed: groupContext?.breed ?? null,
        whelpingCollarColor: null,
      });
      setAllowNoGroup(false);
    }
  }, [open, groupContext?.id, groupContext?.species, groupContext?.breed]);

  // Lock body scroll when open
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [open]);

  // derive UI species string for BreedCombo
  type SpeciesUi = "Dog" | "Cat" | "Horse";
  const speciesUi: SpeciesUi | "" =
    form.species === "DOG"
      ? "Dog"
      : form.species === "CAT"
        ? "Cat"
        : form.species === "HORSE"
          ? "Horse"
          : "";

  // local breed hit for BreedCombo
  const [breedHit, setBreedHit] = React.useState<any>(null);
  const [breedNonce, setBreedNonce] = React.useState(0);

  const onBreedPick = React.useCallback(
    (hit: any) => {
      setBreedHit(hit ? { ...hit } : null);
      setBreedNonce((n) => n + 1);
      setForm((prev) => ({
        ...prev,
        breed:
          hit && typeof hit.name === "string" && hit.name.trim()
            ? hit.name
            : null,
      }));
    },
    [],
  );

  // Filter parent group choices by current species (standalone mode only)
  const currentSpecies = form.species;
  const filteredGroupOptions = React.useMemo(
    () =>
      groupOptions.filter((g) => {
        if (!g.species) return true;
        return (
          String(g.species).toUpperCase() ===
          String(currentSpecies).toUpperCase()
        );
      }),
    [groupOptions, currentSpecies],
  );

  const parentGroupRequired = !isGroupContextMode && !allowNoGroup;
  const dimRest = parentGroupRequired && form.groupId == null;

  const handleChange = <K extends keyof AddOffspringFormData>(
    key: K,
    value: AddOffspringFormData[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const trimmedName = (form.name ?? "").toString().trim();
    if (!trimmedName) {
      return;
    }

    // Determine effective group ID
    const effectiveGroupId = isGroupContextMode
      ? groupContext!.id
      : form.groupId;

    if (effectiveGroupId == null && !allowNoGroup) {
      window.alert(
        "Parent group is required for offspring creation. Select a parent group before saving.",
      );
      return;
    }

    // Build payload
    const payload: AddOffspringFormData = {
      ...form,
      name: trimmedName,
      groupId: effectiveGroupId,
    };

    // Force species and breed from selected group in standalone mode
    if (!isGroupContextMode && effectiveGroupId) {
      const selectedGroup = groupOptions.find((g) => g.id === effectiveGroupId);
      if (selectedGroup) {
        if (selectedGroup.species) {
          payload.species = selectedGroup.species as Species;
        }
        if (selectedGroup.breed) {
          payload.breed = selectedGroup.breed;
        }
      }
    }

    await onCreate(payload);
  };

  if (!open) return null;

  const modalContent = (
    <div
      className="fixed inset-0"
      style={{ zIndex: MODAL_Z, isolation: "isolate" }}
      onMouseDown={(e) => {
        const panel = panelRef.current;
        if (!panel) return;
        if (!panel.contains(e.target as Node)) {
          if (!submitting) onClose();
        }
      }}
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Centered panel */}
      <div className="absolute inset-0 flex items-center justify-center overflow-y-auto p-4">
        <div
          ref={panelRef}
          className="pointer-events-auto w-[820px] max-w-[95vw] max-h-[90vh] overflow-hidden rounded-xl border border-hairline bg-surface shadow-xl"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-hairline">
            <div className="text-lg font-semibold flex items-center gap-2">
              <FilePlus2 className="h-5 w-5" />
              <span>Add Offspring</span>
            </div>
            {isGroupContextMode && (
              <div className="text-sm text-secondary">
                {groupContext!.name}
              </div>
            )}
          </div>

          {/* Body */}
          <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Parent group selection - only in standalone mode */}
            {!isGroupContextMode && (
              <div className="border border-hairline rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-secondary uppercase tracking-wide">
                      Parent group
                    </div>
                    <div className={labelClass}>
                      Link this offspring to an existing group. Use the override only for
                      intentional one off records.
                    </div>
                  </div>

                  {groupOptions.length > 0 && (
                    <label className="inline-flex items-center gap-2 text-xs text-secondary flex-shrink-0">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-hairline bg-surface"
                        checked={allowNoGroup}
                        onChange={(e) => {
                          const checked = e.currentTarget.checked;
                          setAllowNoGroup(checked);
                          if (checked) {
                            handleChange("groupId", null);
                          }
                        }}
                      />
                      <span>Override - Create Orphan</span>
                    </label>
                  )}
                </div>

                {/* Name and Species in parent group section */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="grid gap-1.5 text-sm">
                    <span className="text-xs text-secondary">Name</span>
                    <input
                      className={inputClass}
                      value={form.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      placeholder="Enter the Offspring Name or a Placeholder"
                      autoComplete="off"
                      data-1p-ignore
                      data-lpignore="true"
                      data-form-type="other"
                    />
                  </label>

                  <label className="grid gap-1.5 text-sm">
                    <span className="text-xs text-secondary">Species</span>
                    <select
                      className={inputClass}
                      value={form.species}
                      onChange={(e) => {
                        const nextSpecies = e.target.value as Species;
                        setForm((prev) => {
                          let nextGroupId = prev.groupId;
                          if (nextGroupId != null) {
                            const currentGroup = groupOptions.find(
                              (g) => g.id === nextGroupId,
                            );
                            if (
                              currentGroup?.species &&
                              String(currentGroup.species).toUpperCase() !==
                              String(nextSpecies).toUpperCase()
                            ) {
                              nextGroupId = null;
                            }
                          }
                          return {
                            ...prev,
                            species: nextSpecies,
                            groupId: nextGroupId,
                          };
                        });
                      }}
                    >
                      <option value="DOG">Dog</option>
                      <option value="CAT">Cat</option>
                      <option value="HORSE">Horse</option>
                    </select>
                  </label>
                </div>

                {filteredGroupOptions.length === 0 ? (
                  <div className="text-xs text-amber-300 mt-2">
                    No offspring groups found for the selected species. Enable the override if you intend to create an orphan.
                  </div>
                ) : (
                  <label className="grid gap-1.5 text-sm mt-3">
                    <span className="text-xs text-secondary">
                      Parent group
                      {!allowNoGroup && <span className="text-rose-400 ml-1">*</span>}
                    </span>
                    <select
                      className={inputClass}
                      disabled={allowNoGroup}
                      value={form.groupId ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        handleChange("groupId", v ? Number(v) : null);
                      }}
                    >
                      <option value="">
                        {allowNoGroup ? "None" : "Select the Species - Then Choose an Existing Offspring Group..."}
                      </option>
                      {filteredGroupOptions.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.label}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            )}

            {/* Core fields */}
            <div
              className="transition-all"
              style={
                dimRest
                  ? {
                    opacity: 0.25,
                    pointerEvents: "none",
                    filter: "blur(2px)",
                  }
                  : undefined
              }
            >
              {/* Name field - only show here in group context mode */}
              {isGroupContextMode && (
                <div className="mb-4">
                  <label className="grid gap-1.5 text-sm">
                    <span className="text-xs text-secondary">Name</span>
                    <input
                      className={inputClass}
                      value={form.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      placeholder="Enter the Offspring Name or a Placeholder"
                      autoFocus
                      autoComplete="off"
                      data-1p-ignore
                      data-lpignore="true"
                      data-form-type="other"
                    />
                  </label>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sex */}
                <label className="grid gap-1.5 text-sm">
                  <span className="text-xs text-secondary">Sex</span>
                  <select
                    className={inputClass}
                    value={form.sex}
                    onChange={(e) => handleChange("sex", e.target.value as Sex)}
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="UNKNOWN">Unknown</option>
                  </select>
                </label>

                {/* Birth weight */}
                <label className="grid gap-1.5 text-sm">
                  <span className="text-xs text-secondary">Birth weight (oz)</span>
                  <input
                    type="number"
                    className={inputClass}
                    value={form.birthWeightOz ?? ""}
                    onChange={(e) =>
                      handleChange(
                        "birthWeightOz",
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                    placeholder="Optional"
                    autoComplete="off"
                    data-1p-ignore
                    data-lpignore="true"
                    data-form-type="other"
                  />
                </label>

                {/* Breed - only when no parent group is allowed (standalone orphan mode) */}
                {!isGroupContextMode && allowNoGroup && breedsApi && (
                  <div className="grid gap-1.5 text-sm">
                    <span className="text-xs text-secondary">Breed</span>
                    {speciesUi ? (
                      <BreedCombo
                        key={`create-breed-${speciesUi}-${breedNonce}`}
                        species={speciesUi}
                        value={breedHit}
                        onChange={onBreedPick}
                        api={{ breeds: { listCanonical: breedsApi.listCanonical } }}
                      />
                    ) : (
                      <div className="h-9 px-3 flex items-center rounded-md border border-hairline bg-surface/60 text-sm text-secondary">
                        Select species
                      </div>
                    )}
                  </div>
                )}

                {/* Birth date - only in orphan mode */}
                {!isGroupContextMode && allowNoGroup && (
                  <label className="grid gap-1.5 text-sm">
                    <span className="text-xs text-secondary">Birth date</span>
                    <DatePicker
                      value={form.dob ?? ""}
                      onChange={(e) => handleChange("dob", e.currentTarget.value)}
                      inputClassName={inputClass}
                    />
                  </label>
                )}

                {/* Price */}
                <label className="grid gap-1.5 text-sm">
                  <span className="text-xs text-secondary">Price (whole number)</span>
                  <input
                    type="number"
                    className={inputClass}
                    value={form.price ?? ""}
                    onChange={(e) =>
                      handleChange(
                        "price",
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                    placeholder="$"
                    autoComplete="off"
                    data-1p-ignore
                    data-lpignore="true"
                    data-form-type="other"
                  />
                </label>

                {/* Whelping collar color */}
                <label className="grid gap-1.5 text-sm">
                  <span className="text-xs text-secondary">Whelping Collar Color</span>
                  <CollarPicker
                    value={form.whelpingCollarColor}
                    onChange={(colorLabel) => handleChange("whelpingCollarColor", colorLabel)}
                    className="w-full"
                  />
                </label>

                {/* Notes - full width */}
                <label className="grid gap-1.5 text-sm md:col-span-2">
                  <span className="text-xs text-secondary">Notes</span>
                  <textarea
                    className={inputClass + " min-h-[100px] resize-y"}
                    value={form.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                    placeholder="Optional notes about this offspring"
                    autoComplete="off"
                    data-1p-ignore
                    data-lpignore="true"
                    data-form-type="other"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-hairline">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              disabled={dimRest || submitting}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              {submitting ? "Adding..." : "Add"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}

export default AddOffspringForm;
