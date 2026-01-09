// packages/ui/src/components/Finance/ExpenseModal.tsx
// Modal for creating or editing expenses with delete confirmation

import * as React from "react";
import { Dialog } from "../Dialog";
import { Button } from "../Button";
import { Input } from "../Input";
import { DatePicker } from "../DatePicker";
import { useToast } from "../../atoms/Toast";
import { PartyAutocomplete, type AutocompleteOption } from "./PartyAutocomplete";
import { AnimalAutocomplete } from "./AnimalAutocomplete";
import { OffspringGroupAutocomplete } from "./OffspringGroupAutocomplete";
import { BreedingPlanAutocomplete } from "./BreedingPlanAutocomplete";
import { parseToCents, centsToInput } from "../../utils/money";
import { ReceiptsSection } from "./ReceiptsSection";

type ExpenseCategory =
  | "VET"
  | "SUPPLIES"
  | "FOOD"
  | "GROOMING"
  | "BREEDING"
  | "FACILITY"
  | "MARKETING"
  | "LABOR"
  | "INSURANCE"
  | "REGISTRATION"
  | "TRAVEL"
  | "OTHER";

type CreateExpenseInput = {
  category: ExpenseCategory;
  amountCents: number;
  incurredAt: string;
  vendorPartyId?: number | null;
  animalId?: number | null;
  offspringId?: number | null;
  offspringGroupId?: number | null;
  breedingPlanId?: number | null;
  description?: string | null;
  receiptUrl?: string | null;
  notes?: string | null;
};

type UpdateExpenseInput = Partial<CreateExpenseInput>;

export interface ExpenseModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  api: any;
  expense?: any | null; // If provided, edit mode; otherwise create mode
  defaultAnchor?: {
    animalId?: number;
    offspringGroupId?: number;
    breedingPlanId?: number;
  };
}

type AnchorType = "animal" | "offspringGroup" | "breedingPlan" | null;

interface FormState {
  category: ExpenseCategory;
  amountInput: string;
  incurredAt: string;
  vendorParty: AutocompleteOption | null;
  anchorType: AnchorType;
  animal: AutocompleteOption | null;
  offspringGroup: AutocompleteOption | null;
  breedingPlan: AutocompleteOption | null;
  description: string;
  notes: string;
}

interface Errors {
  category?: string;
  amount?: string;
  incurredAt?: string;
}

