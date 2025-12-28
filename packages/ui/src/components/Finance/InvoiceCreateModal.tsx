// packages/ui/src/components/Finance/InvoiceCreateModal.tsx
// Modal for creating a new invoice with anchor selection and idempotency

import * as React from "react";
import { Dialog } from "../Dialog";
import { Button } from "../Button";
import { Input } from "../Input";
import { useToast } from "../../atoms/Toast";
import { PartyAutocomplete, type AutocompleteOption } from "./PartyAutocomplete";
import { AnimalAutocomplete } from "./AnimalAutocomplete";
import { OffspringGroupAutocomplete } from "./OffspringGroupAutocomplete";
import { BreedingPlanAutocomplete } from "./BreedingPlanAutocomplete";
import { parseToCents, centsToInput } from "../../utils/money";

// Idempotency key generation
function generateIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

type CreateInvoiceInput = {
  clientPartyId: number;
  totalCents: number;
  dueAt?: string | null;
  issuedAt?: string | null;
  animalId?: number | null;
  offspringId?: number | null;
  offspringGroupId?: number | null;
  breedingPlanId?: number | null;
  serviceCode?: string | null;
  notes?: string | null;
};

export interface InvoiceCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  api: any;
  defaultAnchor?: {
    animalId?: number;
    offspringGroupId?: number;
    breedingPlanId?: number;
  };
}

type AnchorType = "animal" | "offspringGroup" | "breedingPlan" | "serviceCode" | null;

interface FormState {
  clientParty: AutocompleteOption | null;
  totalInput: string;
  issuedAt: string;
  dueAt: string;
  notes: string;
  anchorType: AnchorType;
  animal: AutocompleteOption | null;
  offspringGroup: AutocompleteOption | null;
  breedingPlan: AutocompleteOption | null;
  serviceCode: string;
}

interface Errors {
  clientParty?: string;
  total?: string;
  issuedAt?: string;
  anchor?: string;
}

