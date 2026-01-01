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

export type PortalDataResource = {
  getAgreements(): Promise<AgreementsResponse>;
  getAgreementDetail(id: number): Promise<AgreementDetailResponse>;
  getDocuments(): Promise<DocumentsResponse>;
  getOffspringPlacements(): Promise<OffspringPlacementsResponse>;
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
  };
}
