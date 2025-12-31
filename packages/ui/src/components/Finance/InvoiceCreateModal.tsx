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
import { parseToCents, centsToInput, formatCents } from "../../utils/money";
import type { LineItemKind, CreateLineItemInput } from "@bhq/api";

// Idempotency key generation
function generateIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

type CreateInvoiceInput = {
  clientPartyId: number;
  totalCents?: number;
  dueAt?: string | null;
  issuedAt?: string | null;
  animalId?: number | null;
  offspringId?: number | null;
  offspringGroupId?: number | null;
  breedingPlanId?: number | null;
  serviceCode?: string | null;
  lineItems?: CreateLineItemInput[];
  notes?: string | null;
};

interface LineItemRow {
  tempId: string;
  kind: LineItemKind;
  description: string;
  qty: string;
  unitPrice: string;
}

export interface InvoiceCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  api: any;
  /** Pre-fill and lock the anchor (e.g., when creating from Animal/Offspring/Breeding Plan page) */
  defaultAnchor?: {
    animalId?: number;
    animalName?: string;
    offspringGroupId?: number;
    offspringGroupName?: string;
    breedingPlanId?: number;
    breedingPlanName?: string;
  };
  /** Pre-fill and lock the client party (e.g., when creating from Organization/Contact page) */
  defaultClientParty?: AutocompleteOption | null;
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
  lineItems: LineItemRow[];
}

interface Errors {
  clientParty?: string;
  total?: string;
  issuedAt?: string;
  anchor?: string;
  lineItems?: string;
}

