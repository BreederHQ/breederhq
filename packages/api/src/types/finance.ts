// Finance SDK types
// Types for invoices, payments, and expenses

export type ID = string | number;

export interface ListParams {
  q?: string;
  limit?: number;
  offset?: number;
  sort?: string;
  filters?: Record<string, string | number | boolean | null | undefined>;
}

export interface ListResponse<T> {
  items: T[];
  total: number;
}

// ─────────────────── INVOICES ───────────────────

export type InvoiceStatus =
  | "DRAFT"
  | "ISSUED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "VOID";

export interface InvoiceDTO {
  id: ID;
  invoiceNumber: string;
  status: InvoiceStatus;

  // Money fields (in cents)
  totalCents: number;
  paidCents: number;
  balanceCents: number;

  // Dates
  issuedAt: string | null; // ISO
  dueAt: string | null;    // ISO
  voidedAt: string | null; // ISO

  // Party relationship
  clientPartyId: number;
  clientPartyName?: string | null;

  // Anchors (at most one will be set)
  animalId?: number | null;
  offspringId?: number | null;
  offspringGroupId?: number | null;
  breedingPlanId?: number | null;
  serviceCode?: string | null;

  // Metadata
  notes?: string | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface CreateInvoiceInput {
  clientPartyId: number;
  totalCents: number;
  dueAt?: string | null;
  issuedAt?: string | null;

  // Exactly one anchor (or serviceCode)
  animalId?: number | null;
  offspringId?: number | null;
  offspringGroupId?: number | null;
  breedingPlanId?: number | null;
  serviceCode?: string | null;

  notes?: string | null;
}

export interface UpdateInvoiceInput {
  totalCents?: number;
  dueAt?: string | null;
  issuedAt?: string | null;
  notes?: string | null;
}

// ─────────────────── PAYMENTS ───────────────────

export type PaymentMethodType =
  | "CASH"
  | "CHECK"
  | "CREDIT_CARD"
  | "DEBIT_CARD"
  | "ACH"
  | "WIRE"
  | "PAYPAL"
  | "VENMO"
  | "ZELLE"
  | "OTHER";

export interface PaymentDTO {
  id: ID;
  invoiceId: number;
  amountCents: number;
  receivedAt: string; // ISO
  methodType: PaymentMethodType;

  // Optional reference fields
  referenceNumber?: string | null;
  checkNumber?: string | null;
  last4?: string | null;

  notes?: string | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface CreatePaymentInput {
  invoiceId: number;
  amountCents: number;
  receivedAt: string; // ISO
  methodType: PaymentMethodType;

  referenceNumber?: string | null;
  checkNumber?: string | null;
  last4?: string | null;
  notes?: string | null;
}

// ─────────────────── EXPENSES ───────────────────

export type ExpenseCategory =
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

export interface ExpenseDTO {
  id: ID;
  category: ExpenseCategory;
  amountCents: number;
  incurredAt: string; // ISO

  // Optional vendor
  vendorPartyId?: number | null;
  vendorPartyName?: string | null;

  // Anchors (at most one will be set)
  animalId?: number | null;
  offspringId?: number | null;
  offspringGroupId?: number | null;
  breedingPlanId?: number | null;

  description?: string | null;
  receiptUrl?: string | null;
  notes?: string | null;

  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface CreateExpenseInput {
  category: ExpenseCategory;
  amountCents: number;
  incurredAt: string; // ISO

  vendorPartyId?: number | null;

  // Anchor (optional)
  animalId?: number | null;
  offspringId?: number | null;
  offspringGroupId?: number | null;
  breedingPlanId?: number | null;

  description?: string | null;
  receiptUrl?: string | null;
  notes?: string | null;
}

export interface UpdateExpenseInput {
  category?: ExpenseCategory;
  amountCents?: number;
  incurredAt?: string;
  vendorPartyId?: number | null;

  animalId?: number | null;
  offspringId?: number | null;
  offspringGroupId?: number | null;
  breedingPlanId?: number | null;

  description?: string | null;
  receiptUrl?: string | null;
  notes?: string | null;
}

// ─────────────────── IDEMPOTENCY ───────────────────

export interface IdempotencyHeaders {
  "Idempotency-Key": string;
}

/**
 * Generate a unique idempotency key for invoice/payment creation
 */
export function generateIdempotencyKey(): string {
  // Use crypto.randomUUID() if available, fallback to timestamp-based
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}
