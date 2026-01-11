// packages/ui/src/components/AddGeneticResultDialog/AddGeneticResultDialog.tsx
import * as React from "react";
import { Dialog } from "../Dialog/Dialog";
import { Button } from "../Button/Button";
import { GeneticMarkerPicker } from "../GeneticMarkerPicker/GeneticMarkerPicker";
import { Input } from "../Input/Input";
import { AlertTriangle, FileText, Plus, Trash2 } from "lucide-react";
import type {
  GeneticMarker,
  GeneticSpecies,
  GeneticResultStatus,
  CreateGeneticResultInput,
} from "@bhq/api";

export interface AddGeneticResultDialogProps {
  /** Whether dialog is open */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** Animal ID to add result for */
  animalId: number;
  /** Animal name for display */
  animalName: string;
  /** Animal species for filtering markers */
  species: GeneticSpecies;
  /** Animal breeds for filtering breed-specific markers */
  breeds?: string[];
  /** Available markers to choose from */
  markers: GeneticMarker[];
  /** Called when results are saved */
  onSave: (results: CreateGeneticResultInput[]) => Promise<void>;
  /** Base URL for API calls (optional, for document upload) */
  baseUrl?: string;
}

interface ResultEntry {
  id: string; // Local UUID for tracking
  marker: GeneticMarker | null;
  allele1: string;
  allele2: string;
  status: GeneticResultStatus | "";
  rawValue: string;
  testProvider: string;
  testDate: string;
}

const RESULT_STATUS_OPTIONS: { value: GeneticResultStatus; label: string }[] = [
  { value: "clear", label: "Clear" },
  { value: "carrier", label: "Carrier" },
  { value: "affected", label: "Affected" },
  { value: "at_risk", label: "At Risk" },
];

const TEST_PROVIDERS = [
  "Embark",
  "Wisdom Panel",
  "UC Davis VGL",
  "Paw Print Genetics",
  "Animal Genetics",
  "GenSol",
  "Optimal Selection",
  "Other",
];

function createEmptyEntry(): ResultEntry {
  return {
    id: crypto.randomUUID(),
    marker: null,
    allele1: "",
    allele2: "",
    status: "",
    rawValue: "",
    testProvider: "",
    testDate: "",
  };
}