export function InvoiceCreateModal({
  open,
  onClose,
  onSuccess,
  api,
  defaultAnchor,
  defaultClientParty,
}: InvoiceCreateModalProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Errors>({});
  const idempotencyKeyRef = React.useRef<string>("");
  const [confirmCloseOpen, setConfirmCloseOpen] = React.useState(false);

  // Determine if anchor is locked (from entity tab) or requires user selection (from Party tab)
  const anchorLocked = !!(
    defaultAnchor?.animalId ||
    defaultAnchor?.offspringGroupId ||
    defaultAnchor?.breedingPlanId
  );

  // Determine if client party is locked (from Organization/Contact page)
  const clientPartyLocked = !!defaultClientParty;

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
    lineItems: [
      {
        tempId: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-0`,
        kind: "OTHER" as LineItemKind,
        description: "",
        qty: "1",
        unitPrice: "",
      },
    ],
  });

  // Reset form when modal opens
  React.useEffect(() => {
    if (open) {
      idempotencyKeyRef.current = generateIdempotencyKey();
      setForm({
        clientParty: defaultClientParty || null,
        totalInput: "",
        issuedAt: new Date().toISOString().slice(0, 10),
        dueAt: "",
        notes: "",
        anchorType: initialAnchorType,
        animal: null,
        offspringGroup: null,
        breedingPlan: null,
        serviceCode: "",
        lineItems: [
          {
            tempId: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-0`,
            kind: "OTHER" as LineItemKind,
            description: "",
            qty: "1",
            unitPrice: "",
          },
        ],
      });
      setErrors({});
      setSubmitting(false);
      setConfirmCloseOpen(false);
    }
  }, [open, initialAnchorType, defaultClientParty]);

  // Compute dirty state - form has unsaved changes
  const isDirty = React.useMemo(() => {
    // Check if client party was changed (only if not pre-filled)
    if (!clientPartyLocked && form.clientParty !== null) return true;

    // Check if any line item has data
    const hasLineItemData = form.lineItems.some(
      (item) => item.description.trim() !== "" || item.unitPrice.trim() !== ""
    );
    if (hasLineItemData) return true;

    // Check dates (issuedAt defaults to today, so only check if changed from today or if dueAt set)
    const today = new Date().toISOString().slice(0, 10);
    if (form.issuedAt !== today) return true;
    if (form.dueAt.trim() !== "") return true;

    // Check notes
    if (form.notes.trim() !== "") return true;

    // Check anchor selection (only if not locked)
    if (!anchorLocked) {
      if (form.anchorType !== initialAnchorType) return true;
      if (form.animal !== null) return true;
      if (form.offspringGroup !== null) return true;
      if (form.breedingPlan !== null) return true;
      if (form.serviceCode.trim() !== "") return true;
    }

    return false;
  }, [form, clientPartyLocked, anchorLocked, initialAnchorType]);

  // Handle close request - check for unsaved changes
  const handleRequestClose = React.useCallback(() => {
    if (isDirty) {
      setConfirmCloseOpen(true);
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  const handleConfirmClose = () => {
    setConfirmCloseOpen(false);
    onClose();
  };

  // Line item helpers
  const computeLineTotal = (item: LineItemRow): number => {
    const qty = Number(item.qty) || 0;
    const unitCents = parseToCents(item.unitPrice);
    const total = qty * unitCents;

    // Apply sign logic: DISCOUNT reduces total
    if (item.kind === "DISCOUNT") {
      return -Math.abs(total);
    }

    return total;
  };

  const computeSubtotal = (): number => {
    return form.lineItems.reduce((sum, item) => sum + computeLineTotal(item), 0);
  };

  const addLineItem = () => {
    setForm((f) => ({
      ...f,
      lineItems: [
        ...f.lineItems,
        {
          tempId: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${f.lineItems.length}`,
          kind: "OTHER" as LineItemKind,
          description: "",
          qty: "1",
          unitPrice: "",
        },
      ],
    }));
  };

  const removeLineItem = (tempId: string) => {
    setForm((f) => ({
      ...f,
      lineItems: f.lineItems.filter((item) => item.tempId !== tempId),
    }));
  };

  const updateLineItem = (tempId: string, field: keyof LineItemRow, value: string) => {
    setForm((f) => ({
      ...f,
      lineItems: f.lineItems.map((item) =>
        item.tempId === tempId ? { ...item, [field]: value } : item
      ),
    }));
  };

  const validate = (): boolean => {
    const errs: Errors = {};

    if (!form.clientParty) {
      errs.clientParty = "Client contact or organization is required";
    }

    // Validate line items
    if (form.lineItems.length === 0) {
      errs.lineItems = "At least one line item is required";
    } else {
      for (const item of form.lineItems) {
        if (!item.description.trim()) {
          errs.lineItems = "All line items must have a description";
          break;
        }
        const qty = Number(item.qty);
        if (!qty || qty < 1) {
          errs.lineItems = "All line items must have quantity >= 1";
          break;
        }
        const unitCents = parseToCents(item.unitPrice);
        if (isNaN(unitCents)) {
          errs.lineItems = "All line items must have valid unit prices";
          break;
        }
      }

      if (!errs.lineItems) {
        const subtotal = computeSubtotal();
        if (subtotal <= 0) {
          errs.lineItems = "Invoice total must be greater than zero";
        }
      }
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
      // Build line items from form
      const lineItems: CreateLineItemInput[] = form.lineItems.map((item) => {
        const qty = Number(item.qty) || 1;
        let unitCents = parseToCents(item.unitPrice);

        // Apply sign logic: DISCOUNT items must have negative unitCents
        if (item.kind === "DISCOUNT") {
          unitCents = -Math.abs(unitCents);
        }

        return {
          kind: item.kind,
          description: item.description,
          qty,
          unitCents,
        };
      });

      const input: CreateInvoiceInput = {
        clientPartyId: Number(form.clientParty!.id),
        lineItems,
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
          input.animalId = Number(form.animal.id);
        } else if (form.anchorType === "offspringGroup" && form.offspringGroup) {
          input.offspringGroupId = Number(form.offspringGroup.id);
        } else if (form.anchorType === "breedingPlan" && form.breedingPlan) {
          input.breedingPlanId = Number(form.breedingPlan.id);
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
        toast.info("Invoice already created (duplicate submission detected)");
        onSuccess(); // Refresh the list
        onClose();
      } else {
        toast.error(err?.message || "Failed to create invoice");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleRequestClose} title="Create Invoice" size="lg">
      <div className="space-y-4">
        <PartyAutocomplete
          value={form.clientParty}
          onChange={(val) => setForm((f) => ({ ...f, clientParty: val }))}
          api={api}
          label="Client Contact / Organization *"
          error={errors.clientParty}
          disabled={clientPartyLocked}
        />

        {/* Line Items Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs text-secondary">Line Items *</label>
            <Button type="button" size="sm" variant="outline" onClick={addLineItem}>
              Add Line Item
            </Button>
          </div>

          {/* Line Items Table */}
          <div className="border border-hairline rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/20 border-b border-hairline">
                  <tr>
                    <th className="text-left py-2 px-2 font-medium text-xs">Kind</th>
                    <th className="text-left py-2 px-2 font-medium text-xs">Description</th>
                    <th className="text-left py-2 px-2 font-medium text-xs w-20">Qty</th>
                    <th className="text-left py-2 px-2 font-medium text-xs w-28">Unit Price</th>
                    <th className="text-right py-2 px-2 font-medium text-xs w-28">Line Total</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {form.lineItems.map((item, idx) => (
                    <tr key={item.tempId} className="border-b border-hairline/60 last:border-b-0">
                      <td className="py-2 px-2">
                        <select
                          className="w-full h-8 px-2 bg-card border border-hairline rounded text-xs"
                          value={item.kind}
                          onChange={(e) =>
                            updateLineItem(item.tempId, "kind", e.target.value)
                          }
                        >
                          <option value="OTHER">Other</option>
                          <option value="DEPOSIT">Deposit</option>
                          <option value="SERVICE_FEE">Service Fee</option>
                          <option value="GOODS">Goods</option>
                          <option value="DISCOUNT">Discount</option>
                          <option value="TAX">Tax</option>
                        </select>
                      </td>
                      <td className="py-2 px-2">
                        <Input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            updateLineItem(item.tempId, "description", e.target.value)
                          }
                          placeholder="Description"
                          className="h-8 text-xs"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <Input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => updateLineItem(item.tempId, "qty", e.target.value)}
                          className="h-8 text-xs"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <Input
                          type="text"
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateLineItem(item.tempId, "unitPrice", e.target.value)
                          }
                          placeholder="0.00"
                          className="h-8 text-xs"
                        />
                      </td>
                      <td className="py-2 px-2 text-right text-xs">
                        {formatCents(computeLineTotal(item))}
                      </td>
                      <td className="py-2 px-2">
                        {form.lineItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLineItem(item.tempId)}
                            className="text-red-400 hover:text-red-300 text-xs"
                            aria-label="Remove"
                          >
                            ×
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-secondary">Subtotal:</span>
                <span className="font-semibold">{formatCents(computeSubtotal())}</span>
              </div>
              <div className="flex justify-between border-t border-hairline pt-1">
                <span className="font-medium">Invoice Total:</span>
                <span className="font-semibold">{formatCents(computeSubtotal())}</span>
              </div>
            </div>
          </div>

          {errors.lineItems && <div className="text-xs text-red-400">{errors.lineItems}</div>}
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
              {defaultAnchor?.animalId && (
                <span>Animal: {defaultAnchor.animalName || `ID ${defaultAnchor.animalId}`}</span>
              )}
              {defaultAnchor?.offspringGroupId && (
                <span>Offspring Group: {defaultAnchor.offspringGroupName || `ID ${defaultAnchor.offspringGroupId}`}</span>
              )}
              {defaultAnchor?.breedingPlanId && (
                <span>Breeding Plan: {defaultAnchor.breedingPlanName || `ID ${defaultAnchor.breedingPlanId}`}</span>
              )}
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
          <Button variant="ghost" onClick={handleRequestClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Creating..." : "Create Invoice"}
          </Button>
        </div>
      </div>

      {/* Unsaved Changes Confirmation Dialog */}
      <Dialog
        open={confirmCloseOpen}
        onClose={() => setConfirmCloseOpen(false)}
        title="Unsaved Changes"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-secondary">
            You have unsaved changes. Are you sure you want to close this form? Your changes will be lost.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConfirmCloseOpen(false)}
            >
              Keep Editing
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleConfirmClose}
            >
              Discard Changes
            </Button>
          </div>
        </div>
      </Dialog>
    </Dialog>
  );
}
