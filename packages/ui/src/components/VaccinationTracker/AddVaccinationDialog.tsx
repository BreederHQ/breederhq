// packages/ui/src/components/VaccinationTracker/AddVaccinationDialog.tsx
import * as React from "react";
import { Dialog } from "../Dialog/Dialog";
import { Button } from "../Button/Button";
import { Input } from "../Input/Input";
import { FileText, Syringe, Calendar, Building2, User, Hash } from "lucide-react";
import type { VaccinationProtocol, CreateVaccinationInput } from "@bhq/api";

export interface AddVaccinationDialogProps {
  /** Whether dialog is open */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** Animal name for display */
  animalName: string;
  /** Available vaccination protocols */
  protocols: VaccinationProtocol[];
  /** Pre-selected protocol (when adding from a specific row) */
  selectedProtocol?: VaccinationProtocol | null;
  /** Called when record is saved */
  onSave: (input: CreateVaccinationInput) => Promise<void>;
  /** Whether we're editing an existing record */
  editMode?: boolean;
  /** Existing values when editing */
  existingValues?: Partial<CreateVaccinationInput>;
}

export function AddVaccinationDialog({
  open,
  onClose,
  animalName,
  protocols,
  selectedProtocol,
  onSave,
  editMode = false,
  existingValues,
}: AddVaccinationDialogProps) {
  const [protocolKey, setProtocolKey] = React.useState<string>(
    selectedProtocol?.key || existingValues?.protocolKey || ""
  );
  const [administeredAt, setAdministeredAt] = React.useState<string>(
    existingValues?.administeredAt || new Date().toISOString().split("T")[0]
  );
  const [expiresAt, setExpiresAt] = React.useState<string>(existingValues?.expiresAt || "");
  const [useCustomExpiration, setUseCustomExpiration] = React.useState(!!existingValues?.expiresAt);
  const [veterinarian, setVeterinarian] = React.useState(existingValues?.veterinarian || "");
  const [clinic, setClinic] = React.useState(existingValues?.clinic || "");
  const [batchLotNumber, setBatchLotNumber] = React.useState(existingValues?.batchLotNumber || "");
  const [notes, setNotes] = React.useState(existingValues?.notes || "");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  const currentProtocol = protocols.find((p) => p.key === protocolKey);

  // Calculate default expiration when protocol or date changes
  const calculatedExpiration = React.useMemo(() => {
    if (!currentProtocol || !administeredAt) return "";
    const date = new Date(administeredAt);
    date.setMonth(date.getMonth() + currentProtocol.intervalMonths);
    return date.toISOString().split("T")[0];
  }, [currentProtocol, administeredAt]);

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setProtocolKey(selectedProtocol?.key || existingValues?.protocolKey || "");
      setAdministeredAt(existingValues?.administeredAt || new Date().toISOString().split("T")[0]);
      setExpiresAt(existingValues?.expiresAt || "");
      setUseCustomExpiration(!!existingValues?.expiresAt);
      setVeterinarian(existingValues?.veterinarian || "");
      setClinic(existingValues?.clinic || "");
      setBatchLotNumber(existingValues?.batchLotNumber || "");
      setNotes(existingValues?.notes || "");
      setError("");
    }
  }, [open, selectedProtocol, existingValues]);

  const handleSave = async () => {
    if (!protocolKey) {
      setError("Please select a vaccination type");
      return;
    }
    if (!administeredAt) {
      setError("Please enter the administration date");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const input: CreateVaccinationInput = {
        protocolKey,
        administeredAt,
        expiresAt: useCustomExpiration && expiresAt ? expiresAt : undefined,
        veterinarian: veterinarian || undefined,
        clinic: clinic || undefined,
        batchLotNumber: batchLotNumber || undefined,
        notes: notes || undefined,
      };

      await onSave(input);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save vaccination record");
    } finally {
      setSaving(false);
    }
  };

  const coreProtocols = protocols.filter((p) => p.isCore);
  const nonCoreProtocols = protocols.filter((p) => !p.isCore);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editMode ? "Edit Vaccination Record" : "Add Vaccination Record"}
      size="md"
    >
      <div className="space-y-5">
        <p className="text-sm text-secondary">
          {editMode ? "Update" : "Record"} vaccination for <strong>{animalName}</strong>
        </p>

        {/* Vaccination Type */}
        <div>
          <label className="text-xs text-secondary block mb-1.5">
            Vaccination Type <span className="text-red-500">*</span>
          </label>
          {selectedProtocol ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-surface-alt border border-hairline rounded-md">
              <Syringe className="w-4 h-4 text-brand" />
              <span className="font-medium">{selectedProtocol.name}</span>
              {selectedProtocol.isCore && (
                <span className="text-xs px-1.5 py-0.5 bg-brand/10 text-brand rounded">Core</span>
              )}
            </div>
          ) : (
            <select
              value={protocolKey}
              onChange={(e) => setProtocolKey(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-hairline rounded-md text-sm"
            >
              <option value="">Select vaccination...</option>
              {coreProtocols.length > 0 && (
                <optgroup label="Core Vaccines">
                  {coreProtocols.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {nonCoreProtocols.length > 0 && (
                <optgroup label="Non-Core Vaccines">
                  {nonCoreProtocols.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          )}
          {currentProtocol?.description && (
            <p className="mt-1.5 text-xs text-secondary">{currentProtocol.description}</p>
          )}
        </div>

        {/* Dates Section */}
        <div className="p-4 bg-surface-alt rounded-lg space-y-4">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Dates
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-secondary block mb-1">
                Date Administered <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={administeredAt}
                onChange={(e) => setAdministeredAt(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div>
              <label className="text-xs text-secondary block mb-1">
                Expires
              </label>
              {useCustomExpiration ? (
                <Input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  min={administeredAt}
                />
              ) : (
                <div className="px-3 py-2 bg-surface border border-hairline rounded-md text-sm text-secondary">
                  {calculatedExpiration || "—"}
                </div>
              )}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={useCustomExpiration}
              onChange={(e) => {
                setUseCustomExpiration(e.target.checked);
                if (!e.target.checked) setExpiresAt("");
              }}
              className="rounded border-hairline"
            />
            <span className="text-secondary">Override calculated expiration date</span>
          </label>
        </div>

        {/* Provider Info */}
        <div className="p-4 bg-surface-alt rounded-lg space-y-4">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Provider Information (Optional)
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-secondary block mb-1">
                <User className="w-3 h-3 inline mr-1" />
                Veterinarian
              </label>
              <Input
                value={veterinarian}
                onChange={(e) => setVeterinarian(e.target.value)}
                placeholder="Dr. Smith"
              />
            </div>
            <div>
              <label className="text-xs text-secondary block mb-1">
                <Building2 className="w-3 h-3 inline mr-1" />
                Clinic / Hospital
              </label>
              <Input
                value={clinic}
                onChange={(e) => setClinic(e.target.value)}
                placeholder="Happy Paws Vet"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-secondary block mb-1">
              <Hash className="w-3 h-3 inline mr-1" />
              Batch / Lot Number
            </label>
            <Input
              value={batchLotNumber}
              onChange={(e) => setBatchLotNumber(e.target.value)}
              placeholder="LOT-2024-001"
              className="font-mono"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs text-secondary block mb-1">
            <FileText className="w-3 h-3 inline mr-1" />
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional notes about this vaccination..."
            rows={2}
            className="w-full px-3 py-2 bg-surface border border-hairline rounded-md text-sm resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-hairline">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !protocolKey || !administeredAt}>
            {saving ? "Saving..." : editMode ? "Update Record" : "Add Record"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