export function AddGeneticResultDialog({
  open,
  onClose,
  animalId,
  animalName,
  species,
  breeds,
  markers,
  onSave,
}: AddGeneticResultDialogProps) {
  const [entries, setEntries] = React.useState<ResultEntry[]>([createEmptyEntry()]);
  const [testProvider, setTestProvider] = React.useState("");
  const [testDate, setTestDate] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  // Reset when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setEntries([createEmptyEntry()]);
      setTestProvider("");
      setTestDate("");
      setError("");
    }
  }, [open]);

  const updateEntry = (id: string, updates: Partial<ResultEntry>) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => {
      const filtered = prev.filter((e) => e.id !== id);
      // Always keep at least one entry
      return filtered.length > 0 ? filtered : [createEmptyEntry()];
    });
  };

  const addEntry = () => {
    setEntries((prev) => [...prev, createEmptyEntry()]);
  };

  const handleMarkerSelect = (id: string, marker: GeneticMarker) => {
    updateEntry(id, {
      marker,
      // Reset values when marker changes
      allele1: "",
      allele2: "",
      status: "",
      rawValue: "",
    });
  };

  const handleSave = async () => {
    // Validate entries
    const validEntries = entries.filter((e) => e.marker !== null);
    if (validEntries.length === 0) {
      setError("Please select at least one genetic marker");
      return;
    }

    // Check that all entries have required values based on input type
    for (const entry of validEntries) {
      if (!entry.marker) continue;

      if (entry.marker.inputType === "allele_pair") {
        if (!entry.allele1 || !entry.allele2) {
          setError(`Please enter both alleles for ${entry.marker.commonName}`);
          return;
        }
      } else if (entry.marker.inputType === "status") {
        if (!entry.status) {
          setError(`Please select a status for ${entry.marker.commonName}`);
          return;
        }
      }
    }

    setSaving(true);
    setError("");

    try {
      const results: CreateGeneticResultInput[] = validEntries.map((entry) => ({
        markerId: entry.marker!.id,
        allele1: entry.marker!.inputType === "allele_pair" ? entry.allele1 : undefined,
        allele2: entry.marker!.inputType === "allele_pair" ? entry.allele2 : undefined,
        status: entry.marker!.inputType === "status" ? (entry.status as GeneticResultStatus) : undefined,
        rawValue: entry.rawValue || undefined,
        testProvider: testProvider || undefined,
        testDate: testDate || undefined,
      }));

      await onSave(results);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save results");
    } finally {
      setSaving(false);
    }
  };

  // Get markers that haven't been selected yet
  const availableMarkers = React.useMemo(() => {
    const selectedIds = new Set(entries.filter((e) => e.marker).map((e) => e.marker!.id));
    return markers.filter((m) => !selectedIds.has(m.id));
  }, [markers, entries]);

  const validEntryCount = entries.filter((e) => e.marker !== null).length;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add Genetic Test Results"
      size="lg"
    >
      <div className="flex flex-col min-h-[750px]">
        {/* Main content area */}
        <div className="flex-1 space-y-6">
          {/* Intro text */}
          <p className="text-sm text-secondary">
            Add genetic test results for <strong>{animalName}</strong>. Search for markers by name, code, or gene.
          </p>

          {/* Shared test info */}
          <div className="p-4 bg-surface-alt rounded-lg space-y-4">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Test Information (Optional)
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-secondary block mb-1">Test Provider</label>
              <select
                value={testProvider}
                onChange={(e) => setTestProvider(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-hairline rounded-md text-sm"
              >
                <option value="">Select provider...</option>
                {TEST_PROVIDERS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-secondary block mb-1">Test Date</label>
              <Input
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          </div>

          {/* Results entries */}
          <div className="space-y-4">
          <h4 className="font-medium text-sm">Test Results</h4>

          {entries.map((entry, index) => (
            <div
              key={entry.id}
              className="p-4 border border-hairline rounded-lg space-y-3"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <label className="text-xs text-secondary block mb-1">
                    Marker {entries.length > 1 ? `#${index + 1}` : ""}
                  </label>
                  <GeneticMarkerPicker
                    markers={entry.marker ? [...availableMarkers, entry.marker] : availableMarkers}
                    selectedMarker={entry.marker}
                    onSelect={(marker) => handleMarkerSelect(entry.id, marker)}
                    onClear={() => updateEntry(entry.id, { marker: null })}
                    species={species}
                    breeds={breeds}
                    placeholder="Search markers by name, code, or gene..."
                  />
                </div>

                {entries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEntry(entry.id)}
                    className="p-2 text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded transition-colors mt-5"
                    title="Remove this entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Result value input - shows based on marker input type */}
              {entry.marker && (
                <div className="pt-2 border-t border-hairline">
                  {entry.marker.inputType === "allele_pair" && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="text-xs text-secondary block mb-1">Allele 1</label>
                        <Input
                          value={entry.allele1}
                          onChange={(e) => updateEntry(entry.id, { allele1: e.target.value.toUpperCase() })}
                          placeholder="e.g., E, N, ky"
                          className="font-mono"
                        />
                      </div>
                      <span className="text-lg text-secondary mt-5">/</span>
                      <div className="flex-1">
                        <label className="text-xs text-secondary block mb-1">Allele 2</label>
                        <Input
                          value={entry.allele2}
                          onChange={(e) => updateEntry(entry.id, { allele2: e.target.value.toLowerCase() })}
                          placeholder="e.g., e, N, ky"
                          className="font-mono"
                        />
                      </div>
                      <div className="flex-shrink-0 mt-5 px-3 py-2 bg-surface-alt rounded font-mono text-sm">
                        {entry.allele1 && entry.allele2 ? `${entry.allele1}/${entry.allele2}` : "—/—"}
                      </div>
                    </div>
                  )}

                  {entry.marker.inputType === "status" && (
                    <div>
                      <label className="text-xs text-secondary block mb-1">Result Status</label>
                      <div className="flex flex-wrap gap-2">
                        {RESULT_STATUS_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => updateEntry(entry.id, { status: option.value })}
                            className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                              entry.status === option.value
                                ? option.value === "clear"
                                  ? "bg-green-100 dark:bg-green-900 border-green-500 text-green-700 dark:text-green-300"
                                  : option.value === "carrier"
                                  ? "bg-yellow-100 dark:bg-yellow-900 border-yellow-500 text-yellow-700 dark:text-yellow-300"
                                  : option.value === "affected" || option.value === "at_risk"
                                  ? "bg-red-100 dark:bg-red-900 border-red-500 text-red-700 dark:text-red-300"
                                  : "bg-brand/10 border-brand text-brand"
                                : "border-hairline hover:border-secondary"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {entry.marker.inputType === "genotype" && (
                    <div>
                      <label className="text-xs text-secondary block mb-1">Genotype</label>
                      <Input
                        value={entry.rawValue}
                        onChange={(e) => updateEntry(entry.id, { rawValue: e.target.value })}
                        placeholder="e.g., ky/ky"
                        className="font-mono"
                      />
                    </div>
                  )}

                  {entry.marker.inputType === "text" && (
                    <div>
                      <label className="text-xs text-secondary block mb-1">Value</label>
                      <Input
                        value={entry.rawValue}
                        onChange={(e) => updateEntry(entry.id, { rawValue: e.target.value })}
                        placeholder="Enter result value"
                      />
                    </div>
                  )}

                  {entry.marker.inputType === "percentage" && (
                    <div>
                      <label className="text-xs text-secondary block mb-1">Percentage</label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={entry.rawValue}
                          onChange={(e) => updateEntry(entry.id, { rawValue: e.target.value })}
                          placeholder="0-100"
                          className="w-24"
                        />
                        <span className="text-secondary">%</span>
                      </div>
                    </div>
                  )}

                  {/* Health warning for certain markers */}
                  {entry.marker.category === "health" && entry.status === "affected" && (
                    <div className="mt-3 p-2 bg-red-50 dark:bg-red-950 rounded-md flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-700 dark:text-red-300">
                        This marker indicates an affected status. Consider consulting with a veterinary geneticist for breeding decisions.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Add another button */}
          <button
            type="button"
            onClick={addEntry}
            className="w-full py-3 border-2 border-dashed border-hairline rounded-lg text-secondary hover:text-primary hover:border-secondary transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Another Marker
          </button>
        </div>

          {/* Error display */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Actions - pinned to bottom */}
        <div className="flex items-center justify-between pt-4 mt-auto border-t border-hairline">
          <div className="text-sm text-secondary">
            {validEntryCount > 0 && (
              <span>{validEntryCount} result{validEntryCount !== 1 ? "s" : ""} to save</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || validEntryCount === 0}>
              {saving ? "Saving..." : `Save ${validEntryCount > 0 ? validEntryCount : ""} Result${validEntryCount !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