export function InvoiceCreateModal({
  open,
  onClose,
  onSuccess,
  api,
  defaultAnchor,
}: InvoiceCreateModalProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Errors>({});
  const idempotencyKeyRef = React.useRef<string>("");

  // Determine if anchor is locked (from entity tab) or requires user selection (from Party tab)
  const anchorLocked = !!(
    defaultAnchor?.animalId ||
    defaultAnchor?.offspringGroupId ||
    defaultAnchor?.breedingPlanId
  );

  const initialAnchorType: AnchorType = React.useMemo(() => {
    if (defaultAnchor?.animalId) return "animal";
    if (defaultAnchor?.offspringGroupId) return "offspringGroup";
    if (defaultAnchor?.breedingPlanId) return "breedingPlan";
    return null;
  }, [defaultAnchor]);

  const [form, setForm] = React.useState<FormState>({
    clientParty: null,
    totalInput: "",
    issuedAt: new Date().toISOString().slice(0, 10),
    dueAt: "",
    notes: "",
    anchorType: initialAnchorType,
    animal: null,
    offspringGroup: null,
    breedingPlan: null,
    serviceCode: "",
  });

  // Reset form when modal opens
  React.useEffect(() => {
    if (open) {
      idempotencyKeyRef.current = generateIdempotencyKey();
      setForm({
        clientParty: null,
        totalInput: "",
        issuedAt: new Date().toISOString().slice(0, 10),
        dueAt: "",
        notes: "",
        anchorType: initialAnchorType,
        animal: null,
        offspringGroup: null,
        breedingPlan: null,
        serviceCode: "",
      });
      setErrors({});
      setSubmitting(false);
    }
  }, [open, initialAnchorType]);

  const validate = (): boolean => {
    const errs: Errors = {};

    if (!form.clientParty) {
      errs.clientParty = "Client contact or organization is required";
    }

    const totalCents = parseToCents(form.totalInput);
    if (!form.totalInput || totalCents <= 0) {
      errs.total = "Total amount must be greater than zero";
    }

    if (!form.issuedAt) {
      errs.issuedAt = "Issued date is required";
    }

    // Anchor validation
    if (!anchorLocked) {
      // If not from entity tab, require user to select exactly one anchor or serviceCode
      const hasAnimal = form.anchorType === "animal" && form.animal;
      const hasOffspringGroup = form.anchorType === "offspringGroup" && form.offspringGroup;
      const hasBreedingPlan = form.anchorType === "breedingPlan" && form.breedingPlan;
      const hasServiceCode = form.anchorType === "serviceCode" && form.serviceCode.trim();

      if (!hasAnimal && !hasOffspringGroup && !hasBreedingPlan && !hasServiceCode) {
        errs.anchor = "Please select an anchor (Animal, Offspring Group, Breeding Plan) or enter a service code";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const totalCents = parseToCents(form.totalInput);

      const input: CreateInvoiceInput = {
        clientPartyId: form.clientParty!.id,
        totalCents,
        issuedAt: form.issuedAt || null,
        dueAt: form.dueAt || null,
        notes: form.notes || null,
      };

      // Set anchor from defaultAnchor (locked) or form selection
      if (defaultAnchor?.animalId) {
        input.animalId = defaultAnchor.animalId;
      } else if (defaultAnchor?.offspringGroupId) {
        input.offspringGroupId = defaultAnchor.offspringGroupId;
      } else if (defaultAnchor?.breedingPlanId) {
        input.breedingPlanId = defaultAnchor.breedingPlanId;
      } else {
        // User-selected anchor
        if (form.anchorType === "animal" && form.animal) {
          input.animalId = form.animal.id;
        } else if (form.anchorType === "offspringGroup" && form.offspringGroup) {
          input.offspringGroupId = form.offspringGroup.id;
        } else if (form.anchorType === "breedingPlan" && form.breedingPlan) {
          input.breedingPlanId = form.breedingPlan.id;
        } else if (form.anchorType === "serviceCode" && form.serviceCode.trim()) {
          input.serviceCode = form.serviceCode.trim();
        }
      }

      await api.finance.invoices.create(input, idempotencyKeyRef.current);

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to create invoice:", err);

      // Handle idempotency conflict (409)
      if (err?.status === 409 || err?.message?.includes("409")) {
        toast({
          title: "Invoice already created",
          description: "This invoice was already created (duplicate submission detected)",
        });
        onSuccess(); // Refresh the list
        onClose();
      } else {
        toast({
          title: "Error",
          description: err?.message || "Failed to create invoice",
          variant: "destructive",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Create Invoice" size="lg">
      <div className="space-y-4">
        <PartyAutocomplete
          value={form.clientParty}
          onChange={(val) => setForm((f) => ({ ...f, clientParty: val }))}
          api={api}
          label="Client Contact / Organization *"
          error={errors.clientParty}
        />

        <div>
          <label className="block text-xs text-secondary mb-1">Total Amount *</label>
          <Input
            type="text"
            value={form.totalInput}
            onChange={(e) => setForm((f) => ({ ...f, totalInput: e.target.value }))}
            placeholder="0.00"
          />
          {errors.total && <div className="text-xs text-red-400 mt-1">{errors.total}</div>}
          <div className="text-xs text-secondary mt-1">Enter amount in dollars (e.g., 123.45)</div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-secondary mb-1">Issued Date *</label>
            <Input
              type="date"
              value={form.issuedAt}
              onChange={(e) => setForm((f) => ({ ...f, issuedAt: e.target.value }))}
            />
            {errors.issuedAt && <div className="text-xs text-red-400 mt-1">{errors.issuedAt}</div>}
          </div>
          <div>
            <label className="block text-xs text-secondary mb-1">Due Date</label>
            <Input
              type="date"
              value={form.dueAt}
              onChange={(e) => setForm((f) => ({ ...f, dueAt: e.target.value }))}
            />
          </div>
        </div>

        {/* Anchor Selection */}
        {anchorLocked ? (
          <div className="p-3 bg-muted/20 rounded-md border border-hairline">
            <div className="text-xs text-secondary mb-1">Linked To</div>
            <div className="text-sm">
              {defaultAnchor?.animalId && `Animal ID: ${defaultAnchor.animalId}`}
              {defaultAnchor?.offspringGroupId && `Offspring Group ID: ${defaultAnchor.offspringGroupId}`}
              {defaultAnchor?.breedingPlanId && `Breeding Plan ID: ${defaultAnchor.breedingPlanId}`}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-secondary mb-1">Link Invoice To *</label>
              <select
                className="w-full h-10 px-3 bg-card border border-hairline rounded-md text-sm"
                value={form.anchorType || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, anchorType: (e.target.value || null) as AnchorType }))
                }
              >
                <option value="">Select...</option>
                <option value="animal">Animal</option>
                <option value="offspringGroup">Offspring Group</option>
                <option value="breedingPlan">Breeding Plan</option>
                <option value="serviceCode">Service Code (Other)</option>
              </select>
            </div>

            {form.anchorType === "animal" && (
              <AnimalAutocomplete
                value={form.animal}
                onChange={(val) => setForm((f) => ({ ...f, animal: val }))}
                api={api}
                label="Animal"
              />
            )}

            {form.anchorType === "offspringGroup" && (
              <OffspringGroupAutocomplete
                value={form.offspringGroup}
                onChange={(val) => setForm((f) => ({ ...f, offspringGroup: val }))}
                api={api}
                label="Offspring Group"
              />
            )}

            {form.anchorType === "breedingPlan" && (
              <BreedingPlanAutocomplete
                value={form.breedingPlan}
                onChange={(val) => setForm((f) => ({ ...f, breedingPlan: val }))}
                api={api}
                label="Breeding Plan"
              />
            )}

            {form.anchorType === "serviceCode" && (
              <div>
                <label className="block text-xs text-secondary mb-1">Service Code</label>
                <Input
                  value={form.serviceCode}
                  onChange={(e) => setForm((f) => ({ ...f, serviceCode: e.target.value }))}
                  placeholder="e.g., STUD-FEE, GROOMING"
                />
              </div>
            )}

            {errors.anchor && <div className="text-xs text-red-400">{errors.anchor}</div>}
          </div>
        )}

        <div>
          <label className="block text-xs text-secondary mb-1">Notes</label>
          <textarea
            className="w-full min-h-[80px] px-3 py-2 bg-card border border-hairline rounded-md text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand-orange))]"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Optional notes..."
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-hairline">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Creating..." : "Create Invoice"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
