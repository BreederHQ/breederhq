// packages/api/src/resources/portal-data.ts
// Portal Data resource for read-only client portal value surfaces

import type { Http } from "../http";

// Agreements types
// ContractStatus matches Prisma schema enum (lowercase)
export type ContractStatus = "draft" | "sent" | "viewed" | "signed" | "declined" | "voided" | "expired";
export type ContractPartyRole = "SELLER" | "BUYER" | "GUARANTOR" | "WITNESS";

export interface AgreementDTO {
  id: number;
  name: string;
  status: ContractStatus;
  effectiveDate: string | null;
  expirationDate: string | null;
  role: ContractPartyRole;
  signedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgreementsResponse {
  agreements: AgreementDTO[];
}

export interface AgreementPartyDTO {
  role: string;
  name: string;
  signedAt: string | null;
}

export interface AgreementDetailDTO {
  id: number;
  title: string;
  status: ContractStatus;
  issuedAt: string | null;
  signedAt: string | null;
  voidedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  clientParty: AgreementPartyDTO;
  counterparties: AgreementPartyDTO[];
}

export interface AgreementDetailResponse {
  agreement: AgreementDetailDTO;
}

// Documents types
export type DocumentCategory = "CONTRACT" | "HEALTH" | "PEDIGREE" | "PHOTO" | "OTHER";
export type DocumentSource = "party" | "offspring";

export interface DocumentDTO {
  id: number;
  name: string;
  description: string | null;
  category: DocumentCategory | null;
  uploadedAt: string;
  fileUrl: string | null; // null when downloads must go through secure endpoint
  mimeType: string | null;
  fileSizeBytes: number | null;
  source: DocumentSource;
  offspringId?: number;
  offspringName?: string;
}

export interface DocumentsResponse {
  documents: DocumentDTO[];
}

// Offspring types
export type PlacementStatus =
  | "WAITLISTED"
  | "RESERVED"
  | "DEPOSIT_PAID"
  | "FULLY_PAID"
  | "READY_FOR_PICKUP"
  | "PLACED"
  | "CANCELLED";

export interface OffspringPlacementDTO {
  id: number;
  offspringGroupId: number;
  offspringGroupCode: string;
  offspringGroupLabel: string | null;
  birthDate: string | null;
  species: string;
  breed: string | null;
  dam: { id: number; name: string } | null;
  sire: { id: number; name: string } | null;
  offspring: {
    id: number;
    name: string;
    sex: string | null;
    // Note: Offspring model does not have color, microchipId, or registrationNumber fields
  } | null;
  placementStatus: PlacementStatus;
  depositPaidAt: string | null;
  fullPricePaidAt: string | null;
  pickedUpAt: string | null;
  createdAt: string;
}

export interface OffspringPlacementsResponse {
  placements: OffspringPlacementDTO[];
}
export interface OffspringDetailDTO {
  id: number;
  name: string;
  sex: string | null;
  breed: string | null;
  species: string;
  birthDate: string | null;
  placementStatus: PlacementStatus;
  dam: { id: number; name: string } | null;
  sire: { id: number; name: string } | null;
  groupId: number;
  groupName: string | null;
  contractSignedAt: string | null;
  paidInFullAt: string | null;
  pickupAt: string | null;
  placedAt: string | null;
  createdAt: string;
}

export interface OffspringDetailResponse {
  offspring: OffspringDetailDTO;
}

// Financial types
export interface FinancialSummary {
  totalPaid: number;
  totalDue: number;
  overdueAmount: number;
  nextPaymentAmount: number | null;
  nextPaymentDueAt: string | null;
  invoiceCount: number;
}

export interface InvoiceLineItemDTO {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceDTO {
  id: number;
  invoiceNumber: string;
  description: string;
  total: number;
  subtotal: number;
  tax: number;
  amountPaid: number;
  amountDue: number;
  status: string;
  issuedAt: string;
  dueAt: string | null;
  paidAt: string | null;
  relatedOffspringName: string | null;
  lineItems: InvoiceLineItemDTO[];
}

export interface InvoicesResponse {
  invoices: InvoiceDTO[];
}

// Checkout types
export interface CheckoutSessionResponse {
  checkoutUrl: string;
  sessionId: string;
}

// Thread types (portal-specific)
export interface PortalThreadDTO {
  id: number;
  subject: string | null;
  lastMessageAt: string | null;
  updatedAt: string;
  participants: Array<{
    partyId: number;
    party: { id: number; name: string; email: string | null; type: string | null };
  }>;
  messages: Array<{
    id: number;
    body: string;
    createdAt: string;
  }>;
  unreadCount: number;
}

export interface PortalThreadsResponse {
  threads: PortalThreadDTO[];
}


export type PortalDataResource = {
  getAgreements(): Promise<AgreementsResponse>;
  getAgreementDetail(id: number): Promise<AgreementDetailResponse>;
  getDocuments(): Promise<DocumentsResponse>;
  getOffspringPlacements(): Promise<OffspringPlacementsResponse>;
  getOffspringDetail(id: number): Promise<OffspringDetailResponse>;
  getPlacements(): Promise<OffspringPlacementsResponse>;
  getFinancials(): Promise<FinancialSummary>;
  getInvoices(): Promise<InvoicesResponse>;
  getInvoice(id: number): Promise<InvoiceDTO>;
  createInvoiceCheckout(invoiceId: number): Promise<CheckoutSessionResponse>;
  getThreads(): Promise<PortalThreadsResponse>;
};

export function makePortalData(http: Http): PortalDataResource {
  return {
    async getAgreements(): Promise<AgreementsResponse> {
      const res = await http.get("/portal/agreements");
      return res as AgreementsResponse;
    },

    async getAgreementDetail(id: number): Promise<AgreementDetailResponse> {
      const res = await http.get(`/portal/agreements/${id}`);
      return res as AgreementDetailResponse;
    },

    async getDocuments(): Promise<DocumentsResponse> {
      const res = await http.get("/portal/documents");
      return res as DocumentsResponse;
    },

    async getOffspringPlacements(): Promise<OffspringPlacementsResponse> {
      const res = await http.get("/portal/offspring");
      return res as OffspringPlacementsResponse;
    },

    async getOffspringDetail(id: number): Promise<OffspringDetailResponse> {
      const res = await http.get(`/portal/offspring/${id}`);
      return res as OffspringDetailResponse;
    },

    async getPlacements(): Promise<OffspringPlacementsResponse> {
      const res = await http.get("/portal/placements");
      return res as OffspringPlacementsResponse;
    },

    async getFinancials(): Promise<FinancialSummary> {
      const res = await http.get("/portal/financials");
      return res as FinancialSummary;
    },

    async getInvoices(): Promise<InvoicesResponse> {
      const res = await http.get("/portal/invoices");
      return res as InvoicesResponse;
    },

    async getInvoice(id: number): Promise<InvoiceDTO> {
      const res = await http.get(`/portal/invoices/${id}`);
      return res as InvoiceDTO;
    },

    async createInvoiceCheckout(invoiceId: number): Promise<CheckoutSessionResponse> {
      const res = await http.post(`/portal/invoices/${invoiceId}/checkout`);
      return res as CheckoutSessionResponse;
    },

    async getThreads(): Promise<PortalThreadsResponse> {
      const res = await http.get("/portal/threads");
      return res as PortalThreadsResponse;
    },
  };
}