export function ExpenseModal({
  open,
  onClose,
  onSuccess,
  api,
  expense,
  defaultAnchor,
}: ExpenseModalProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [errors, setErrors] = React.useState<Errors>({});

  const isEditMode = !!expense;

  // Determine locked anchor
  const anchorLocked = !!(
    defaultAnchor?.animalId ||
    defaultAnchor?.offspringGroupId ||
    defaultAnchor?.breedingPlanId
  );

  const initialAnchorType: AnchorType = React.useMemo(() => {
    if (expense) {
      if (expense.animalId) return "animal";
      if (expense.offspringGroupId) return "offspringGroup";
      if (expense.breedingPlanId) return "breedingPlan";
    } else if (defaultAnchor) {
      if (defaultAnchor.animalId) return "animal";
      if (defaultAnchor.offspringGroupId) return "offspringGroup";
      if (defaultAnchor.breedingPlanId) return "breedingPlan";
    }
    return null;
  }, [expense, defaultAnchor]);

  const [form, setForm] = React.useState<FormState>({
    category: "OTHER",
    amountInput: "",
    incurredAt: new Date().toISOString().slice(0, 10),
    vendorParty: null,
    anchorType: initialAnchorType,
    animal: null,
    offspringGroup: null,
    breedingPlan: null,
    description: "",
    notes: "",
  });

  // Initialize form when modal opens or expense changes
  React.useEffect(() => {
    if (open) {
      if (expense) {
        // Edit mode: populate form
        setForm({
          category: expense.category || "OTHER",
          amountInput: centsToInput(expense.amountCents),
          incurredAt: expense.incurredAt ? expense.incurredAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
          vendorParty: expense.vendorPartyId
            ? { id: expense.vendorPartyId, label: expense.vendorPartyName || `Party ${expense.vendorPartyId}` }
            : null,
          anchorType: initialAnchorType,
          animal: expense.animalId ? { id: expense.animalId, label: `Animal ${expense.animalId}` } : null,
          offspringGroup: expense.offspringGroupId ? { id: expense.offspringGroupId, label: `Group ${expense.offspringGroupId}` } : null,
          breedingPlan: expense.breedingPlanId ? { id: expense.breedingPlanId, label: `Plan ${expense.breedingPlanId}` } : null,
          description: expense.description || "",
          notes: expense.notes || "",
        });
      } else {
        // Create mode: reset form
        setForm({
          category: "OTHER",
          amountInput: "",
          incurredAt: new Date().toISOString().slice(0, 10),
          vendorParty: null,
          anchorType: initialAnchorType,
          animal: null,
          offspringGroup: null,
          breedingPlan: null,
          description: "",
          notes: "",
        });
      }
      setErrors({});
      setSubmitting(false);
      setDeleting(false);
    }
  }, [open, expense, initialAnchorType]);

  const validate = (): boolean => {
    const errs: Errors = {};

    if (!form.category) {
      errs.category = "Category is required";
    }

    const amountCents = parseToCents(form.amountInput);
    if (!form.amountInput || amountCents <= 0) {
      errs.amount = "Amount must be greater than zero";
    }

    if (!form.incurredAt) {
      errs.incurredAt = "Date is required";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const amountCents = parseToCents(form.amountInput);

      const input: CreateExpenseInput | UpdateExpenseInput = {
        category: form.category,
        amountCents,
        incurredAt: form.incurredAt,
        vendorPartyId: form.vendorParty?.id ? Number(form.vendorParty.id) : null,
        description: form.description || null,
        notes: form.notes || null,
      };

      // Set anchor
      if (defaultAnchor?.animalId) {
        input.animalId = defaultAnchor.animalId;
      } else if (defaultAnchor?.offspringGroupId) {
        input.offspringGroupId = defaultAnchor.offspringGroupId;
      } else if (defaultAnchor?.breedingPlanId) {
        input.breedingPlanId = defaultAnchor.breedingPlanId;
      } else {
        // User-selected anchor (optional for expenses)
        if (form.anchorType === "animal" && form.animal) {
          input.animalId = Number(form.animal.id);
        } else if (form.anchorType === "offspringGroup" && form.offspringGroup) {
          input.offspringGroupId = Number(form.offspringGroup.id);
        } else if (form.anchorType === "breedingPlan" && form.breedingPlan) {
          input.breedingPlanId = Number(form.breedingPlan.id);
        }
      }

      if (isEditMode) {
        await api.finance.expenses.update(expense.id, input);
      } else {
        await api.finance.expenses.create(input);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(`Failed to ${isEditMode ? "update" : "create"} expense:`, err);
      toast.error(err?.message || `Failed to ${isEditMode ? "update" : "create"} expense`);
    } finally{
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!expense?.id) return;
    if (!confirm("Are you sure you want to delete this expense? This action cannot be undone.")) return;

    setDeleting(true);
    try {
      await api.finance.expenses.delete(expense.id);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to delete expense:", err);
      toast.error(err?.message || "Failed to delete expense");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={isEditMode ? "Edit Expense" : "Create Expense"} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-secondary mb-1">Category *</label>
            <select
              className="w-full h-10 px-3 bg-card border border-hairline rounded-md text-sm"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ExpenseCategory }))}
            >
              <option value="VET">Veterinary</option>
              <option value="SUPPLIES">Supplies</option>
              <option value="FOOD">Food</option>
              <option value="GROOMING">Grooming</option>
              <option value="BREEDING">Breeding</option>
              <option value="FACILITY">Facility</option>
              <option value="MARKETING">Marketing</option>
              <option value="LABOR">Labor</option>
              <option value="INSURANCE">Insurance</option>
              <option value="REGISTRATION">Registration</option>
              <option value="TRAVEL">Travel</option>
              <option value="OTHER">Other</option>
            </select>
            {errors.category && <div className="text-xs text-red-400 mt-1">{errors.category}</div>}
          </div>

          <div>
            <label className="block text-xs text-secondary mb-1">Amount *</label>
            <Input
              type="text"
              value={form.amountInput}
              onChange={(e) => setForm((f) => ({ ...f, amountInput: e.target.value }))}
              placeholder="0.00"
            />
            {errors.amount && <div className="text-xs text-red-400 mt-1">{errors.amount}</div>}
          </div>
        </div>

        <div>
          <label className="block text-xs text-secondary mb-1">Date Incurred *</label>
          <DatePicker
            value={form.incurredAt}
            onChange={(e) => setForm((f) => ({ ...f, incurredAt: e.currentTarget.value }))}
          />
          {errors.incurredAt && <div className="text-xs text-red-400 mt-1">{errors.incurredAt}</div>}
        </div>

        <PartyAutocomplete
          value={form.vendorParty}
          onChange={(val) => setForm((f) => ({ ...f, vendorParty: val }))}
          api={api}
          label="Vendor (Optional)"
          placeholder="Search for vendor..."
        />

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
              <label className="block text-xs text-secondary mb-1">Link Expense To (Optional)</label>
              <select
                className="w-full h-10 px-3 bg-card border border-hairline rounded-md text-sm"
                value={form.anchorType || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, anchorType: (e.target.value || null) as AnchorType }))
                }
              >
                <option value="">None</option>
                <option value="animal">Animal</option>
                <option value="offspringGroup">Offspring Group</option>
                <option value="breedingPlan">Breeding Plan</option>
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
          </div>
        )}

        <div>
          <label className="block text-xs text-secondary mb-1">Description</label>
          <Input
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Brief description of expense"
          />
        </div>

        <div>
          <label className="block text-xs text-secondary mb-1">Notes</label>
          <textarea
            className="w-full min-h-[80px] px-3 py-2 bg-card border border-hairline rounded-md text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand-orange))]"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Optional notes..."
          />
        </div>

        {isEditMode && expense && (
          <ReceiptsSection
            label="Receipts"
            entityId={expense.id}
            attachments={api.finance.expenses.attachments}
          />
        )}

        <div className="flex items-center justify-between pt-3 border-t border-hairline">
          <div>
            {isEditMode && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleting || submitting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} disabled={submitting || deleting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || deleting}>
              {submitting ? (isEditMode ? "Saving..." : "Creating...") : isEditMode ? "Save" : "Create"}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
