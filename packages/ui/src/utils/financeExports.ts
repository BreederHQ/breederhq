// packages/ui/src/utils/financeExports.ts
// CSV export helpers for finance data

import { exportToCsv } from "./csvExport";
import { formatCents } from "./money";

export interface Invoice {
  id: number;
  invoiceNumber?: string;
  clientPartyId?: number;
  clientPartyName?: string;
  totalCents: number;
  balanceCents?: number;
  status?: string;
  issuedAt?: string;
  dueAt?: string;
  createdAt?: string;
  animalId?: number;
  offspringId?: number;
  offspringGroupId?: number;
  breedingPlanId?: number;
  serviceCode?: string;
  notes?: string;
}

export interface Payment {
  id: number;
  invoiceId?: number;
  invoiceNumber?: string;
  clientPartyName?: string;
  amountCents: number;
  receivedAt?: string;
  methodType?: string;
  processor?: string;
  referenceNumber?: string;
  checkNumber?: string;
  attachmentCount?: number; // Number of receipt attachments
  createdAt?: string;
}

export interface Expense {
  id: number;
  category?: string;
  amountCents: number;
  incurredAt?: string;
  vendorPartyId?: number;
  vendorPartyName?: string;
  animalId?: number;
  offspringId?: number;
  offspringGroupId?: number;
  breedingPlanId?: number;
  description?: string;
  notes?: string;
  attachmentCount?: number; // Number of receipt attachments
  createdAt?: string;
}

/**
 * Determine the anchor type and ID from an invoice or expense
 */
function getAnchorInfo(record: Invoice | Expense): { anchorType: string; anchorId: string } {
  if (record.animalId) return { anchorType: "Animal", anchorId: String(record.animalId) };
  if (record.offspringId) return { anchorType: "Offspring", anchorId: String(record.offspringId) };
  if (record.offspringGroupId)
    return { anchorType: "OffspringGroup", anchorId: String(record.offspringGroupId) };
  if (record.breedingPlanId)
    return { anchorType: "BreedingPlan", anchorId: String(record.breedingPlanId) };
  return { anchorType: "", anchorId: "" };
}

/**
 * Export invoices to CSV
 */
export function exportInvoicesCSV(invoices: Invoice[], filename = "invoices"): void {
  exportToCsv({
    filename,
    rows: invoices,
    columns: [
      { key: "invoiceNumber", label: "Invoice Number" },
      { key: "clientName", label: "Client Name" },
      { key: "anchorType", label: "Anchor Type" },
      { key: "anchorId", label: "Anchor ID" },
      { key: "totalCents", label: "Total" },
      { key: "status", label: "Status" },
      { key: "issuedAt", label: "Issued Date" },
      { key: "dueAt", label: "Due Date" },
      { key: "createdAt", label: "Created Date" },
    ],
    formatValue: (value, key, row) => {
      // Handle money formatting
      if (key === "totalCents") {
        return formatCents(row.totalCents);
      }

      // Handle client name
      if (key === "clientName") {
        return row.clientPartyName || "";
      }

      // Handle anchor type
      if (key === "anchorType") {
        const { anchorType } = getAnchorInfo(row);
        return anchorType;
      }

      // Handle anchor ID
      if (key === "anchorId") {
        const { anchorId } = getAnchorInfo(row);
        return anchorId;
      }

      // Handle dates
      if ((key === "issuedAt" || key === "dueAt" || key === "createdAt") && value) {
        return new Date(value).toLocaleDateString();
      }

      return value != null ? String(value) : "";
    },
  });
}

/**
 * Export payments to CSV
 */
export function exportPaymentsCSV(payments: Payment[], filename = "payments"): void {
  exportToCsv({
    filename,
    rows: payments,
    columns: [
      { key: "invoiceNumber", label: "Invoice Number" },
      { key: "invoiceId", label: "Invoice ID" },
      { key: "clientPartyName", label: "Client Name" },
      { key: "amountCents", label: "Amount" },
      { key: "receivedAt", label: "Received Date" },
      { key: "methodType", label: "Method" },
      { key: "processor", label: "Processor" },
      { key: "reference", label: "Reference" },
      { key: "hasReceipt", label: "Has Receipt" },
      { key: "receiptCount", label: "Receipt Count" },
      { key: "createdAt", label: "Created Date" },
    ],
    formatValue: (value, key, row) => {
      // Handle money formatting
      if (key === "amountCents") {
        return formatCents(row.amountCents);
      }

      // Handle reference (could be referenceNumber or checkNumber)
      if (key === "reference") {
        return row.referenceNumber || row.checkNumber || "";
      }

      // Handle receipt indicators
      if (key === "hasReceipt") {
        return (row.attachmentCount ?? 0) > 0 ? "Yes" : "No";
      }
      if (key === "receiptCount") {
        return String(row.attachmentCount ?? 0);
      }

      // Handle dates
      if ((key === "receivedAt" || key === "createdAt") && value) {
        return new Date(value).toLocaleDateString();
      }

      return value != null ? String(value) : "";
    },
  });
}

/**
 * Export expenses to CSV
 */
export function exportExpensesCSV(expenses: Expense[], filename = "expenses"): void {
  exportToCsv({
    filename,
    rows: expenses,
    columns: [
      { key: "category", label: "Category" },
      { key: "amountCents", label: "Amount" },
      { key: "incurredAt", label: "Incurred Date" },
      { key: "vendorName", label: "Vendor" },
      { key: "anchorType", label: "Anchor Type" },
      { key: "anchorId", label: "Anchor ID" },
      { key: "hasReceipt", label: "Has Receipt" },
      { key: "receiptCount", label: "Receipt Count" },
      { key: "notes", label: "Notes" },
      { key: "createdAt", label: "Created Date" },
    ],
    formatValue: (value, key, row) => {
      // Handle money formatting
      if (key === "amountCents") {
        return formatCents(row.amountCents);
      }

      // Handle vendor name
      if (key === "vendorName") {
        return row.vendorPartyName || "";
      }

      // Handle anchor type
      if (key === "anchorType") {
        const { anchorType } = getAnchorInfo(row);
        return anchorType;
      }

      // Handle anchor ID
      if (key === "anchorId") {
        const { anchorId } = getAnchorInfo(row);
        return anchorId;
      }

      // Handle receipt indicators
      if (key === "hasReceipt") {
        return (row.attachmentCount ?? 0) > 0 ? "Yes" : "No";
      }
      if (key === "receiptCount") {
        return String(row.attachmentCount ?? 0);
      }

      // Handle notes (could be description or notes)
      if (key === "notes") {
        return row.description || row.notes || "";
      }

      // Handle dates
      if ((key === "incurredAt" || key === "createdAt") && value) {
        return new Date(value).toLocaleDateString();
      }

      return value != null ? String(value) : "";
    },
  });
}
